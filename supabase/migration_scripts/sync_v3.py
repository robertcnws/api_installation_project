"""
sync_v3.py — Full document-by-document sync from MongoDB → Supabase.

Fixes:
  0. Create missing Supabase auth users (manager, office, installer, roly/anniel)
  1. Deduplicate reference tables (project_stages, service_stages, etc.) from double v1+v2 run
  2. service_issues — insert all 6
  3. 6 missing projects — already in Supabase with v1 UUIDs, patch their fields
  4. 47 missing project_task_comments — now that missing users exist
  5. 62 missing project_notification_users
  6. 6 missing project_profit_reports
  7. 18 missing project_tracking entries
  8. 1 missing measurement + 1 measurement_comment
"""

import os, sys, uuid, logging
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S")
log = logging.getLogger(__name__)

load_dotenv(".env.migration")
MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DB  = os.getenv("MONGO_DB_NAME", "db_installation")
SB_URL    = os.getenv("SUPABASE_URL", "")
SB_KEY    = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DEFAULT_PW = os.getenv("MIGRATED_USER_DEFAULT_PASSWORD", "ChangeMe2024!")

mongo = MongoClient(MONGO_URI)
db    = mongo[MONGO_DB]
sb: Client = create_client(SB_URL, SB_KEY)

def new_uuid(): return str(uuid.uuid4())
def to_iso(v):
    if v is None: return None
    if isinstance(v, datetime):
        if v.tzinfo is None: v = v.replace(tzinfo=timezone.utc)
        return v.isoformat()
    return str(v) if not isinstance(v, str) else v

def safe_upsert(table, rows, on_conflict="id", batch=100):
    if not rows: return 0
    total = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        try:
            sb.table(table).upsert(chunk, on_conflict=on_conflict).execute()
            total += len(chunk)
        except Exception:
            for row in chunk:
                try:
                    sb.table(table).upsert([row], on_conflict=on_conflict).execute()
                    total += 1
                except Exception as e:
                    log.warning(f"  skip {table} {row.get('id','?')}: {str(e)[:120]}")
    return total

def safe_insert(table, rows, batch=100):
    if not rows: return 0
    total = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        try:
            sb.table(table).insert(chunk).execute()
            total += len(chunk)
        except Exception:
            for row in chunk:
                try:
                    sb.table(table).insert(row).execute()
                    total += 1
                except Exception as e:
                    log.warning(f"  skip insert {table}: {str(e)[:120]}")
    return total

# ═══════════════════════════════════════════════════════════
# STEP 0: Create missing Supabase auth users
# ═══════════════════════════════════════════════════════════
log.info("── Step 0: Create missing auth users")

# These emails appear in embedded user_reporter fields but have no login_users doc
MISSING_AUTH_USERS = [
    {"email": "manager@newwindowsystem.com",  "username": "manager",  "first_name": "Manager"},
    {"email": "office@newwindowsystem.com",   "username": "office",   "first_name": "Office"},
    {"email": "installer@newwindowsystem.com","username": "installer","first_name": "Installer"},
    # yosbel@newwindowsystem.com is the shared email for roly + anniel
    # Create roly with the real email, anniel with a migration alias
    {"email": "yosbel@newwindowsystem.com",   "username": "roly",     "first_name": "Roly"},
    {"email": "anniel@migrated.local",         "username": "anniel",   "first_name": "Anniel"},
]

# Load existing auth users by email
existing_auth = sb.auth.admin.list_users()
existing_emails = {u.email.lower(): str(u.id) for u in existing_auth if u.email}

NEW_EMAIL_TO_UUID = {}  # email → supabase UUID (newly created or already existing)

for u in MISSING_AUTH_USERS:
    email = u["email"].lower()
    if email in existing_emails:
        log.info(f"   already exists: {email}")
        NEW_EMAIL_TO_UUID[email] = existing_emails[email]
        continue
    try:
        resp = sb.auth.admin.create_user({
            "email": email,
            "password": DEFAULT_PW,
            "email_confirm": True,
            "user_metadata": {"username": u["username"]},
        })
        uid = str(resp.user.id)
        NEW_EMAIL_TO_UUID[email] = uid
        # update public.users row (created by trigger)
        sb.table("users").update({
            "username":   u["username"],
            "first_name": u["first_name"],
            "email":      email,
            "is_active":  True,
        }).eq("id", uid).execute()
        log.info(f"   created: {email} → {uid}")
    except Exception as e:
        log.warning(f"   failed to create {email}: {str(e)[:120]}")

