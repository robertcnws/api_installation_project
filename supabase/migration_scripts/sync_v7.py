"""
sync_v7.py — Incremental sync: bring new MongoDB data into Supabase.

New data detected (2026-04-10):
  1. project_task_comments   — 1 new (comment added 2026-04-06: "Missing front door...")
  2. project_calendar_notes  — 1 new (note added 2026-04-09: "Steve Azoulay Gema $16k")
     → project_calendar_note_assignees: 1 assignee row for the new note

Confirmed orphans (not actionable):
  - 20 project_task_comments → projects P-00005/P-00100/P-16688/P-16716/P-17168
    (deleted from MongoDB; cannot migrate without parent project)
  - 1 measurement_comment → MR-C0476 (measurement deleted from MongoDB)
"""

import os, uuid, logging
from datetime import datetime, timezone, date

from dotenv import load_dotenv
from pymongo import MongoClient
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S")
log = logging.getLogger(__name__)

load_dotenv(".env.migration")
mongo = MongoClient(os.getenv("MONGO_URI", ""))
db    = mongo[os.getenv("MONGO_DB_NAME", "db_installation")]
sb: Client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

def new_uuid(): return str(uuid.uuid4())
def now_iso(): return datetime.now(timezone.utc).isoformat()

def to_iso(v):
    if v is None: return None
    if isinstance(v, datetime):
        if v.tzinfo is None: v = v.replace(tzinfo=timezone.utc)
        return v.isoformat()
    if isinstance(v, date): return v.isoformat()
    return str(v) if not isinstance(v, str) else v

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
                    log.warning(f"  skip {table}: {str(e)[:120]}")
    return total

# ── Load lookup maps ───────────────────────────────────────────
log.info("── Loading lookup maps")

EMAIL_TO_UUID = {}
USERNAME_TO_UUID = {}
for r in (sb.table("users").select("id,username,email").execute().data or []):
    if r.get("email"):    EMAIL_TO_UUID[r["email"].lower()] = r["id"]
    if r.get("username"): USERNAME_TO_UUID[r["username"]]   = r["id"]

def resolve_user(embedded):
    if not embedded: return None
    if isinstance(embedded, dict):
        email = (embedded.get("email") or "").lower()
        if email and email in EMAIL_TO_UUID: return EMAIL_TO_UUID[email]
        uname = embedded.get("username", "")
        if uname and uname in USERNAME_TO_UUID: return USERNAME_TO_UUID[uname]
    return None

# Projects: number → Supabase UUID
PROJ_NUMBER_MAP = {r["number"]: r["id"]
                   for r in (sb.table("projects").select("id,number").execute().data or [])}
# MongoDB project ObjectId → Supabase UUID (via project number)
MONGO_PROJ_ID_MAP = {}
for p in db["project"].find({}, {"_id": 1, "number": 1}):
    num = str(p.get("number", ""))
    if num in PROJ_NUMBER_MAP:
        MONGO_PROJ_ID_MAP[str(p["_id"])] = PROJ_NUMBER_MAP[num]

# project_default_tasks
PROJ_DEF_TASK_MAP      = {r["number"]: r["id"]
                           for r in (sb.table("project_default_tasks").select("id,number").execute().data or [])
                           if r.get("number")}
PROJ_DEF_TASK_NAME_MAP = {r["name"]: r["id"]
                           for r in (sb.table("project_default_tasks").select("id,name").execute().data or [])}

log.info(f"   {len(EMAIL_TO_UUID)} users, {len(PROJ_NUMBER_MAP)} projects loaded")


# ═══════════════════════════════════════════════════════════
# STEP 1: project_task_comments — insert 1 new
# ═══════════════════════════════════════════════════════════
log.info("── Step 1: project_task_comments — insert new")

existing_ptc_keys = {(r["project_id"], (r["created_at"] or "")[:19])
                     for r in (sb.table("project_task_comments")
                                .select("project_id,created_at").execute().data or [])}

new_ptc = []
skipped_user = 0
skipped_proj = 0

