"""
sync_v4.py — Fix remaining data gaps after sync_v3.

Issues fixed:
  1. service_issues — null created_at (use NOW())
  2. project_default_tasks — dedup deleted all but 1 (re-insert 15 missing)
  3. service_default_tasks — same (re-insert 9 missing)
  4. project_notifications — cascade deleted 21 (re-insert)
  5. project_notification_users — cascade deleted 336 (re-insert)
  6. project_profit_reports — datetime in project_info JSONB (recursive serializer)
  7. project_tracking — datetime nested in managed_data (recursive serializer)
  8. project_task_comments — clear + full re-insert to get all 263
  9. measurement_comment — 1 still missing
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

def deep_serialize(obj):
    """Recursively convert any datetime/date/ObjectId to JSON-safe types."""
    if obj is None: return None
    if isinstance(obj, datetime): return to_iso(obj)
    if isinstance(obj, date): return obj.isoformat()
    if isinstance(obj, dict): return {k: deep_serialize(v) for k, v in obj.items()}
    if isinstance(obj, list): return [deep_serialize(i) for i in obj]
    try:
        json.dumps(obj)
        return obj
    except TypeError:
        return str(obj)

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
                    log.warning(f"  skip upsert {table}: {str(e)[:120]}")
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

# ── Build lookup maps ─────────────────────────────────────────
log.info("── Loading lookup maps")

EMAIL_TO_UUID: dict = {}
USERNAME_TO_UUID: dict = {}
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

PROJ_NUMBER_MAP = {r["number"]: r["id"]
                   for r in (sb.table("projects").select("id,number").execute().data or [])}
MONGO_PROJ_ID_MAP: dict = {}
for p in db["project"].find({}, {"_id":1,"number":1}):
    num = str(p.get("number",""))
    if num in PROJ_NUMBER_MAP:
        MONGO_PROJ_ID_MAP[str(p["_id"])] = PROJ_NUMBER_MAP[num]

PROJ_STAGE_MAP   = {r["name"]: r["id"] for r in (sb.table("project_stages").select("id,name").execute().data or [])}
SVC_STAGE_MAP    = {r["name"]: r["id"] for r in (sb.table("service_stages").select("id,name").execute().data or [])}
MEAS_MAP: dict = {}
for m in db["measurement"].find({}, {"_id":1,"number":1}):
    rows = sb.table("measurements").select("id").eq("number", str(m.get("number",""))).execute().data or []
    if rows: MEAS_MAP[str(m["_id"])] = rows[0]["id"]

log.info(f"   {len(EMAIL_TO_UUID)} emails, {len(PROJ_NUMBER_MAP)} projects, {len(MEAS_MAP)} measurements")

# ═══════════════════════════════════════════════════════════
# STEP 1: service_issues — use NOW() for null timestamps
# ═══════════════════════════════════════════════════════════
log.info("── Step 1: service_issues")
try:
    sb.table("service_issues").delete().neq("id","00000000-0000-0000-0000-000000000000").execute()
except Exception as e:
    log.warning(f"  clear: {str(e)[:80]}")

si_rows = []
for doc in db["service_issue"].find({}):
    si_rows.append({
        "id":               new_uuid(),
        "name":             doc.get("name",""),
        "description":      doc.get("description"),
        "user_reporter_id": resolve_user(doc.get("user_reporter")),
        "is_active":        bool(doc.get("is_active", True)),
        "created_at":       to_iso(doc.get("created_time")) or now_iso(),
        "updated_at":       to_iso(doc.get("last_modified_time")) or now_iso(),
    })
n = safe_insert("service_issues", si_rows)
log.info(f"   ✓ {n} service_issues inserted")

# ═══════════════════════════════════════════════════════════
# STEP 2: project_default_tasks — re-insert the 15 missing
# The 1 remaining has name "Book and fasteners" with number=NULL
# ═══════════════════════════════════════════════════════════
log.info("── Step 2: project_default_tasks — insert missing")

existing_pdt_names = {r["name"] for r in (sb.table("project_default_tasks").select("name").execute().data or [])}

new_pdt = []
for doc in db["project_default_task"].find({}):
    name = doc.get("name","")
    if name in existing_pdt_names: continue
    cs = doc.get("project_stage") or {}
    stage_id = None
    if isinstance(cs, dict):
        stage_id = PROJ_STAGE_MAP.get(cs.get("name",""))
    new_pdt.append({
        "id":                  new_uuid(),
        "name":                name,
        "number":              doc.get("number"),
        "description":         doc.get("description"),
        "order":               doc.get("order"),
        "project_stage_id":    stage_id,
        "project_stage_status":doc.get("project_stage_status"),
        "has_attachments":     bool(doc.get("has_attachments", False)),
        "is_active":           bool(doc.get("is_active", True)),
        "created_at":          to_iso(doc.get("created_time")) or now_iso(),
        "updated_at":          to_iso(doc.get("last_modified_time")) or now_iso(),
    })

n = safe_insert("project_default_tasks", new_pdt)
log.info(f"   ✓ {n} project_default_tasks inserted")

# Reload
PROJ_DEF_TASK_MAP = {r["number"]: r["id"]
                     for r in (sb.table("project_default_tasks").select("id,number").execute().data or [])
                     if r.get("number")}
PROJ_DEF_TASK_NAME_MAP = {r["name"]: r["id"]
                           for r in (sb.table("project_default_tasks").select("id,name").execute().data or [])}

# ═══════════════════════════════════════════════════════════
# STEP 3: service_default_tasks — re-insert missing 9
# ═══════════════════════════════════════════════════════════
log.info("── Step 3: service_default_tasks — insert missing")

existing_sdt_names = {r["name"] for r in (sb.table("service_default_tasks").select("name").execute().data or [])}

new_sdt = []
for doc in db["service_default_task"].find({}):
    name = doc.get("name","")
    if name in existing_sdt_names: continue
    cs = doc.get("service_stage") or {}
    stage_id = None
    if isinstance(cs, dict):
        stage_id = SVC_STAGE_MAP.get(cs.get("name",""))
    new_sdt.append({
        "id":                   new_uuid(),
        "name":                 name,
        "number":               doc.get("number"),
        "description":          doc.get("description"),
        "order":                doc.get("order"),
        "service_stage_id":     stage_id,
        "service_stage_status": doc.get("service_stage_status"),
        "has_attachments":      bool(doc.get("has_attachments", False)),
        "is_active":            bool(doc.get("is_active", True)),
        "created_at":           to_iso(doc.get("created_time")) or now_iso(),
        "updated_at":           to_iso(doc.get("last_modified_time")) or now_iso(),
    })

n = safe_insert("service_default_tasks", new_sdt)
log.info(f"   ✓ {n} service_default_tasks inserted")

SVC_DEF_TASK_MAP = {r["number"]: r["id"]
                    for r in (sb.table("service_default_tasks").select("id,number").execute().data or [])
                    if r.get("number")}
SVC_DEF_TASK_NAME_MAP = {r["name"]: r["id"]
                          for r in (sb.table("service_default_tasks").select("id,name").execute().data or [])}

# ═══════════════════════════════════════════════════════════
# STEP 4: project_notifications — insert missing 21
# ═══════════════════════════════════════════════════════════
log.info("── Step 4: project_notifications — insert missing")

existing_notif_info_ids = {r["info_id"]
                            for r in (sb.table("project_notifications").select("info_id").execute().data or [])
                            if r.get("info_id")}

new_notif = []
for doc in db["project_notification"].find({}):
    iid = str(doc.get("info_id","") or str(doc["_id"]))
    if iid in existing_notif_info_ids: continue
    new_notif.append({
        "id":         new_uuid(),
        "module":     doc.get("module"),
        "info":       doc.get("info"),
        "info_id":    iid,
        "type":       doc.get("type","load"),
        "created_at": to_iso(doc.get("created_time")) or now_iso(),
        "updated_at": to_iso(doc.get("last_modified_time")) or now_iso(),
    })

n = safe_insert("project_notifications", new_notif)
log.info(f"   ✓ {n} project_notifications inserted")

# Rebuild NOTIF_MAP
NOTIF_MAP = {r["info_id"]: r["id"]
             for r in (sb.table("project_notifications").select("id,info_id").execute().data or [])
             if r.get("info_id")}

# ═══════════════════════════════════════════════════════════
# STEP 5: project_notification_users — insert all missing
# ═══════════════════════════════════════════════════════════
log.info("── Step 5: project_notification_users — insert missing")

existing_nu_keys = {(r["notification_id"], r["user_id"])
                    for r in (sb.table("project_notification_users")
                               .select("notification_id,user_id").execute().data or [])}

new_nu = []
for doc in db["project_notification_user"].find({}):
    user_id = resolve_user(doc.get("user"))
    if not user_id: continue

    notif_ref = doc.get("notification")
    notif_id = None
    if isinstance(notif_ref, dict):
        iid = str(notif_ref.get("info_id","") or notif_ref.get("_id",""))
        notif_id = NOTIF_MAP.get(iid)
        if not notif_id:
            rows = sb.table("project_notifications").select("id").eq("info_id", iid).execute().data or []
            if rows: notif_id = rows[0]["id"]
    if not notif_id: continue

    key = (notif_id, user_id)
    if key in existing_nu_keys: continue

    u = doc.get("user") or {}
    username = doc.get("username","") or (u.get("username","") if isinstance(u,dict) else "")

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
log.info(f"   ✓ {n} project_notification_users inserted")

# ═══════════════════════════════════════════════════════════
# STEP 6: project_profit_reports — fix datetime in project_info
# ═══════════════════════════════════════════════════════════
log.info("── Step 6: project_profit_reports — fix datetime serialization")

existing_ppr_ids = {r["project_id"]
                    for r in (sb.table("project_profit_reports").select("project_id").execute().data or [])}

new_ppr = []
for doc in db["project_profit_report"].find({}):
    mongo_pid = str(doc.get("project_id","") or "")
    sb_proj_id = MONGO_PROJ_ID_MAP.get(mongo_pid)
    if not sb_proj_id:
        pi = doc.get("project_info") or {}
        num = pi.get("number","") if isinstance(pi, dict) else ""
        if num: sb_proj_id = PROJ_NUMBER_MAP.get(str(num))
    if not sb_proj_id: continue
    if sb_proj_id in existing_ppr_ids: continue

    new_ppr.append({
        "id":                               new_uuid(),
        "project_id":                       sb_proj_id,
        "project_info":                     deep_serialize(doc.get("project_info") or {}),
        "project_amount":                   doc.get("project_amount"),
        "installation_amount":              doc.get("installation_amount"),
        "installation_cost_subcontractor":  doc.get("installation_cost_subcontractor"),
        "installation_cost_onhouse":        doc.get("installation_cost_onhouse"),
        "installation_profit_subcontractor":doc.get("installation_profit_subcontractor"),
        "installation_profit_onhouse":      doc.get("installation_profit_onhouse"),
        "notes":                            doc.get("notes"),
        "has_been_edited":                  bool(doc.get("has_been_edited", False)),
        "working_type":                     doc.get("working_type"),
        "created_at":                       to_iso(doc.get("created_time")) or now_iso(),
        "updated_at":                       to_iso(doc.get("last_modified_time")) or now_iso(),
    })

n = safe_insert("project_profit_reports", new_ppr)
log.info(f"   ✓ {n} project_profit_reports inserted")

# ═══════════════════════════════════════════════════════════
# STEP 7: project_tracking — fix datetime in managed_data
# ═══════════════════════════════════════════════════════════
log.info("── Step 7: project_tracking — fix datetime serialization")

existing_tr_keys = {(r["user_reporter_id"], r["created_at"][:19] if r.get("created_at") else "")
                    for r in (sb.table("project_tracking").select("user_reporter_id,created_at").execute().data or [])}

new_tr = []
for doc in db["project_tracking"].find({}):
    user_id = resolve_user(doc.get("user_reporter"))
    if not user_id: continue
    ts = to_iso(doc.get("created_time"))
    key = (user_id, ts[:19] if ts else "")
    if key in existing_tr_keys: continue
    new_tr.append({
        "id":               new_uuid(),
        "user_reporter_id": user_id,
        "action":           str(doc.get("action","")),
        "managed_data":     deep_serialize(doc.get("managed_data")),
        "created_at":       ts or now_iso(),
    })
    existing_tr_keys.add(key)

n = safe_insert("project_tracking", new_tr)
log.info(f"   ✓ {n} project_tracking inserted")

# ═══════════════════════════════════════════════════════════
# STEP 8: project_task_comments — clear + full re-insert
# All 263 from MongoDB, using user email resolution
# ═══════════════════════════════════════════════════════════
log.info("── Step 8: project_task_comments — clear + re-insert all 263")

# Clear existing (cascades to project_task_comment_attachments)
try:
    sb.table("project_task_comments").delete().neq("id","00000000-0000-0000-0000-000000000000").execute()
    log.info("   cleared project_task_comments")
except Exception as e:
    log.warning(f"  clear: {str(e)[:80]}")

all_comments = []
skipped = 0
for doc in db["project_task_comment"].find({}):
    user_id = resolve_user(doc.get("user_reporter"))
    if not user_id: skipped += 1; continue

    proj_ref = doc.get("project")
    proj_id = None
    if isinstance(proj_ref, dict):
        proj_id = MONGO_PROJ_ID_MAP.get(str(proj_ref.get("_id","")))
    if not proj_id: skipped += 1; continue

    pdt_ref = doc.get("project_default_task")
    pdt_id = None
    if isinstance(pdt_ref, dict):
        pdt_num = str(pdt_ref.get("number",""))
        pdt_name = str(pdt_ref.get("name",""))
        pdt_id = PROJ_DEF_TASK_MAP.get(pdt_num) or PROJ_DEF_TASK_NAME_MAP.get(pdt_name)

    all_comments.append({
        "id":                      new_uuid(),
        "comment":                 str(doc.get("comment","")),
        "user_reporter_id":        user_id,
        "project_id":              proj_id,
        "project_default_task_id": pdt_id,
        "is_active":               bool(doc.get("is_active", True)),
        "created_at":              to_iso(doc.get("created_time")) or now_iso(),
        "updated_at":              to_iso(doc.get("last_modified_time")) or now_iso(),
    })

n = safe_insert("project_task_comments", all_comments)
log.info(f"   ✓ {n} project_task_comments inserted (skipped {skipped} — no user/project match)")

# ═══════════════════════════════════════════════════════════
# STEP 9: measurement_comment — the 1 still missing
# ═══════════════════════════════════════════════════════════
log.info("── Step 9: measurement_comment — insert missing 1")

existing_mc_keys = {(r["measurement_id"], r["created_at"][:19] if r.get("created_at") else "")
                    for r in (sb.table("measurement_comments").select("measurement_id,created_at").execute().data or [])}

new_mc = []
for doc in db["measurement_comment"].find({}):
    user_id = resolve_user(doc.get("user_reporter"))
    if not user_id: continue
    meas_ref = doc.get("measurement")
    meas_id = MEAS_MAP.get(str(meas_ref.get("_id","")) if isinstance(meas_ref, dict) else "")
    if not meas_id: continue
    ts = to_iso(doc.get("created_time"))
    key = (meas_id, ts[:19] if ts else "")
    if key in existing_mc_keys: continue
    att = doc.get("measurement_default_task_comment_attachments") or []
    att_data = [{"name":a.get("name",""),"file_url":a.get("file","")} for a in att if isinstance(a,dict)] if isinstance(att,list) else []
    new_mc.append({
        "id":               new_uuid(),
        "comment":          str(doc.get("comment","")),
        "user_reporter_id": user_id,
        "measurement_id":   meas_id,
        "comment_attachments": att_data,
        "is_active":        bool(doc.get("is_active", True)),
        "created_at":       ts or now_iso(),
        "updated_at":       to_iso(doc.get("last_modified_time")) or now_iso(),
    })
    existing_mc_keys.add(key)

n = safe_insert("measurement_comments", new_mc)
log.info(f"   ✓ {n} measurement_comments inserted")

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
    ("project_notification","project_notifications"),
    ("project_notification_user","project_notification_users"),
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
        r = sb.table(sb_table).select("id",count="exact").limit(1).execute()
        sc = r.count if (hasattr(r,"count") and r.count is not None) else len(r.data)
    except: sc = "?"
    if isinstance(mc,int) and isinstance(sc,int):
        d = mc - sc
        flag = " ✓" if d <= 0 else f" ← {d} MISSING"
        if d > 0: all_ok = False
    else:
        flag = ""
    log.info(f"  {mc_col:<42} mongo={str(mc):>5}  sb={str(sc):>5}{flag}")

if all_ok:
    log.info("\n  🎉  ALL COLLECTIONS IN SYNC!")
else:
    log.info("\n  ⚠️   Some collections still have gaps (see above)")

log.info("=" * 60)
log.info("  ✅  sync_v4 complete.")
log.info("=" * 60)