# Reload all auth users → complete email→UUID map
existing_auth = sb.auth.admin.list_users()
EMAIL_TO_UUID = {u.email.lower(): str(u.id) for u in existing_auth if u.email}
# Also alias yosbel@newwindowsystem.com to roly, and map anniel's MongoDB email too
EMAIL_TO_UUID["yosbel@newwindowsystem.com"] = EMAIL_TO_UUID.get("yosbel@newwindowsystem.com",
                                               EMAIL_TO_UUID.get("anniel@migrated.local",""))

log.info(f"   Total email→UUID mappings: {len(EMAIL_TO_UUID)}")

# Build username→UUID map too
USERNAME_TO_UUID = {}
for r in (sb.table("users").select("id,username,email").execute().data or []):
    if r.get("username"): USERNAME_TO_UUID[r["username"]] = r["id"]
    if r.get("email"):    EMAIL_TO_UUID[r["email"].lower()] = r["id"]

def resolve_user(embedded):
    """Resolve a MongoDB DynamicField user reference to a Supabase UUID."""
    if not embedded: return None
    if isinstance(embedded, dict):
        email = (embedded.get("email") or "").lower()
        if email and email in EMAIL_TO_UUID: return EMAIL_TO_UUID[email]
        uname = embedded.get("username","")
        if uname and uname in USERNAME_TO_UUID: return USERNAME_TO_UUID[uname]
    return None

# ═══════════════════════════════════════════════════════════
# STEP 1: Deduplicate reference tables
# Keep the UUID referenced by FK children; delete orphans
# ═══════════════════════════════════════════════════════════
log.info("── Step 1: Deduplicate reference tables")

def dedup_table(table, key_col, fk_usages):
    """
    fk_usages: list of (child_table, fk_column) that reference this table.
    For each duplicate group, keep the UUID used most by child tables. Delete the rest.
    Returns number of rows deleted.
    """
    rows = sb.table(table).select("id," + key_col).execute().data or []
    by_key = {}
    for r in rows:
        k = r.get(key_col)
        by_key.setdefault(k, []).append(r["id"])

    deleted = 0
    for k, ids in by_key.items():
        if len(ids) <= 1: continue
        # Count FK references for each UUID
        usage = {}
        for uid in ids:
            count = 0
            for (ct, cf) in fk_usages:
                try:
                    r2 = sb.table(ct).select("id", count="exact").eq(cf, uid).limit(1).execute()
                    count += (r2.count or 0)
                except Exception:
                    pass
            usage[uid] = count
        # Keep the one with most usage; if tie, keep first alphabetically (v2 is usually larger UUID)
        keep = max(ids, key=lambda x: (usage[x], x))
        for uid in ids:
            if uid == keep: continue
            try:
                sb.table(table).delete().eq("id", uid).execute()
                deleted += 1
            except Exception as e:
                log.warning(f"  could not delete {table}/{uid}: {str(e)[:100]}")
    return deleted

dedup_map = {
    "project_stages":               ("name", [
        ("projects","current_stage_id"),
        ("project_stage_history","stage_id"),
        ("project_default_tasks","project_stage_id"),
        ("project_task_attachments","due_project_stage_id"),
        ("project_attachments","current_stage_id"),
    ]),
    "project_task_stages":          ("name", [
        ("project_tasks","current_stage_id"),
        ("project_task_history","project_stage_initial_id"),
        ("project_task_history","project_stage_final_id"),
    ]),
    "project_permissions":          ("name", [
        ("project_user_permissions","permission_id"),
    ]),
    "service_stages":               ("name", [
        ("services","current_stage_id"),
        ("service_stage_history","stage_id"),
        ("service_attachments","current_stage_id"),
        ("service_default_tasks","service_stage_id"),
    ]),
    "project_default_guide_products": ("name", [
        ("project_default_material_guide_products","default_guide_product_id"),
        ("project_guide_products","guide_product_id"),
    ]),
    "project_default_materials":    ("name", [
        ("project_default_material_guide_products","default_material_id"),
    ]),
    "project_default_tasks":        ("number", [
        ("project_default_task_info","project_default_task_id"),
        ("project_task_comments","project_default_task_id"),
        ("project_reminders","project_default_task_id"),
    ]),
    "service_default_tasks":        ("number", [
        ("service_default_task_info","service_default_task_id"),
        ("service_task_comments","service_default_task_id"),
        ("service_attachments","service_default_task_id"),
    ]),
    "project_notifications":        ("info_id", [
        ("project_notification_users","notification_id"),
    ]),
}

