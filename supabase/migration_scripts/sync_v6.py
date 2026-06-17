"""
sync_v6.py — Incremental sync: bring new MongoDB data into Supabase.

New data detected:
  1. project_notifications  — 2 new (info_ids not yet in Supabase)
  2. project_notification_users — 72 docs referencing those new notifications

Confirmed orphan references (not actionable):
  - 20 project_task_comments → projects P-00005/P-00100/P-16688/P-16716/P-17168
    (deleted from MongoDB; cannot migrate without parent project)
  - 1 measurement_comment → MR-C0476 (deleted from MongoDB)
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
        uname = embedded.get("username","")
        if uname and uname in USERNAME_TO_UUID: return USERNAME_TO_UUID[uname]
    return None

# Build initial notification map from Supabase
NOTIF_MAP = {r["info_id"]: r["id"]
             for r in (sb.table("project_notifications").select("id,info_id").execute().data or [])
             if r.get("info_id")}

log.info(f"   {len(EMAIL_TO_UUID)} users in Supabase, {len(NOTIF_MAP)} existing notifications")

# ═══════════════════════════════════════════════════════════
# STEP 1: Insert new project_notifications
# ═══════════════════════════════════════════════════════════
log.info("── Step 1: project_notifications — insert new")

sb_iids  = set(NOTIF_MAP.keys())
new_notifs = []
for doc in db["project_notification"].find({}):
    iid = str(doc.get("info_id","") or str(doc["_id"]))
    if iid in sb_iids:
        continue  # already in Supabase
    row_id = new_uuid()
    new_notifs.append({
        "id":         row_id,
        "module":     doc.get("module"),
        "info":       doc.get("info"),
        "info_id":    iid,
        "type":       doc.get("type","load"),
        "created_at": to_iso(doc.get("created_time")) or now_iso(),
        "updated_at": to_iso(doc.get("last_modified_time")) or now_iso(),
    })
    # Track immediately so notification_users step can use it
    NOTIF_MAP[iid] = row_id
    sb_iids.add(iid)

n = safe_insert("project_notifications", new_notifs)
log.info(f"   ✓ {n} project_notifications inserted")

# Refresh NOTIF_MAP with newly inserted rows
for r in (sb.table("project_notifications").select("id,info_id").execute().data or []):
    if r.get("info_id"): NOTIF_MAP[r["info_id"]] = r["id"]

# ═══════════════════════════════════════════════════════════
# STEP 2: Insert new project_notification_users
# ═══════════════════════════════════════════════════════════
log.info("── Step 2: project_notification_users — insert new")

existing_nu_keys = {(r["notification_id"], r["user_id"])
                    for r in (sb.table("project_notification_users")
                               .select("notification_id,user_id").execute().data or [])}

new_nu = []
skipped_user = 0
skipped_notif = 0

for doc in db["project_notification_user"].find({}):
    user_id = resolve_user(doc.get("user"))
    if not user_id:
        skipped_user += 1
        continue

    notif_ref = doc.get("notification") or {}
    iid = str(notif_ref.get("info_id","") or notif_ref.get("_id",""))
    notif_id  = NOTIF_MAP.get(iid)
    if not notif_id:
        skipped_notif += 1
        continue

    key = (notif_id, user_id)
    if key in existing_nu_keys:
        continue

    u = doc.get("user") or {}
    username = (doc.get("username","") or
                (u.get("username","") if isinstance(u, dict) else ""))

    new_nu.append({
        "id":              new_uuid(),
        "notification_id": notif_id,
        "user_id":         user_id,
        "username":        username,
        "read":            bool(doc.get("read", False)),
        "created_at":      to_iso(doc.get("created_time")) or now_iso(),
        "updated_at":      to_iso(doc.get("last_modified_time")) or now_iso(),
    })
    existing_nu_keys.add(key)

n = safe_insert("project_notification_users", new_nu)
log.info(f"   ✓ {n} project_notification_users inserted "
         f"(skipped: {skipped_user} no-user, {skipped_notif} no-notif)")

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
    ("project_attachment","project_attachments"),
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
        sc = r.count if (hasattr(r,"count") and r.count is not None) else len(r.data)
    except: sc = "?"
    if isinstance(mc,int) and isinstance(sc,int):
        d = mc - sc
        flag = " ✓" if d <= 0 else f" ← {d} MISSING"
        if d > 0: all_ok = False
    else: flag = ""
    log.info(f"  {mc_col:<42} mongo={str(mc):>5}  sb={str(sc):>5}{flag}")

# Notifications — show deduplicated counts
pn_distinct = len(db["project_notification"].distinct("info_id"))
pn_sb = (sb.table("project_notifications").select("id",count="exact").limit(1).execute().count or 0)
pnu_sb = (sb.table("project_notification_users").select("id",count="exact").limit(1).execute().count or 0)
pnu_mongo = db["project_notification_user"].count_documents({})
flag_n = " ✓" if pn_sb >= pn_distinct else f" ← {pn_distinct-pn_sb} MISSING"
log.info(f"  {'project_notification (unique info_ids)':<42} distinct={pn_distinct}  sb={pn_sb}{flag_n}")
log.info(f"  {'project_notification_users':<42} mongo={pnu_mongo}  sb={pnu_sb}")

if all_ok:
    log.info("\n  🎉  ALL COLLECTIONS IN SYNC!")
else:
    log.info("\n  ⚠️  Known gaps:")
    log.info("      project_task_comments  +20: orphan refs to projects deleted from MongoDB")
    log.info("      measurement_comments    +1: orphan ref to measurement deleted from MongoDB")
log.info("=" * 60)
log.info("  ✅  sync_v6 complete.")
log.info("=" * 60)