for doc in db["project_task_comment"].find({}):
    user_id = resolve_user(doc.get("user_reporter"))
    if not user_id:
        skipped_user += 1
        continue

    proj_ref = doc.get("project")
    proj_id = None
    if isinstance(proj_ref, dict):
        mongo_pid = str(proj_ref.get("id") or proj_ref.get("_id") or "")
        proj_id = MONGO_PROJ_ID_MAP.get(mongo_pid)
        if not proj_id:
            num = str(proj_ref.get("number") or "")
            if num: proj_id = PROJ_NUMBER_MAP.get(num)
    if not proj_id:
        skipped_proj += 1
        continue

    ts  = to_iso(doc.get("created_time"))
    key = (proj_id, (ts or "")[:19])
    if key in existing_ptc_keys:
        continue

    pdt_ref = doc.get("project_default_task")
    pdt_id = None
    if isinstance(pdt_ref, dict):
        pdt_num  = str(pdt_ref.get("number") or "")
        pdt_name = str(pdt_ref.get("name") or "")
        pdt_id   = PROJ_DEF_TASK_MAP.get(pdt_num) or PROJ_DEF_TASK_NAME_MAP.get(pdt_name)

    new_ptc.append({
        "id":                      new_uuid(),
        "comment":                 str(doc.get("comment", "") or ""),
        "user_reporter_id":        user_id,
        "project_id":              proj_id,
        "project_default_task_id": pdt_id,
        "is_active":               bool(doc.get("is_active", True)),
        "created_at":              ts or now_iso(),
        "updated_at":              to_iso(doc.get("last_modified_time")) or now_iso(),
    })
    existing_ptc_keys.add(key)

n = safe_insert("project_task_comments", new_ptc)
log.info(f"   ✓ {n} project_task_comments inserted "
         f"(skipped: {skipped_user} no-user, {skipped_proj} no-project/orphan)")


# ═══════════════════════════════════════════════════════════
# STEP 2: project_calendar_notes — insert 1 new
# Also insert into project_calendar_note_assignees
# ═══════════════════════════════════════════════════════════
log.info("── Step 2: project_calendar_notes — insert new")

existing_cal_keys = {(r["name"], (r["created_at"] or "")[:19])
                     for r in (sb.table("project_calendar_notes")
                                .select("name,created_at").execute().data or [])}

# Build map of calendar_note name+created → supabase id (for assignees)
cal_id_map = {(r["name"], (r["created_at"] or "")[:19]): r["id"]
              for r in (sb.table("project_calendar_notes").select("id,name,created_at").execute().data or [])}

# Existing assignee pairs
existing_assignee_keys = {(r["calendar_note_id"], r["user_id"])
                          for r in (sb.table("project_calendar_note_assignees")
                                     .select("calendar_note_id,user_id").execute().data or [])}

new_notes = []
new_assignees = []

for doc in db["project_calendar_notes"].find({}):
    ts   = to_iso(doc.get("created_time"))
    name = doc.get("name", "")
    key  = (name, (ts or "")[:19])

    if key in existing_cal_keys:
        # Note already exists — still check for missing assignees
        note_id = cal_id_map.get(key)
        if note_id:
            for ua in (doc.get("user_assignees") or []):
                uid = resolve_user(ua)
                if uid and (note_id, uid) not in existing_assignee_keys:
                    new_assignees.append({"id": new_uuid(), "calendar_note_id": note_id, "user_id": uid})
                    existing_assignee_keys.add((note_id, uid))
        continue

    note_id = new_uuid()
    new_notes.append({
        "id":               note_id,
        "name":             name,
        "description":      doc.get("description"),
        "start_date":       to_iso(doc.get("start_date")),
        "end_date":         to_iso(doc.get("end_date")),
        "duration":         doc.get("duration"),
        "user_manager_id":  resolve_user(doc.get("user_manager")),
        "user_installer_id":resolve_user(doc.get("user_installer")),
        "user_reporter_id": resolve_user(doc.get("user_reporter")),
        "is_active":        bool(doc.get("is_active", True)),
        "created_at":       ts or now_iso(),
        "updated_at":       to_iso(doc.get("last_modified_time")) or now_iso(),
    })
    existing_cal_keys.add(key)
    cal_id_map[key] = note_id

    for ua in (doc.get("user_assignees") or []):
        uid = resolve_user(ua)
        if uid and (note_id, uid) not in existing_assignee_keys:
            new_assignees.append({"id": new_uuid(), "calendar_note_id": note_id, "user_id": uid})
            existing_assignee_keys.add((note_id, uid))