total_deleted = 0
for table, (key_col, fk_usages) in dedup_map.items():
    d = dedup_table(table, key_col, fk_usages)
    log.info(f"   {table}: deleted {d} duplicates")
    total_deleted += d

log.info(f"   Total duplicates removed: {total_deleted}")

# Reload stage maps after dedup
PROJ_STAGE_MAP  = {r["name"]: r["id"] for r in sb.table("project_stages").select("id,name").execute().data or []}
SVC_STAGE_MAP   = {r["name"]: r["id"] for r in sb.table("service_stages").select("id,name").execute().data or []}
PROJ_PERM_MAP   = {r["name"]: r["id"] for r in sb.table("project_permissions").select("id,name").execute().data or []}
PROJ_DEF_TASK_MAP = {r["number"]: r["id"] for r in sb.table("project_default_tasks").select("id,number").execute().data or [] if r.get("number")}
SVC_DEF_TASK_MAP  = {r["number"]: r["id"] for r in sb.table("service_default_tasks").select("id,number").execute().data or [] if r.get("number")}
NOTIF_MAP       = {r["info_id"]: r["id"] for r in sb.table("project_notifications").select("id,info_id").execute().data or [] if r.get("info_id")}

# ═══════════════════════════════════════════════════════════
# STEP 2: service_issues — insert all 6
# ═══════════════════════════════════════════════════════════
log.info("── Step 2: service_issues")

# First delete any existing (might be orphaned rows from previous runs)
try:
    sb.table("service_issues").delete().neq("id","00000000-0000-0000-0000-000000000000").execute()
except Exception as e:
    log.warning(f"  clear failed: {str(e)[:80]}")

si_rows = []
for doc in db["service_issue"].find({}):
    si_rows.append({
        "id":         new_uuid(),
        "name":       doc.get("name",""),
        "description":doc.get("description"),
        "user_reporter_id": resolve_user(doc.get("user_reporter")),
        "is_active":  bool(doc.get("is_active", True)),
        "created_at": to_iso(doc.get("created_time")),
        "updated_at": to_iso(doc.get("last_modified_time")),
    })

n = safe_insert("service_issues", si_rows)
log.info(f"   ✓ {n} service_issues inserted")

# ═══════════════════════════════════════════════════════════
# STEP 3: 6 missing projects (exist in Supabase with v1 UUIDs)
#         Get current Supabase UUIDs by project number, then patch
# ═══════════════════════════════════════════════════════════
log.info("── Step 3: 6 missing projects — patch existing v1 rows")

MISSING_PROJ_NUMBERS = ['P-00006','P-00031','P-00035','P-00038','P-00047','P-00057']
PROJECT_NUMBER_TO_SB_UUID = {}

# First check if they're already in Supabase (v1 insert)
for num in MISSING_PROJ_NUMBERS:
    rows = sb.table("projects").select("id").eq("number", num).execute().data or []
    if rows:
        PROJECT_NUMBER_TO_SB_UUID[num] = rows[0]["id"]
        log.info(f"   Found {num} in Supabase with id={rows[0]['id']}")

# Build full project ID map (number → supabase UUID)
all_proj_rows = sb.table("projects").select("id,number").execute().data or []
PROJ_NUMBER_MAP = {r["number"]: r["id"] for r in all_proj_rows}

# Also build mongo _id → supabase UUID for projects
MONGO_PROJ_ID_TO_SB = {}
for p in db["project"].find({}, {"_id":1,"number":1}):
    num = str(p.get("number",""))
    if num in PROJ_NUMBER_MAP:
        MONGO_PROJ_ID_TO_SB[str(p["_id"])] = PROJ_NUMBER_MAP[num]

