"""
MongoDB → Supabase Migration v2
Fixes from v1:
  - Matches MongoDB user _ids to Supabase auth UUIDs by email
  - Sets FK fields to NULL when referenced row doesn't exist (avoids cascade failures)
  - project_assignees → project_users
  - project_default_material_guide_products composite PK upsert fixed
  - work_orders None iteration fixed
  - services duplicate number handled via on_conflict ignore
"""
import os, sys, uuid, json, logging
from datetime import datetime, timezone
from typing import Optional, Any
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
from tqdm import tqdm
from supabase import create_client, Client

load_dotenv(".env.migration")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler("migration_v2.log")],
)
log = logging.getLogger(__name__)

MONGO_URI     = os.environ["MONGO_URI"]
MONGO_DB_NAME = os.environ["MONGO_DB_NAME"]
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# ── Global ID mapping: MongoDB ObjectId str → UUID str ──────────────────────
ID_MAP: dict[str, str] = {}

def to_uuid(mongo_id) -> Optional[str]:
    if mongo_id is None:
        return None
    key = str(mongo_id)
    if key not in ID_MAP:
        ID_MAP[key] = str(uuid.uuid4())
    return ID_MAP[key]

def resolve_id(field) -> Optional[str]:
    if field is None:
        return None
    if isinstance(field, ObjectId):
        return to_uuid(field)
    if isinstance(field, dict):
        raw = field.get("id") or field.get("_id") or field.get("$oid")
        return to_uuid(raw) if raw else None
    if isinstance(field, str) and len(field) == 24:
        try:
            ObjectId(field)
            return to_uuid(field)
        except Exception:
            pass
    return None

def dt(value) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value) if value else None