n_notes     = safe_insert("project_calendar_notes",          new_notes)
n_assignees = safe_insert("project_calendar_note_assignees", new_assignees)
log.info(f"   ✓ {n_notes} calendar_notes inserted, {n_assignees} assignees inserted")


# ═══════════════════════════════════════════════════════════
# FINAL COUNT CHECK — all tables
# ═══════════════════════════════════════════════════════════
log.info("\n── Final count check")

pairs = [
    ("user_role","user_roles"),
    ("login_users","users"),
    ("service_issue","service_issues"),
    ("project_stage","project_stages"),
    ("project_task_stage","project_task_stages"),
    ("project_permissions","project_permissions"),
    ("service_stage","service_stages"),
    ("project_default_guide_product","project_default_guide_products"),
    ("project_default_material","project_default_materials"),
    ("project_default_task","project_default_tasks"),
    ("service_default_task","service_default_tasks"),
    ("project","projects"),
    ("project_user","project_users"),
    ("project_attachment","project_attachments"),
    ("project_material","project_materials"),
    ("project_default_task_info","project_default_task_info"),
    ("project_task","project_tasks"),
    ("project_task_comment","project_task_comments"),
    ("project_task_attachment","project_task_attachments"),
    ("project_calendar_notes","project_calendar_notes"),
    ("project_remainder","project_reminders"),
    ("project_profit_report","project_profit_reports"),
    ("project_installation_crew","project_installation_crews"),
    ("project_tracking","project_tracking"),
    ("service","services"),
    ("service_attachment","service_attachments"),
    ("service_task_comment","service_task_comments"),
    ("measurement","measurements"),
    ("measurement_attachment","measurement_attachments"),
    ("measurement_comment","measurement_comments"),
    ("zoho_sales_order","zoho_sales_orders"),
    ("project_stage_history","project_stage_history"),
    ("service_stage_history","service_stage_history"),
]

all_ok = True
for mc_col, sb_table in pairs:
    try: mc = db[mc_col].count_documents({})
    except: mc = "?"
    try:
        r = sb.table(sb_table).select("id", count="exact").limit(1).execute()
        sc = r.count if (hasattr(r, "count") and r.count is not None) else len(r.data)
    except: sc = "?"
    if isinstance(mc, int) and isinstance(sc, int):
        d  = mc - sc
        flag = " ✓" if d <= 0 else f" ← {d} MISSING"
        if d > 0: all_ok = False
    else:
        flag = ""
    log.info(f"  {mc_col:<42} mongo={str(mc):>5}  sb={str(sc):>5}{flag}")

# Notifications
pn_distinct = len(db["project_notification"].distinct("info_id"))
pn_sb  = (sb.table("project_notifications").select("id", count="exact").limit(1).execute().count or 0)
pnu_sb = (sb.table("project_notification_users").select("id", count="exact").limit(1).execute().count or 0)
pnu_mongo = db["project_notification_user"].count_documents({})
flag_n = " ✓" if pn_sb >= pn_distinct else f" ← {pn_distinct - pn_sb} MISSING"
log.info(f"  {'project_notification (unique info_ids)':<42} distinct={pn_distinct}  sb={pn_sb}{flag_n}")
log.info(f"  {'project_notification_users':<42} mongo={pnu_mongo}  sb={pnu_sb}")

if all_ok:
    log.info("\n  🎉  ALL COLLECTIONS IN SYNC!")
else:
    log.info("\n  ⚠️  Known gaps:")
    log.info("      project_task_comments  +20: orphan refs to projects deleted from MongoDB")
    log.info("      measurement_comments    +1: orphan ref to MR-C0476 (deleted from MongoDB)")
log.info("=" * 60)
log.info("  ✅  sync_v7 complete.")
log.info("=" * 60)