patched = 0
newly_inserted = 0
for num in MISSING_PROJ_NUMBERS:
    doc = db["project"].find_one({"number": num})
    if not doc: continue

    cs = doc.get("current_stage") or {}
    stage_id = PROJ_STAGE_MAP.get(cs.get("name")) if isinstance(cs, dict) else None

    row = {
        "name":                            doc.get("name",""),
        "number":                          num,
        "description":                     doc.get("description"),
        "reference_number":                doc.get("reference_number"),
        "user_reporter_id":                resolve_user(doc.get("user_reporter")),
        "user_manager_id":                 resolve_user(doc.get("user_manager")),
        "user_installer_id":               resolve_user(doc.get("user_installer")),
        "current_stage_id":                stage_id,
        "sales_order_id":                  None,  # patched by migrate_patch if needed
        "start_date":                      to_iso(doc.get("start_date")),
        "end_date":                        to_iso(doc.get("end_date")),
        "duration":                        doc.get("duration"),
        "address":                         doc.get("address"),
        "phone":                           doc.get("phone"),
        "is_active":                       bool(doc.get("is_active", True)),
        "has_permission":                  bool(doc.get("has_permission", False)),
        "all_products_marked":             bool(doc.get("all_products_marked", False)),
        "all_windows_marked":              bool(doc.get("all_windows_marked", False)),
        "all_screw_marked":                bool(doc.get("all_screw_marked", False)),
        "all_trash_marked":                bool(doc.get("all_trash_marked", False)),
        "feedback":                        doc.get("feedback"),
        "work_scope":                      doc.get("work_scope"),
        "project_materials_other_notes":   doc.get("project_materials_other_notes"),
        "inspection_date":                 to_iso(doc.get("inspection_date")),
        "inspection_end_date":             to_iso(doc.get("inspection_end_date")),
        "inspection_duration":             doc.get("inspection_duration"),
        "inspection_is_part_days":         bool(doc.get("inspection_is_part_days", False)),
        "finish_permission_date":          to_iso(doc.get("finish_permission_date")),
        "finish_permission_end_date":      to_iso(doc.get("finish_permission_end_date")),
        "finish_permission_duration":      doc.get("finish_permission_duration"),
        "finish_permission_is_part_days":  bool(doc.get("finish_permission_is_part_days", False)),
        "is_part_days":                    bool(doc.get("is_part_days", False)),
        "created_at":                      to_iso(doc.get("created_time")),
        "updated_at":                      to_iso(doc.get("last_modified_time")),
    }

    if num in PROJECT_NUMBER_TO_SB_UUID:
        # Already exists — update all fields
        sb_id = PROJECT_NUMBER_TO_SB_UUID[num]
        row["id"] = sb_id
        MONGO_PROJ_ID_TO_SB[str(doc["_id"])] = sb_id
        try:
            sb.table("projects").update(row).eq("id", sb_id).execute()
            patched += 1
        except Exception as e:
            log.warning(f"  patch {num}: {str(e)[:120]}")
    else:
        # Insert new
        row["id"] = new_uuid()
        MONGO_PROJ_ID_TO_SB[str(doc["_id"])] = row["id"]
        try:
            sb.table("projects").insert(row).execute()
            newly_inserted += 1
        except Exception as e:
            log.warning(f"  insert {num}: {str(e)[:120]}")

log.info(f"   ✓ {patched} projects patched, {newly_inserted} newly inserted")

# Also patch sales_order_id for those 6 projects
for num in MISSING_PROJ_NUMBERS:
    doc = db["project"].find_one({"number": num})
    if not doc: continue
    so = doc.get("sales_order")
    if not so or not isinstance(so, dict): continue
    so_id = str(so.get("salesorder_id",""))
    if not so_id: continue
    # Look up zoho_sales_orders
    r2 = sb.table("zoho_sales_orders").select("id").eq("salesorder_id", so_id).execute().data or []
    if r2:
        sb_proj_id = PROJ_NUMBER_MAP.get(num) or PROJECT_NUMBER_TO_SB_UUID.get(num)
        if sb_proj_id:
            sb.table("projects").update({"sales_order_id": r2[0]["id"]}).eq("id", sb_proj_id).execute()