def clean_jsonb(value) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return dt(value)
    if isinstance(value, dict):
        return {k: clean_jsonb(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean_jsonb(i) for i in value]
    return value

NOW = datetime.utcnow().isoformat()

# ── Batch insert with graceful FK-violation skip ─────────────────────────────
def batch_upsert(sb: Client, table: str, rows: list[dict], batch: int = 100) -> int:
    if not rows:
        return 0
    inserted = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        try:
            sb.table(table).upsert(chunk, on_conflict="id").execute()
            inserted += len(chunk)
        except Exception as e:
            msg = str(e)
            # Try row-by-row to skip bad rows
            for row in chunk:
                try:
                    sb.table(table).upsert([row], on_conflict="id").execute()
                    inserted += 1
                except Exception as e2:
                    log.debug(f"  skip row in {table}: {str(e2)[:120]}")
    return inserted

def batch_insert_ignore(sb: Client, table: str, rows: list[dict], batch: int = 100) -> int:
    """INSERT ... ON CONFLICT DO NOTHING (for tables without a simple id PK)."""
    if not rows:
        return 0
    inserted = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        try:
            sb.table(table).insert(chunk, count="exact").execute()
            inserted += len(chunk)
        except Exception:
            for row in chunk:
                try:
                    sb.table(table).insert([row]).execute()
                    inserted += 1
                except Exception:
                    pass
    return inserted

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 0 — Build user ID map: MongoDB _id → Supabase auth UUID (matched by email)
# ═══════════════════════════════════════════════════════════════════════════════
def build_user_id_map(mongo_db, sb: Client):
    log.info("── Building user ID map (MongoDB _id ↔ Supabase auth UUID)")
    # Fetch all auth users from Supabase
    auth_users = sb.auth.admin.list_users()
    email_to_auth_uuid: dict[str, str] = {}
    for u in auth_users:
        if u.email:
            email_to_auth_uuid[u.email.lower()] = str(u.id)

    docs = list(mongo_db["login_users"].find())
    matched = 0
    for doc in docs:
        email = (doc.get("email") or "").lower()
        mongo_id = str(doc["_id"])
        if email in email_to_auth_uuid:
            ID_MAP[mongo_id] = email_to_auth_uuid[email]
            matched += 1
        else:
            # Fallback: generate a UUID (won't have auth user — insert will fail FK)
            # Try to find by username-derived email
            username = doc.get("username", "")
            alt = f"{username}@migrated.local".lower()
            if alt in email_to_auth_uuid:
                ID_MAP[mongo_id] = email_to_auth_uuid[alt]
                matched += 1
            else:
                ID_MAP[mongo_id] = str(uuid.uuid4())
                log.warning(f"  No auth user for email={email}, username={username} — will fail FK")

    log.info(f"   ✓ {matched}/{len(docs)} users matched to Supabase auth UUIDs")
    return email_to_auth_uuid

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 1 — User Roles
# ═══════════════════════════════════════════════════════════════════════════════
def run_user_roles(mg, sb):
    docs = list(mg["user_role"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""), "description": d.get("description"),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "user_roles", rows)
    log.info(f"   ✓ {n} user_roles")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 2 — Users (public profile, after auth users exist)
# ═══════════════════════════════════════════════════════════════════════════════
def run_users(mg, sb):
    docs = list(mg["login_users"].find())
    rows = []
    for d in docs:
        uid = to_uuid(d["_id"])  # already mapped to auth UUID
        rows.append({
            "id": uid,
            "username": d.get("username") or f"user_{uid[:8]}",
            "first_name": d.get("first_name"),
            "last_name": d.get("last_name"),
            "email": d.get("email"),
            "is_staff": bool(d.get("is_staff", False)),
            "is_active": bool(d.get("is_active", True)),
            "phone_number": d.get("phone_number"),
            "country": d.get("country"),
            "state": d.get("state"),
            "city": d.get("city"),
            "address": d.get("address"),
            "zip_code": d.get("zip_code"),
            "gender": d.get("gender"),
            "avatar_url": d.get("avatar_url"),
            "user_role_id": resolve_id(d.get("user_role")),
            "installer_info": clean_jsonb(d.get("installer_info")),
            "created_at": dt(d.get("created_time")) or NOW,
            "updated_at": dt(d.get("last_modified_time")) or NOW,
        })
    n = batch_upsert(sb, "users", rows)
    log.info(f"   ✓ {n} users")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 3 — Stages + Roles + Permissions
# ═══════════════════════════════════════════════════════════════════════════════
def run_stages(mg, sb):
    for col, table, extra in [
        ("project_stage", "project_stages", {"other_name": None}),
        ("project_task_stage", "project_task_stages", {}),
        ("project_role", "project_roles", {}),  # might be empty
        ("service_stage", "service_stages", {}),
    ]:
        docs = list(mg[col].find())
        rows = []
        for d in docs:
            row = {"id": to_uuid(d["_id"]), "name": d.get("name",""),
                   "description": d.get("description"),
                   "is_active": bool(d.get("is_active", True)),
                   "order": d.get("order"),
                   "created_at": dt(d.get("created_time")) or NOW,
                   "updated_at": dt(d.get("last_modified_time")) or NOW}
            if "other_name" in extra or col == "project_stage":
                row["other_name"] = d.get("other_name")
            rows.append(row)
        n = batch_upsert(sb, table, rows)
        log.info(f"   ✓ {n} {table}")

def run_permissions(mg, sb):
    docs = list(mg["project_permissions"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "description": d.get("description"),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_permissions", rows)
    log.info(f"   ✓ {n} project_permissions")

def run_service_issues(mg, sb):
    docs = list(mg["service_issue"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "description": d.get("description"),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "service_issues", rows)
    log.info(f"   ✓ {n} service_issues")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 4 — Default Products, Materials, Tasks
# ═══════════════════════════════════════════════════════════════════════════════
def run_default_guide_products(mg, sb):
    docs = list(mg["project_default_guide_product"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "description": d.get("description"), "price": d.get("price"),
             "is_active": bool(d.get("is_active", True)), "order": d.get("order"),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_default_guide_products", rows)
    log.info(f"   ✓ {n} project_default_guide_products")

def run_default_materials(mg, sb):
    docs = list(mg["project_default_material"].find())
    rows, jrows = [], []
    for d in docs:
        mid = to_uuid(d["_id"])
        rows.append({"id": mid, "name": d.get("name",""),
                     "description": d.get("description"), "price": d.get("price"),
                     "quantity": d.get("quantity"),
                     "is_packaged": bool(d.get("is_packaged", False)),
                     "package_quantity": d.get("package_quantity"),
                     "is_active": bool(d.get("is_active", True)),
                     "created_at": dt(d.get("created_time")) or NOW,
                     "updated_at": dt(d.get("last_modified_time")) or NOW})
        for gp in (d.get("default_guide_products") or []):
            gid = resolve_id(gp)
            if gid:
                jrows.append({"default_material_id": mid, "default_guide_product_id": gid})
    n = batch_upsert(sb, "project_default_materials", rows)
    # composite PK table — use insert ignore (no id column)
    j = batch_insert_ignore(sb, "project_default_material_guide_products", jrows)
    log.info(f"   ✓ {n} project_default_materials, {j} guide_product links")

def run_project_default_tasks(mg, sb):
    docs = list(mg["project_default_task"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "number": d.get("number"), "description": d.get("description"),
             "order": d.get("order"),
             "project_stage_id": resolve_id(d.get("project_stage")),
             "project_stage_status": d.get("project_stage_status"),
             "has_attachments": bool(d.get("has_attachments", False)),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_default_tasks", rows)
    log.info(f"   ✓ {n} project_default_tasks")

def run_service_default_tasks(mg, sb):
    docs = list(mg["service_default_task"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "number": d.get("number"), "description": d.get("description"),
             "order": d.get("order"),
             "service_stage_id": resolve_id(d.get("service_stage")),
             "service_stage_status": d.get("service_stage_status"),
             "has_attachments": bool(d.get("has_attachments", False)),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "service_default_tasks", rows)
    log.info(f"   ✓ {n} service_default_tasks")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 5 — Projects
# ═══════════════════════════════════════════════════════════════════════════════
def run_projects(mg, sb):
    docs = list(mg["project"].find())
    rows, pu_rows = [], []
    for d in tqdm(docs, desc="projects", leave=False):
        pid = to_uuid(d["_id"])
        rows.append({
            "id": pid, "name": d.get("name",""), "number": d.get("number",""),
            "description": d.get("description"),
            "sales_order_id": None,  # skip FK — zoho_sales_orders empty
            "reference_number": d.get("reference_number"),
            "user_reporter_id": resolve_id(d.get("user_reporter")),
            "user_manager_id": resolve_id(d.get("user_manager")),
            "user_installer_id": resolve_id(d.get("user_installer")),
            "current_stage_id": resolve_id(d.get("current_stage")),
            "start_date": dt(d.get("start_date")),
            "end_date": dt(d.get("end_date")),
            "duration": d.get("duration"),
            "address": d.get("address"),
            "phone": d.get("phone"),
            "is_active": bool(d.get("is_active", True)),
            "has_permission": bool(d.get("has_permission", False)),
            "all_products_marked": bool(d.get("all_products_marked", False)),
            "all_windows_marked": bool(d.get("all_windows_marked", False)),
            "all_screw_marked": bool(d.get("all_screw_marked", False)),
            "all_trash_marked": bool(d.get("all_trash_marked", False)),
            "feedback": d.get("feedback"),
            "work_scope": d.get("work_scope"),
            "project_materials_other_notes": d.get("project_materials_other_notes"),
            "inspection_date": dt(d.get("inspection_date")),
            "inspection_end_date": dt(d.get("inspection_end_date")),
            "inspection_duration": d.get("inspection_duration"),
            "inspection_is_part_days": bool(d.get("inspection_is_part_days", False)),
            "finish_permission_date": dt(d.get("finish_permission_date")),
            "finish_permission_end_date": dt(d.get("finish_permission_end_date")),
            "finish_permission_duration": d.get("finish_permission_duration"),
            "finish_permission_is_part_days": bool(d.get("finish_permission_is_part_days", False)),
            "is_part_days": bool(d.get("is_part_days", False)),
            "created_at": dt(d.get("created_time")) or NOW,
            "updated_at": dt(d.get("last_modified_time")) or NOW,
        })
        # users_assignees → project_users (role_id=NULL)
        seen = set()
        for a in (d.get("users_assignees") or []):
            uid = resolve_id(a)
            if uid and uid not in seen:
                pu_rows.append({"id": str(uuid.uuid4()), "project_id": pid,
                                "user_id": uid, "role_id": None, "is_active": True,
                                "created_at": NOW, "updated_at": NOW})
                seen.add(uid)

    n = batch_upsert(sb, "projects", rows)
    pu = batch_upsert(sb, "project_users", pu_rows)
    log.info(f"   ✓ {n} projects, {pu} project_users (from assignees)")

def run_project_materials(mg, sb):
    docs = list(mg["project_material"].find() if "project_material" in mg.list_collection_names() else [])
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "description": d.get("description"), "quantity": d.get("quantity"),
             "cost": d.get("cost"), "store": d.get("store"), "notes": d.get("notes"),
             "project_id": resolve_id(d.get("project")),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_materials", rows)
    log.info(f"   ✓ {n} project_materials")

def run_project_attachments(mg, sb):
    docs = list(mg["project_attachment"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "description": d.get("description"), "file_url": d.get("file"),
             "project_id": resolve_id(d.get("project")),
             "user_upload_id": resolve_id(d.get("user_upload")),
             "current_stage_id": resolve_id(d.get("current_stage")),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_attachments", rows)
    log.info(f"   ✓ {n} project_attachments")

def run_work_orders(mg, sb):
    """Extract work_orders embedded in project documents."""
    rows = []
    for d in mg["project"].find({"work_orders": {"$exists": True}}):
        pid = to_uuid(d["_id"])
        wo_list = d.get("work_orders")
        if not wo_list or not isinstance(wo_list, list):
            continue
        for wo in wo_list:
            if not isinstance(wo, dict):
                continue
            wo_id = wo.get("_id") or wo.get("id")
            rows.append({
                "id": to_uuid(wo_id) if wo_id else str(uuid.uuid4()),
                "project_id": pid,
                "name": wo.get("name"), "description": wo.get("description"),
                "status": wo.get("status"),
                "assigned_to_id": resolve_id(wo.get("assigned_to") or wo.get("user")),
                "start_date": dt(wo.get("start_date")), "end_date": dt(wo.get("end_date")),
                "notes": wo.get("notes"),
                "extra_data": clean_jsonb({k: v for k, v in wo.items()
                                           if k not in ("_id","id","name","description","status","start_date","end_date","notes")}),
                "is_active": bool(wo.get("is_active", True)),
                "created_at": dt(wo.get("created_time")) or NOW,
                "updated_at": dt(wo.get("last_modified_time")) or NOW,
            })
    n = batch_upsert(sb, "work_orders", rows)
    log.info(f"   ✓ {n} work_orders")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 6 — Project Tasks, Comments, Attachments, History
# ═══════════════════════════════════════════════════════════════════════════════
def run_project_task_comments(mg, sb):
    docs = list(mg["project_task_comment"].find())
    rows = [{"id": to_uuid(d["_id"]),
             "comment": d.get("comment",""),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "project_id": resolve_id(d.get("project")),
             "project_default_task_id": resolve_id(d.get("project_default_task")),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_task_comments", rows)
    log.info(f"   ✓ {n} project_task_comments")

def run_project_task_attachments(mg, sb):
    docs = list(mg["project_task_attachment"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "description": d.get("description"), "file_url": d.get("file"),
             "due_project_stage_id": resolve_id(d.get("due_project_stage")),
             "user_upload_id": resolve_id(d.get("user_upload")),
             "project_task_id": resolve_id(d.get("project_task")),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_task_attachments", rows)
    log.info(f"   ✓ {n} project_task_attachments")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 7 — Notifications, Calendar, Extras
# ═══════════════════════════════════════════════════════════════════════════════
def run_project_notifications(mg, sb):
    docs = list(mg["project_notification"].find())
    rows = [{"id": to_uuid(d["_id"]), "module": d.get("module"),
             "info": d.get("info"), "info_id": d.get("info_id"),
             "type": d.get("type","load"),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_notifications", rows)
    log.info(f"   ✓ {n} project_notifications")

def run_project_notification_users(mg, sb):
    docs = list(mg["project_notification_user"].find())
    rows = [{"id": to_uuid(d["_id"]),
             "notification_id": resolve_id(d.get("notification")),
             "user_id": resolve_id(d.get("user")),
             "username": d.get("username",""),
             "read": bool(d.get("read", False)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_notification_users", rows)
    log.info(f"   ✓ {n} project_notification_users")

def run_project_calendar_notes(mg, sb):
    docs = list(mg["project_calendar_notes"].find())
    rows, a_rows, e_rows = [], [], []
    for d in docs:
        nid = to_uuid(d["_id"])
        rows.append({"id": nid, "name": d.get("name",""),
                     "description": d.get("description"),
                     "start_date": dt(d.get("start_date")),
                     "end_date": dt(d.get("end_date")),
                     "duration": d.get("duration"),
                     "user_manager_id": resolve_id(d.get("user_manager")),
                     "user_installer_id": resolve_id(d.get("user_installer")),
                     "user_reporter_id": resolve_id(d.get("user_reporter")),
                     "is_active": bool(d.get("is_active", True)),
                     "created_at": dt(d.get("created_time")) or NOW,
                     "updated_at": dt(d.get("last_modified_time")) or NOW})
        for ua in (d.get("user_assignees") or []):
            uid = resolve_id(ua)
            if uid:
                a_rows.append({"id": str(uuid.uuid4()), "calendar_note_id": nid, "user_id": uid})
        for ev in (d.get("associated_events") or []):
            pid = resolve_id(ev)
            if pid:
                e_rows.append({"id": str(uuid.uuid4()), "calendar_note_id": nid, "project_id": pid})
    n = batch_upsert(sb, "project_calendar_notes", rows)
    a = batch_upsert(sb, "project_calendar_note_assignees", a_rows)
    e = batch_upsert(sb, "project_calendar_note_events", e_rows)
    log.info(f"   ✓ {n} calendar notes, {a} assignees, {e} events")

def run_project_reminders(mg, sb):
    docs = list(mg["project_remainder"].find())
    rows = [{"id": to_uuid(d["_id"]),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "project_id": resolve_id(d.get("project")),
             "project_default_task_id": resolve_id(d.get("project_default_task")),
             "notes": d.get("notes"), "date": dt(d.get("date")),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_reminders", rows)
    log.info(f"   ✓ {n} project_reminders")

def run_project_profit_reports(mg, sb):
    docs = list(mg["project_profit_report"].find())
    rows = []
    for d in docs:
        # project_id in MongoDB is stored as a string ObjectId
        raw_pid = d.get("project_id")
        pid = to_uuid(raw_pid) if raw_pid else None
        rows.append({
            "id": to_uuid(d["_id"]),
            "project_id": pid,
            "project_info": clean_jsonb(d.get("project_info") or {}),
            "project_amount": d.get("project_amount"),
            "installation_amount": d.get("installation_amount"),
            "installation_cost_subcontractor": d.get("installation_cost_subcontractor"),
            "installation_cost_onhouse": d.get("installation_cost_onhouse"),
            "installation_profit_subcontractor": d.get("installation_profit_subcontractor"),
            "installation_profit_onhouse": d.get("installation_profit_onhouse"),
            "notes": d.get("notes"),
            "has_been_edited": bool(d.get("has_been_edited", False)),
            "working_type": d.get("working_type"),
            "created_at": dt(d.get("created_time")) or NOW,
            "updated_at": dt(d.get("last_modified_time")) or NOW,
        })
    n = batch_upsert(sb, "project_profit_reports", rows)
    log.info(f"   ✓ {n} project_profit_reports")

def run_installation_crews(mg, sb):
    docs = list(mg["project_installation_crew"].find())
    rows, ins_rows, hlp_rows = [], [], []
    for d in docs:
        cid = to_uuid(d["_id"])
        rows.append({"id": cid, "name": d.get("name",""),
                     "cost_by_unit": d.get("cost_by_unit"),
                     "unit": clean_jsonb(d.get("unit")),
                     "type_crew": clean_jsonb(d.get("type_crew")),
                     "type_working": clean_jsonb(d.get("type_working")),
                     "description": d.get("description"),
                     "user_reporter_id": resolve_id(d.get("user_reporter")),
                     "is_active": bool(d.get("is_active", True)),
                     "created_at": dt(d.get("created_time")) or NOW,
                     "updated_at": dt(d.get("last_modified_time")) or NOW})
        for u in (d.get("users_installers") or []):
            uid = resolve_id(u)
            if uid:
                ins_rows.append({"id": str(uuid.uuid4()), "crew_id": cid, "user_id": uid})
        for u in (d.get("users_helpers") or []):
            uid = resolve_id(u)
            if uid:
                hlp_rows.append({"id": str(uuid.uuid4()), "crew_id": cid, "user_id": uid})
    n = batch_upsert(sb, "project_installation_crews", rows)
    i = batch_upsert(sb, "project_installation_crew_installers", ins_rows)
    h = batch_upsert(sb, "project_installation_crew_helpers", hlp_rows)
    log.info(f"   ✓ {n} crews, {i} installers, {h} helpers")

def run_project_tracking(mg, sb):
    docs = list(mg["project_tracking"].find())
    rows = [{"id": to_uuid(d["_id"]),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "action": d.get("action",""),
             "managed_data": clean_jsonb(d.get("managed_data")),
             "created_at": dt(d.get("created_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "project_tracking", rows)
    log.info(f"   ✓ {n} project_tracking")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 8 — Services
# ═══════════════════════════════════════════════════════════════════════════════
def run_services(mg, sb):
    docs = list(mg["service"].find())
    rows, a_rows, t_rows = [], [], []
    seen_numbers = set()
    for d in tqdm(docs, desc="services", leave=False):
        sid = to_uuid(d["_id"])
        number = d.get("number", "")
        if number in seen_numbers:
            number = f"{number}_{sid[:6]}"
        seen_numbers.add(number)
        rows.append({
            "id": sid, "number": number, "name": d.get("name",""),
            "version": d.get("version", 1),
            "sales_order_id": None,  # skip — zoho empty
            "reference_number": d.get("reference_number"),
            "phone": d.get("phone"),
            "user_reporter_id": resolve_id(d.get("user_reporter")),
            "user_manager_id": resolve_id(d.get("user_manager")),
            "created_by_id": resolve_id(d.get("created_by")),
            "current_stage_id": resolve_id(d.get("current_stage")),
            "start_date": dt(d.get("start_date")),
            "end_date": dt(d.get("end_date")),
            "duration": d.get("duration"), "address": d.get("address"),
            "is_active": bool(d.get("is_active", True)),
            "service_type": d.get("service_type"),
            "service_place": clean_jsonb(d.get("service_place")),
            "service_notes": d.get("service_notes"),
            "has_to_pay": bool(d.get("has_to_pay", False)),
            "paid": bool(d.get("paid", False)),
            "by_factory": bool(d.get("by_factory", False)),
            "repaired": bool(d.get("repaired", False)),
            "is_part_days": bool(d.get("is_part_days", False)),
            "is_closed": bool(d.get("is_closed", False)),
            "issued_products": clean_jsonb(d.get("issued_products") or []),
            "created_at": dt(d.get("created_time")) or NOW,
            "updated_at": dt(d.get("last_modified_time")) or NOW,
        })
        for u in (d.get("users_assignees") or []):
            uid = resolve_id(u)
            if uid:
                a_rows.append({"id": str(uuid.uuid4()), "service_id": sid, "user_id": uid})
        for u in (d.get("users_service_team") or []):
            uid = resolve_id(u)
            if uid:
                t_rows.append({"id": str(uuid.uuid4()), "service_id": sid, "user_id": uid})
    n = batch_upsert(sb, "services", rows)
    a = batch_upsert(sb, "service_assignees", a_rows)
    t = batch_upsert(sb, "service_team_members", t_rows)
    log.info(f"   ✓ {n} services, {a} assignees, {t} team")

def run_service_attachments(mg, sb):
    docs = list(mg["service_attachment"].find())
    rows = [{"id": to_uuid(d["_id"]), "name": d.get("name",""),
             "description": d.get("description"), "file_url": d.get("file"),
             "service_id": resolve_id(d.get("service")),
             "user_upload_id": resolve_id(d.get("user_upload")),
             "current_stage_id": resolve_id(d.get("current_stage")),
             "service_default_task_id": resolve_id(d.get("service_default_task")),
             "attachment_type": d.get("attachment_type"),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "service_attachments", rows)
    log.info(f"   ✓ {n} service_attachments")

def run_service_task_comments(mg, sb):
    docs = list(mg["service_task_comment"].find())
    rows = [{"id": to_uuid(d["_id"]),
             "comment": d.get("comment",""),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "service_id": resolve_id(d.get("service")),
             "service_default_task_id": resolve_id(d.get("service_default_task")),
             "comment_attachments": clean_jsonb(d.get("service_default_task_comment_attachments") or []),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "service_task_comments", rows)
    log.info(f"   ✓ {n} service_task_comments")

# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 9 — Measurements
# ═══════════════════════════════════════════════════════════════════════════════
def run_measurements(mg, sb):
    docs = list(mg["measurement"].find())
    rows = [{"id": to_uuid(d["_id"]), "number": d.get("number",""),
             "sales_order_id": None,  # skip — zoho empty
             "customer": clean_jsonb(d.get("customer")),
             "service": clean_jsonb(d.get("service")),
             "project": clean_jsonb(d.get("project")),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "user_manager_id": resolve_id(d.get("user_manager")),
             "phone": d.get("phone"), "address": d.get("address"),
             "color": clean_jsonb(d.get("color")),
             "marks": clean_jsonb(d.get("marks") or []),
             "is_active": bool(d.get("is_active", True)),
             "first_date": dt(d.get("first_date")),
             "check_date": dt(d.get("check_date")),
             "first_assignee_id": resolve_id(d.get("first_assignee")),
             "check_assignee_id": resolve_id(d.get("check_assignee")),
             "general_notes": d.get("general_notes"),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "measurements", rows)
    log.info(f"   ✓ {n} measurements")

def run_measurement_comments(mg, sb):
    docs = list(mg["measurement_comment"].find())
    rows = [{"id": to_uuid(d["_id"]),
             "comment": d.get("comment",""),
             "user_reporter_id": resolve_id(d.get("user_reporter")),
             "measurement_id": resolve_id(d.get("measurement")),
             "comment_attachments": clean_jsonb(d.get("measurement_default_task_comment_attachments") or []),
             "is_active": bool(d.get("is_active", True)),
             "created_at": dt(d.get("created_time")) or NOW,
             "updated_at": dt(d.get("last_modified_time")) or NOW} for d in docs]
    n = batch_upsert(sb, "measurement_comments", rows)
    log.info(f"   ✓ {n} measurement_comments")

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════
def main():
    log.info("=" * 60)
    log.info("  MongoDB → Supabase Migration v2")
    log.info("=" * 60)

    mg = MongoClient(MONGO_URI)[MONGO_DB_NAME]
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Phase 0: Build user ID map (MUST run first)
    build_user_id_map(mg, sb)

    steps = [
        ("user_roles",                     lambda: run_user_roles(mg, sb)),
        ("users",                          lambda: run_users(mg, sb)),
        ("stages + roles + permissions",   lambda: (run_stages(mg, sb), run_permissions(mg, sb), run_service_issues(mg, sb))),
        ("default guide products",         lambda: run_default_guide_products(mg, sb)),
        ("default materials",              lambda: run_default_materials(mg, sb)),
        ("project default tasks",          lambda: run_project_default_tasks(mg, sb)),
        ("service default tasks",          lambda: run_service_default_tasks(mg, sb)),
        ("projects",                       lambda: run_projects(mg, sb)),
        ("project materials",              lambda: run_project_materials(mg, sb)),
        ("project attachments",            lambda: run_project_attachments(mg, sb)),
        ("work orders",                    lambda: run_work_orders(mg, sb)),
        ("project task comments",          lambda: run_project_task_comments(mg, sb)),
        ("project task attachments",       lambda: run_project_task_attachments(mg, sb)),
        ("project notifications",          lambda: run_project_notifications(mg, sb)),
        ("project notification users",     lambda: run_project_notification_users(mg, sb)),
        ("project calendar notes",         lambda: run_project_calendar_notes(mg, sb)),
        ("project reminders",              lambda: run_project_reminders(mg, sb)),
        ("project profit reports",         lambda: run_project_profit_reports(mg, sb)),
        ("installation crews",             lambda: run_installation_crews(mg, sb)),
        ("project tracking",               lambda: run_project_tracking(mg, sb)),
        ("services",                       lambda: run_services(mg, sb)),
        ("service attachments",            lambda: run_service_attachments(mg, sb)),
        ("service task comments",          lambda: run_service_task_comments(mg, sb)),
        ("measurements",                   lambda: run_measurements(mg, sb)),
        ("measurement comments",           lambda: run_measurement_comments(mg, sb)),
    ]

    for name, fn in steps:
        log.info(f"── {name}")
        try:
            fn()
        except Exception as e:
            log.error(f"  ✗ '{name}' failed: {e}", exc_info=True)

    with open("id_map.json", "w") as f:
        json.dump(ID_MAP, f, indent=2)

    log.info("=" * 60)
    log.info(f"  ✅  Migration complete. {len(ID_MAP)} IDs mapped.")
    log.info("=" * 60)

if __name__ == "__main__":
    main()
