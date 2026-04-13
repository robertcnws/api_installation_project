"""
sync_v5.py — Fix the two remaining gaps after sync_v4.

Issues fixed:
  1. project_task_comments (263 missing) — embedded project field uses 'id' not '_id'
  2. measurement_comments (1 missing)    — embedded measurement field uses 'id' not '_id'

Both fixes: use .get("id") or .get("_id","") instead of just .get("_id","")
"""

import os, sys, uuid, logging, json
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

# ── Build lookup maps ─────────────────────────────────────────
log.info("── Loading lookup maps")

EMAIL_TO_UUID = {}
USERNAME_TO_UUID = {}
for r in (sb.table("users").select("id,username,email").execute().data or []):
    if r.get("email"):    EMAIL_TO_UUID[r["email"].lower()] = r["id"]
    if r.get("username"): USERNAME_TO_UUID[r["username"]] = r["id"]

def resolve_user(embedded):
    if not embedded: return None
    if isinstance(embedded, dict):
        email = (embedded.get("email") or "").lower()
        if email and email in EMAIL_TO_UUID: return EMAIL_TO_UUID[email]
        uname = embedded.get("username","")
        if uname and uname in USERNAME_TO_UUID: return USERNAME_TO_UUID[uname]
    return None

# Projects: number → Supabase UUID
PROJ_NUMBER_MAP = {r["number"]: r["id"]
                   for r in (sb.table("projects").select("id,number").execute().data or [])}

# MongoDB project ObjectId → Supabase UUID  (via project number)
MONGO_PROJ_ID_MAP = {}
for p in db["project"].find({}, {"_id":1,"number":1}):
    num = str(p.get("number",""))
    if num in PROJ_NUMBER_MAP:
        MONGO_PROJ_ID_MAP[str(p["_id"])] = PROJ_NUMBER_MAP[num]

# project_default_tasks lookup (number and name)
PROJ_DEF_TASK_MAP      = {r["number"]: r["id"]
                           for r in (sb.table("project_default_tasks").select("id,number").execute().data or [])
                           if r.get("number")}
PROJ_DEF_TASK_NAME_MAP = {r["name"]: r["id"]
                           for r in (sb.table("project_default_tasks").select("id,name").execute().data or [])}

# Measurements: MongoDB ObjectId → Supabase UUID  (via number)
MEAS_MAP = {}
for m in db["measurement"].find({}, {"_id":1,"number":1}):
    rows = sb.table("measurements").select("id").eq("number", str(m.get("number",""))).execute().data or []
    if rows: MEAS_MAP[str(m["_id"])] = rows[0]["id"]

log.info(f"   {len(EMAIL_TO_UUID)} emails, {len(PROJ_NUMBER_MAP)} projects, {len(MEAS_MAP)} measurements")

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
# STEP 1: project_task_comments — clear + re-insert all 263
# FIX: embedded project uses 'id' not '_id'
# ═══════════════════════════════════════════════════════════
log.info("── Step 1: project_task_comments — clear + re-insert all 263")

try:
    sb.table("project_task_comments").delete().neq("id","00000000-0000-0000-0000-000000000000").execute()
    log.info("   cleared project_task_comments")
except Exception as e:
    log.warning(f"  clear: {str(e)[:80]}")

all_comments = []
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
        # FIX: try 'id' first (embedded docs store ObjectId as 'id'), then '_id'
        mongo_pid = str(proj_ref.get("id") or proj_ref.get("_id") or "")
        proj_id = MONGO_PROJ_ID_MAP.get(mongo_pid)
        if not proj_id:
            # fallback: resolve by project number directly
            num = str(proj_ref.get("number") or "")
            if num: proj_id = PROJ_NUMBER_MAP.get(num)
    if not proj_id:
        skipped_proj += 1
        continue

    pdt_ref = doc.get("project_default_task")
    pdt_id = None
    if isinstance(pdt_ref, dict):
        pdt_num  = str(pdt_ref.get("number") or "")
        pdt_name = str(pdt_ref.get("name") or "")
        pdt_id   = PROJ_DEF_TASK_MAP.get(pdt_num) or PROJ_DEF_TASK_NAME_MAP.get(pdt_name)

    all_comments.append({
        "id":                      new_uuid(),
        "comment":                 str(doc.get("comment","") or ""),
        "user_reporter_id":        user_id,
        "project_id":              proj_id,
        "project_default_task_id": pdt_id,
        "is_active":               bool(doc.get("is_active", True)),
        "created_at":              to_iso(doc.get("created_time")) or now_iso(),
        "updated_at":              to_iso(doc.get("last_modified_time")) or now_iso(),
    })