# Reload full project map
all_proj_rows = sb.table("projects").select("id,number").execute().data or []
PROJ_NUMBER_MAP = {r["number"]: r["id"] for r in all_proj_rows}
# Rebuild mongo _id → sb uuid
MONGO_PROJ_ID_TO_SB = {}
for p in db["project"].find({}, {"_id":1,"number":1}):
    num = str(p.get("number",""))
    if num in PROJ_NUMBER_MAP:
        MONGO_PROJ_ID_TO_SB[str(p["_id"])] = PROJ_NUMBER_MAP[num]

# ═══════════════════════════════════════════════════════════
# STEP 4: Missing project_task_comments (47)
# ═══════════════════════════════════════════════════════════
log.info("── Step 4: missing project_task_comments")

# Get existing comment IDs to detect which are missing
# We match by: project_id + user_reporter_id + created_at (unique enough)
existing_comments = sb.table("project_task_comments").select("id,project_id,created_at").execute().data or []
existing_comment_keys = {(r["project_id"], r["created_at"][:19] if r.get("created_at") else "") for r in existing_comments}

# Also load default_task dedup map by number
PROJ_DEF_TASK_MAP = {r["number"]: r["id"] for r in
                     sb.table("project_default_tasks").select("id,number").execute().data or []
                     if r.get("number")}

new_comments = []
for doc in db["project_task_comment"].find({}):
    ur = doc.get("user_reporter")
    user_id = resolve_user(ur)
    if not user_id: continue

    proj_ref = doc.get("project")
    proj_id = None
    if isinstance(proj_ref, dict):
        proj_id = MONGO_PROJ_ID_TO_SB.get(str(proj_ref.get("_id","")))
    if not proj_id: continue

    pdt_ref = doc.get("project_default_task")
    pdt_id = None
    if isinstance(pdt_ref, dict):
        pdt_num = str(pdt_ref.get("number",""))
        pdt_id = PROJ_DEF_TASK_MAP.get(pdt_num)

    ts = to_iso(doc.get("created_time"))
    key = (proj_id, ts[:19] if ts else "")
    if key in existing_comment_keys:
        continue  # already exists

    # Handle comment_attachments
    att_list = doc.get("project_default_task_comment_attachments") or []
    att_data = []
    if isinstance(att_list, list):
        for a in att_list:
            if isinstance(a, dict):
                att_data.append({"name": a.get("name",""), "file_url": a.get("file","")})

    new_comments.append({
        "id":                      new_uuid(),
        "comment":                 str(doc.get("comment","")),
        "user_reporter_id":        user_id,
        "project_id":              proj_id,
        "project_default_task_id": pdt_id,
        "is_active":               bool(doc.get("is_active", True)),
        "created_at":              ts,
        "updated_at":              to_iso(doc.get("last_modified_time")),
    })

n = safe_insert("project_task_comments", new_comments)
log.info(f"   ✓ {n} project_task_comments inserted")

# ═══════════════════════════════════════════════════════════
# STEP 5: Missing project_notification_users (62 for yosbel users)
# ═══════════════════════════════════════════════════════════
log.info("── Step 5: missing project_notification_users")

existing_nu = sb.table("project_notification_users").select("notification_id,user_id").execute().data or []
existing_nu_keys = {(r["notification_id"], r["user_id"]) for r in existing_nu}

new_nu = []
for doc in db["project_notification_user"].find({}):
    u = doc.get("user")
    user_id = resolve_user(u)
    if not user_id: continue

    notif_ref = doc.get("notification")
    notif_id = None
    if isinstance(notif_ref, dict):
        info_id = str(notif_ref.get("info_id","") or notif_ref.get("_id",""))
        notif_id = NOTIF_MAP.get(info_id)
        if not notif_id:
            # try by _id string
            rows = sb.table("project_notifications").select("id").eq("info_id", info_id).execute().data or []
            if rows: notif_id = rows[0]["id"]
    if not notif_id: continue

    key = (notif_id, user_id)
    if key in existing_nu_keys: continue

    username = doc.get("username","")
    if not username and isinstance(u, dict):
        username = u.get("username","") or u.get("email","")

    new_nu.append({
        "id":              new_uuid(),
        "notification_id": notif_id,
        "user_id":         user_id,
        "username":        username,
        "read":            bool(doc.get("read", False)),
        "created_at":      to_iso(doc.get("created_time")),
        "updated_at":      to_iso(doc.get("last_modified_time")),
    })

