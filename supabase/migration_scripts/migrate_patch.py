"""
Patch migration: fill in data gaps found after full model comparison.

Fixes:
  1. Extract embedded sales_orders from project/service docs → zoho_sales_orders
  2. Update projects.sales_order_id + services.sales_order_id
  3. Migrate project.project_history → project_stage_history
  4. Migrate service.service_history → service_stage_history
  5. Update users.last_login
  6. Update project_attachments.attachment_type

Run from: supabase/migration_scripts/
Requires:  .env.migration with MONGO_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import os, sys, uuid, logging
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient
from supabase import create_client, Client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

load_dotenv(".env.migration")

MONGO_URI   = os.getenv("MONGO_URI", "")
MONGO_DB    = os.getenv("MONGO_DB_NAME", "db_installation")
SB_URL      = os.getenv("SUPABASE_URL", "")
SB_KEY      = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

for var, val in [("MONGO_URI", MONGO_URI), ("SUPABASE_URL", SB_URL), ("SUPABASE_SERVICE_ROLE_KEY", SB_KEY)]:
    if not val:
        log.error(f"{var} not set in .env.migration"); sys.exit(1)

# ── connections ──────────────────────────────────────────────
mongo = MongoClient(MONGO_URI)
db    = mongo[MONGO_DB]
sb: Client = create_client(SB_URL, SB_KEY)

# ── helpers ───────────────────────────────────────────────────
def new_uuid() -> str:
    return str(uuid.uuid4())

def to_iso(val):
    if val is None:
        return None
    if isinstance(val, datetime):
        if val.tzinfo is None:
            val = val.replace(tzinfo=timezone.utc)
        return val.isoformat()
    if isinstance(val, str):
        return val
    return str(val)

def upsert(table: str, rows: list, on_conflict: str = "id", batch: int = 100):
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        try:
            sb.table(table).upsert(chunk, on_conflict=on_conflict).execute()
            total += len(chunk)
        except Exception as e:
            for row in chunk:
                try:
                    sb.table(table).upsert([row], on_conflict=on_conflict).execute()
                    total += 1
                except Exception as inner:
                    log.warning(f"  {table} skip row {row.get('id','?')}: {str(inner)[:120]}")
    return total

def insert_ignore(table: str, rows: list, batch: int = 100):
    """Insert rows without on_conflict — for tables without id as PK."""
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        try:
            sb.table(table).insert(chunk).execute()
            total += len(chunk)
        except Exception as e:
            for row in chunk:
                try:
                    sb.table(table).insert(row).execute()
                    total += 1
                except Exception:
                    pass
    return total

# ── build global ID maps from Supabase ───────────────────────
log.info("── Loading existing ID maps from Supabase")

# project_stages: name → uuid
stage_rows = sb.table("project_stages").select("id,name").execute().data or []
PROJECT_STAGE_MAP = {r["name"]: r["id"] for r in stage_rows}

# service_stages: name → uuid
svc_stage_rows = sb.table("service_stages").select("id,name").execute().data or []
SVC_STAGE_MAP = {r["name"]: r["id"] for r in svc_stage_rows}

# projects: mongo _id string → supabase uuid (via number field)
PROJECT_ID_MAP: dict[str, str] = {}  # mongo str → supabase uuid
for p in db["project"].find({}, {"_id": 1, "number": 1}):
    rows = sb.table("projects").select("id").eq("number", str(p.get("number", ""))).execute().data
    if rows:
        PROJECT_ID_MAP[str(p["_id"])] = rows[0]["id"]

log.info(f"   Mapped {len(PROJECT_ID_MAP)} projects")

# services: mongo _id string → supabase uuid
SERVICE_ID_MAP: dict[str, str] = {}
for s in db["service"].find({}, {"_id": 1, "number": 1}):
    rows = sb.table("services").select("id").eq("number", str(s.get("number", ""))).execute().data
    if rows:
        SERVICE_ID_MAP[str(s["_id"])] = rows[0]["id"]

log.info(f"   Mapped {len(SERVICE_ID_MAP)} services")

# users: mongo email → supabase uuid
USER_EMAIL_MAP: dict[str, str] = {}
for u in db["login_users"].find({}, {"_id": 1, "email": 1, "username": 1}):
    email = (u.get("email") or "").lower()
    rows = sb.table("users").select("id").eq("email", email).execute().data
    if rows:
        USER_EMAIL_MAP[str(u["_id"])] = rows[0]["id"]

log.info(f"   Mapped {len(USER_EMAIL_MAP)} users")


# ════════════════════════════════════════════════════════════
# STEP 1: Extract embedded sales orders → zoho_sales_orders
#         then update projects + services sales_order_id
# ════════════════════════════════════════════════════════════
log.info("── Step 1: sales orders from embedded project/service docs")

SO_MONGO_ID_TO_UUID: dict[str, str] = {}  # mongo _id str → supabase uuid

def build_so_row(so: dict):
    if not isinstance(so, dict):
        return None
    sid = str(so.get("_id") or so.get("salesorder_id") or "")
    if not sid:
        return None
    row_id = SO_MONGO_ID_TO_UUID.get(sid, new_uuid())
    SO_MONGO_ID_TO_UUID[sid] = row_id

    def jsonb(v):
        if v is None: return None
        if isinstance(v, (dict, list)): return v
        return str(v)

    return {
        "id":                    row_id,
        "salesorder_id":         so.get("salesorder_id"),
        "salesorder_number":     so.get("salesorder_number"),
        "date":                  to_iso(so.get("date")),
        "status":                so.get("status"),
        "customer_id":           so.get("customer_id"),
        "customer_name":         so.get("customer_name"),
        "is_taxable":            bool(so.get("is_taxable", True)),
        "tax_id":                so.get("tax_id"),
        "tax_name":              so.get("tax_name"),
        "tax_percentage":        so.get("tax_percentage"),
        "currency_id":           str(so.get("currency_id") or ""),
        "currency_code":         so.get("currency_code"),
        "currency_symbol":       so.get("currency_symbol"),
        "exchange_rate":         so.get("exchange_rate"),
        "delivery_method":       so.get("delivery_method"),
        "total_quantity":        so.get("total_quantity"),
        "sub_total":             so.get("sub_total"),
        "tax_total":             so.get("tax_total"),
        "total":                 so.get("total"),
        "created_by_email":      so.get("created_by_email"),
        "created_by_name":       so.get("created_by_name"),
        "salesperson_id":        so.get("salesperson_id"),
        "salesperson_name":      so.get("salesperson_name"),
        "is_test_order":         bool(so.get("is_test_order", False)),
        "notes":                 so.get("notes"),
        "payment_terms":         int(so.get("payment_terms") or 0),
        "payment_terms_label":   so.get("payment_terms_label"),
        "reference_number":      so.get("reference_number"),
        "line_items":            jsonb(so.get("line_items", [])),
        "shipping_address":      jsonb(so.get("shipping_address")),
        "billing_address":       jsonb(so.get("billing_address")),
        "warehouses":            jsonb(so.get("warehouses", [])),
        "custom_fields":         jsonb(so.get("custom_fields", [])),
        "order_sub_statuses":    jsonb(so.get("order_sub_statuses", [])),
        "shipment_sub_statuses": jsonb(so.get("shipment_sub_statuses", [])),
        "zoho_org_id":           so.get("zoho_org_id"),
        "customer":              jsonb(so.get("customer")),
        "created_time":          to_iso(so.get("created_time")),
        "last_modified_time":    to_iso(so.get("last_modified_time")),
    }

# Collect all unique sales orders
so_rows: dict[str, dict] = {}  # salesorder_id → row
for p in db["project"].find({}, {"_id": 1, "sales_order": 1}):
    so = p.get("sales_order")
    if so and isinstance(so, dict) and so.get("salesorder_id"):
        key = str(so["salesorder_id"])
        if key not in so_rows:
            row = build_so_row(so)
            if row:
                so_rows[key] = row
                # Map the project's mongo sales_order._id
                SO_MONGO_ID_TO_UUID[str(p["_id"])] = row["id"]  # project mongo id → SO uuid (for update below)

for s in db["service"].find({}, {"_id": 1, "sales_order": 1}):
    so = s.get("sales_order")
    if so and isinstance(so, dict) and so.get("salesorder_id"):
        key = str(so["salesorder_id"])
        if key not in so_rows:
            row = build_so_row(so)
            if row:
                so_rows[key] = row

# salesorder_id (zoho) → supabase uuid
SALESORDER_ID_TO_UUID: dict[str, str] = {r["salesorder_id"]: r["id"] for r in so_rows.values() if r.get("salesorder_id")}

# Insert all unique sales orders
count_so = upsert("zoho_sales_orders", list(so_rows.values()), on_conflict="id")
log.info(f"   ✓ {count_so} zoho_sales_orders inserted/updated")

# Now update projects with correct sales_order_id
updated_projects = 0
for p in db["project"].find({"sales_order": {"$ne": None}}, {"_id": 1, "sales_order": 1, "number": 1}):
    so = p.get("sales_order")
    if not so or not isinstance(so, dict):
        continue
    so_key = str(so.get("salesorder_id") or "")
    if not so_key:
        continue
    sb_so_uuid = SALESORDER_ID_TO_UUID.get(so_key)
    proj_sb_uuid = PROJECT_ID_MAP.get(str(p["_id"]))
    if sb_so_uuid and proj_sb_uuid:
        try:
            sb.table("projects").update({"sales_order_id": sb_so_uuid}).eq("id", proj_sb_uuid).execute()
            updated_projects += 1
        except Exception as e:
            log.warning(f"  projects update failed for {p.get('number')}: {str(e)[:100]}")

log.info(f"   ✓ {updated_projects} projects.sales_order_id updated")

# Update services with correct sales_order_id
updated_services = 0
for s in db["service"].find({"sales_order": {"$ne": None}}, {"_id": 1, "sales_order": 1, "number": 1}):
    so = s.get("sales_order")
    if not so or not isinstance(so, dict):
        continue
    so_key = str(so.get("salesorder_id") or "")
    if not so_key:
        continue
    sb_so_uuid = SALESORDER_ID_TO_UUID.get(so_key)
    svc_sb_uuid = SERVICE_ID_MAP.get(str(s["_id"]))
    if sb_so_uuid and svc_sb_uuid:
        try:
            sb.table("services").update({"sales_order_id": sb_so_uuid}).eq("id", svc_sb_uuid).execute()
            updated_services += 1
        except Exception as e:
            log.warning(f"  services update failed for {s.get('number')}: {str(e)[:100]}")

log.info(f"   ✓ {updated_services} services.sales_order_id updated")


# ════════════════════════════════════════════════════════════
# STEP 2: project.project_history → project_stage_history
# ════════════════════════════════════════════════════════════
log.info("── Step 2: project_history → project_stage_history")

history_rows = []
for p in db["project"].find({}, {"_id": 1, "project_history": 1}):
    hist = p.get("project_history") or []
    if not isinstance(hist, list):
        continue
    proj_sb = PROJECT_ID_MAP.get(str(p["_id"]))
    if not proj_sb:
        continue
    for entry in hist:
        if not isinstance(entry, dict):
            continue
        init_stage = entry.get("initial_stage") or {}
        final_stage = entry.get("final_stage") or {}

        init_name  = init_stage.get("name") if isinstance(init_stage, dict) else None
        final_name = final_stage.get("name") if isinstance(final_stage, dict) else None

        init_uuid  = PROJECT_STAGE_MAP.get(init_name) if init_name else None
        final_uuid = PROJECT_STAGE_MAP.get(final_name) if final_name else None

        history_rows.append({
            "id":               new_uuid(),
            "project_id":       proj_sb,
            "stage_id":         final_uuid,        # the stage moved TO
            "initial_stage_id": init_uuid,         # the stage moved FROM
            "user_id":          None,
            "changed_at":       to_iso(entry.get("created_time")) or datetime.now(timezone.utc).isoformat(),
            "notes":            None,
        })

count_ph = upsert("project_stage_history", history_rows, on_conflict="id")
log.info(f"   ✓ {count_ph} project_stage_history rows inserted")


# ════════════════════════════════════════════════════════════
# STEP 3: service.service_history → service_stage_history
# ════════════════════════════════════════════════════════════
log.info("── Step 3: service_history → service_stage_history")

svc_history_rows = []
for s in db["service"].find({}, {"_id": 1, "service_history": 1}):
    hist = s.get("service_history") or []
    if not isinstance(hist, list):
        continue
    svc_sb = SERVICE_ID_MAP.get(str(s["_id"]))
    if not svc_sb:
        continue
    for entry in hist:
        if not isinstance(entry, dict):
            continue
        init_stage = entry.get("initial_stage") or {}
        final_stage = entry.get("final_stage") or {}

        init_name  = init_stage.get("name") if isinstance(init_stage, dict) else None
        final_name = final_stage.get("name") if isinstance(final_stage, dict) else None

        init_uuid  = SVC_STAGE_MAP.get(init_name) if init_name else None
        final_uuid = SVC_STAGE_MAP.get(final_name) if final_name else None

        svc_history_rows.append({
            "id":               new_uuid(),
            "service_id":       svc_sb,
            "stage_id":         final_uuid,
            "initial_stage_id": init_uuid,
            "user_id":          None,
            "changed_at":       to_iso(entry.get("created_time")) or datetime.now(timezone.utc).isoformat(),
            "notes":            None,
        })

count_sh = upsert("service_stage_history", svc_history_rows, on_conflict="id")
log.info(f"   ✓ {count_sh} service_stage_history rows inserted")


# ════════════════════════════════════════════════════════════
# STEP 4: Update users.last_login
# ════════════════════════════════════════════════════════════
log.info("── Step 4: users.last_login")

updated_logins = 0
for u in db["login_users"].find({"last_login": {"$ne": None}}, {"_id": 1, "email": 1, "last_login": 1}):
    email = (u.get("email") or "").lower()
    user_sb = USER_EMAIL_MAP.get(str(u["_id"]))
    if not user_sb:
        continue
    ll = to_iso(u.get("last_login"))
    if ll:
        try:
            sb.table("users").update({"last_login": ll}).eq("id", user_sb).execute()
            updated_logins += 1
        except Exception as e:
            log.warning(f"  last_login update failed for {email}: {str(e)[:100]}")

log.info(f"   ✓ {updated_logins} users.last_login updated")


# ════════════════════════════════════════════════════════════
# STEP 5: project_attachments.attachment_type
# ════════════════════════════════════════════════════════════
log.info("── Step 5: project_attachments.attachment_type")

# Build project_attachment mongo_id → supabase id map by file URL
updated_att = 0
for a in db["project_attachment"].find({"attachment_type": {"$ne": None}}, {"_id": 1, "name": 1, "file": 1, "attachment_type": 1}):
    att_type = a.get("attachment_type")
    file_val = a.get("file") or ""
    name_val = a.get("name") or ""
    if not att_type:
        continue
    # Find by file_url
    rows = (sb.table("project_attachments")
              .select("id")
              .eq("name", name_val)
              .execute().data or [])
    if not rows and file_val:
        rows = (sb.table("project_attachments")
                  .select("id")
                  .eq("file_url", file_val)
                  .execute().data or [])
    for r in rows:
        try:
            sb.table("project_attachments").update({"attachment_type": att_type}).eq("id", r["id"]).execute()
            updated_att += 1
        except Exception as e:
            log.warning(f"  attachment_type update failed: {str(e)[:100]}")

log.info(f"   ✓ {updated_att} project_attachments.attachment_type updated")


# ════════════════════════════════════════════════════════════
# STEP 6: services.client (JSONB — currently all null in data,
#         but update if any exist for future safety)
# ════════════════════════════════════════════════════════════
log.info("── Step 6: services.client")
updated_clients = 0
for s in db["service"].find({"client": {"$ne": None}}, {"_id": 1, "client": 1}):
    client_val = s.get("client")
    svc_sb = SERVICE_ID_MAP.get(str(s["_id"]))
    if svc_sb and client_val:
        try:
            sb.table("services").update({"client": client_val}).eq("id", svc_sb).execute()
            updated_clients += 1
        except Exception as e:
            log.warning(f"  client update: {str(e)[:100]}")
log.info(f"   ✓ {updated_clients} services.client updated")


log.info("=" * 60)
log.info("  ✅  Patch migration complete.")
log.info("=" * 60)