n = safe_insert("project_task_comments", all_comments)
log.info(f"   ✓ {n} project_task_comments inserted "
         f"(skipped: {skipped_user} no-user, {skipped_proj} no-project)")

# ═══════════════════════════════════════════════════════════
# STEP 2: measurement_comments — re-insert missing
# FIX: embedded measurement uses 'id' not '_id'
# ═══════════════════════════════════════════════════════════
log.info("── Step 2: measurement_comments — insert missing")

existing_mc_keys = {(r["measurement_id"], (r["created_at"] or "")[:19])
                    for r in (sb.table("measurement_comments")
                               .select("measurement_id,created_at").execute().data or [])}

new_mc = []
skipped_user = 0
skipped_meas = 0

for doc in db["measurement_comment"].find({}):
    user_id = resolve_user(doc.get("user_reporter"))
    if not user_id:
        skipped_user += 1
        continue

    meas_ref = doc.get("measurement")
    meas_id = None
    if isinstance(meas_ref, dict):
        # FIX: try 'id' first, then '_id'
        mongo_mid = str(meas_ref.get("id") or meas_ref.get("_id") or "")
        meas_id = MEAS_MAP.get(mongo_mid)
        if not meas_id:
            # fallback: resolve by measurement number
            num = str(meas_ref.get("number") or "")
            if num:
                rows = sb.table("measurements").select("id").eq("number", num).execute().data or []
                if rows: meas_id = rows[0]["id"]
    if not meas_id:
        skipped_meas += 1
        continue

    ts  = to_iso(doc.get("created_time"))
    key = (meas_id, (ts or "")[:19])
    if key in existing_mc_keys:
        continue

    att = doc.get("measurement_default_task_comment_attachments") or []
    att_data = ([{"name": a.get("name",""), "file_url": a.get("file","")}
                 for a in att if isinstance(a, dict)]
                if isinstance(att, list) else [])

    new_mc.append({
        "id":                  new_uuid(),
        "comment":             str(doc.get("comment","") or ""),
        "user_reporter_id":    user_id,
        "measurement_id":      meas_id,
        "comment_attachments": att_data,
        "is_active":           bool(doc.get("is_active", True)),
        "created_at":          ts or now_iso(),
        "updated_at":          to_iso(doc.get("last_modified_time")) or now_iso(),
    })
    existing_mc_keys.add(key)

n = safe_insert("measurement_comments", new_mc)
log.info(f"   ✓ {n} measurement_comments inserted "
         f"(skipped: {skipped_user} no-user, {skipped_meas} no-measurement)")

# ═══════════════════════════════════════════════════════════
# FINAL COUNT CHECK
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
    # project_notification: 31 mongo docs → 10 unique info_ids → 10 sb rows (expected)
    # project_notification_user: 558 mongo docs → 170 unique (notif,user) pairs → covered
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
    else:
        flag = ""
    log.info(f"  {mc_col:<42} mongo={str(mc):>5}  sb={str(sc):>5}{flag}")

# Manually report notification dedup status
pn_sb = (sb.table("project_notifications").select("id", count="exact").limit(1).execute().count or 0)
pn_distinct = len(db["project_notification"].distinct("info_id"))
log.info(f"  {'project_notification (unique info_ids)':<42} distinct={pn_distinct:>4}  sb={pn_sb:>5}"
         f"{' ✓' if pn_sb >= pn_distinct else f' ← {pn_distinct - pn_sb} MISSING'}")

pnu_sb = (sb.table("project_notification_users").select("id", count="exact").limit(1).execute().count or 0)
log.info(f"  {'project_notification_users (in sb)':<42} sb={pnu_sb:>5}")

if all_ok:
    log.info("\n  🎉  ALL COLLECTIONS IN SYNC!")
else:
    log.info("\n  ⚠️  Some collections still have gaps (see above)")
log.info("=" * 60)
log.info("  ✅  sync_v5 complete.")
log.info("=" * 60)