n = safe_insert("project_notification_users", new_nu)
log.info(f"   ✓ {n} project_notification_users inserted")

# ═══════════════════════════════════════════════════════════
# STEP 6: Missing project_profit_reports (6 for missing projects)
# ═══════════════════════════════════════════════════════════
log.info("── Step 6: missing project_profit_reports")

existing_ppr = {r["project_id"] for r in
                sb.table("project_profit_reports").select("project_id").execute().data or []}

new_ppr = []
for doc in db["project_profit_report"].find({}):
    mongo_pid = str(doc.get("project_id","") or "")
    # project_id in MongoDB is stored as string of ObjectId
    sb_proj_id = MONGO_PROJ_ID_TO_SB.get(mongo_pid)
    if not sb_proj_id:
        # Try to find by project_info embedded
        pi = doc.get("project_info") or {}
        num = pi.get("number","") if isinstance(pi, dict) else ""
        if num: sb_proj_id = PROJ_NUMBER_MAP.get(str(num))
    if not sb_proj_id: continue
    if sb_proj_id in existing_ppr: continue

    proj_info = doc.get("project_info")
    if not isinstance(proj_info, dict): proj_info = {}

    new_ppr.append({
        "id":                               new_uuid(),
        "project_id":                       sb_proj_id,
        "project_info":                     proj_info,
        "project_amount":                   doc.get("project_amount"),
        "installation_amount":              doc.get("installation_amount"),
        "installation_cost_subcontractor":  doc.get("installation_cost_subcontractor"),
        "installation_cost_onhouse":        doc.get("installation_cost_onhouse"),
        "installation_profit_subcontractor":doc.get("installation_profit_subcontractor"),
        "installation_profit_onhouse":      doc.get("installation_profit_onhouse"),
        "notes":                            doc.get("notes"),
        "has_been_edited":                  bool(doc.get("has_been_edited", False)),
        "working_type":                     doc.get("working_type"),
        "created_at":                       to_iso(doc.get("created_time")),
        "updated_at":                       to_iso(doc.get("last_modified_time")),
    })

n = safe_insert("project_profit_reports", new_ppr)
log.info(f"   ✓ {n} project_profit_reports inserted")

# ═══════════════════════════════════════════════════════════
# STEP 7: Missing project_tracking (18)
# ═══════════════════════════════════════════════════════════
log.info("── Step 7: missing project_tracking")

existing_tr = sb.table("project_tracking").select("user_reporter_id,created_at").execute().data or []
existing_tr_keys = {(r["user_reporter_id"], r["created_at"][:19] if r.get("created_at") else "") for r in existing_tr}

new_tr = []
for doc in db["project_tracking"].find({}):
    user_id = resolve_user(doc.get("user_reporter"))
    if not user_id: continue
    ts = to_iso(doc.get("created_time"))
    key = (user_id, ts[:19] if ts else "")
    if key in existing_tr_keys: continue
    md = doc.get("managed_data")
    if not isinstance(md, (dict, list, type(None))): md = str(md)
    new_tr.append({
        "id":               new_uuid(),
        "user_reporter_id": user_id,
        "action":           str(doc.get("action","")),
        "managed_data":     md,
        "created_at":       ts,
    })

n = safe_insert("project_tracking", new_tr)
log.info(f"   ✓ {n} project_tracking inserted")

# ═══════════════════════════════════════════════════════════
# STEP 8: Missing measurement + measurement_comment
# ═══════════════════════════════════════════════════════════
log.info("── Step 8: missing measurement + measurement_comment")

existing_meas = {r["number"] for r in sb.table("measurements").select("number").execute().data or []}

new_meas = []
for doc in db["measurement"].find({}):
    num = str(doc.get("number",""))
    if num in existing_meas: continue

    new_meas.append({
        "id":               new_uuid(),
        "number":           num,
        "sales_order_id":   None,
        "customer":         doc.get("customer") if isinstance(doc.get("customer"), (dict, list)) else None,
        "service":          doc.get("service") if isinstance(doc.get("service"), (dict, list)) else None,
        "project":          doc.get("project") if isinstance(doc.get("project"), (dict, list)) else None,
        "user_reporter_id": resolve_user(doc.get("user_reporter")),
        "user_manager_id":  resolve_user(doc.get("user_manager")),
        "phone":            doc.get("phone"),
        "address":          doc.get("address"),
        "color":            doc.get("color") if isinstance(doc.get("color"), dict) else None,
        "marks":            doc.get("marks") if isinstance(doc.get("marks"), list) else [],
        "is_active":        bool(doc.get("is_active", True)),
        "first_date":       to_iso(doc.get("first_date")),
        "check_date":       to_iso(doc.get("check_date")),
        "first_assignee_id":resolve_user(doc.get("first_assignee")),
        "check_assignee_id":resolve_user(doc.get("check_assignee")),
        "general_notes":    doc.get("general_notes"),
        "created_at":       to_iso(doc.get("created_time")),
        "updated_at":       to_iso(doc.get("last_modified_time")),
    })

n = safe_insert("measurements", new_meas)
log.info(f"   ✓ {n} measurements inserted")

# Reload measurement map
MEAS_MAP = {}
for m_doc in db["measurement"].find({}, {"_id":1,"number":1}):
    rows = sb.table("measurements").select("id").eq("number", str(m_doc.get("number",""))).execute().data or []
    if rows: MEAS_MAP[str(m_doc["_id"])] = rows[0]["id"]

# Missing measurement_comments
existing_mc = sb.table("measurement_comments").select("measurement_id,created_at").execute().data or []
existing_mc_keys = {(r["measurement_id"], r["created_at"][:19] if r.get("created_at") else "") for r in existing_mc}

new_mc = []
for doc in db["measurement_comment"].find({}):
    user_id = resolve_user(doc.get("user_reporter"))
    if not user_id: continue
    meas_ref = doc.get("measurement")
    meas_id = None
    if isinstance(meas_ref, dict):
        meas_id = MEAS_MAP.get(str(meas_ref.get("_id","")))
    if not meas_id: continue
    ts = to_iso(doc.get("created_time"))
    key = (meas_id, ts[:19] if ts else "")
    if key in existing_mc_keys: continue
    att = doc.get("measurement_default_task_comment_attachments") or []
    att_data = [{"name":a.get("name",""),"file_url":a.get("file","")}
                for a in att if isinstance(a,dict)] if isinstance(att,list) else []
    new_mc.append({
        "id":              new_uuid(),
        "comment":         str(doc.get("comment","")),
        "user_reporter_id":user_id,
        "measurement_id":  meas_id,
        "comment_attachments": att_data,
        "is_active":       bool(doc.get("is_active", True)),
        "created_at":      ts,
        "updated_at":      to_iso(doc.get("last_modified_time")),
    })

n = safe_insert("measurement_comments", new_mc)
log.info(f"   ✓ {n} measurement_comments inserted")

# ═══════════════════════════════════════════════════════════
# FINAL COUNT CHECK
# ═══════════════════════════════════════════════════════════
log.info("\n── Final count check")
pairs = [
    ("login_users","users"),("service_issue","service_issues"),
    ("project","projects"),("project_task_comment","project_task_comments"),
    ("project_notification_user","project_notification_users"),
    ("project_profit_report","project_profit_reports"),
    ("project_tracking","project_tracking"),
    ("measurement","measurements"),("measurement_comment","measurement_comments"),
    ("project_stage","project_stages"),("service_stage","service_stages"),
    ("project_default_task","project_default_tasks"),("service_default_task","service_default_tasks"),
    ("project_notification","project_notifications"),
]
for mc_col, sb_table in pairs:
    try: mc = db[mc_col].count_documents({})
    except: mc = "?"
    try:
        r = sb.table(sb_table).select("id",count="exact").limit(1).execute()
        sc = r.count if (hasattr(r,"count") and r.count is not None) else len(r.data)
    except: sc = "?"
    diff = ""
    if isinstance(mc,int) and isinstance(sc,int):
        d = mc-sc; diff = ("+"+str(d)) if d>0 else str(d)
        flag = " ← STILL MISSING" if d>0 else " ✓"
    else: flag = ""
    log.info(f"  {mc_col:<40} mongo={mc:>5}  sb={sc:>5}  {diff:>5}{flag}")

log.info("=" * 60)
log.info("  ✅  sync_v3 complete.")
log.info("=" * 60)
