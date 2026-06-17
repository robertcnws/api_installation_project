"""
MongoDB → Supabase Migration Script
=====================================
Migrates all collections from the MongoDB backend to the Supabase PostgreSQL schema.

Usage:
  1. Copy .env.migration.example to .env.migration and fill in credentials
  2. pip install -r requirements.txt
  3. python migrate.py

  Or run specific modules:
  3. python migrate.py --only users,projects

Flags:
  --only <modules>    Comma-separated list of modules to migrate
  --dry-run           Validate data without inserting
  --skip-auth         Skip creating Supabase auth users (useful if they already exist)
  --batch-size N      Number of records to insert per batch (default 100)
"""

import os
import sys
import uuid
import json
import argparse
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
from tqdm import tqdm
from supabase import create_client, Client

# ─────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────
load_dotenv(".env.migration")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("migration.log"),
    ],
)
log = logging.getLogger(__name__)

MONGO_URI       = os.environ["MONGO_URI"]
MONGO_DB_NAME   = os.environ["MONGO_DB_NAME"]
SUPABASE_URL    = os.environ["SUPABASE_URL"]
SUPABASE_KEY    = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DEFAULT_PASS    = os.getenv("MIGRATED_USER_DEFAULT_PASSWORD", "ChangeMe2024!")

# ─────────────────────────────────────────────
# Global ObjectId → UUID mapping registry
# Ensures the same Mongo _id always maps to the same UUID across all collections
# ─────────────────────────────────────────────
ID_MAP: dict[str, str] = {}   # mongo_id_str → uuid_str

def to_uuid(mongo_id) -> str:
    """Convert a MongoDB ObjectId (or string) to a deterministic UUID."""
    if mongo_id is None:
        return None
    key = str(mongo_id)
    if key not in ID_MAP:
        ID_MAP[key] = str(uuid.uuid4())
    return ID_MAP[key]

def resolve_id(field) -> Optional[str]:
    """Resolve a DynamicField that might be an ObjectId, dict with 'id'/'_id', or string."""
    if field is None:
        return None
    if isinstance(field, ObjectId):
        return to_uuid(field)
    if isinstance(field, dict):
        raw = field.get("id") or field.get("_id") or field.get("$oid")
        if raw:
            return to_uuid(raw)
        return None
    if isinstance(field, str) and len(field) == 24:
        # Likely a hex ObjectId string
        return to_uuid(field)
    return None

def dt(value) -> Optional[str]:
    """Normalize a datetime to an ISO string for Supabase."""
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    if isinstance(value, str):
        return value
    return None

def clean_jsonb(value) -> Any:
    """Recursively convert ObjectIds in a value to strings for JSONB storage."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return dt(value)
    if isinstance(value, dict):
        return {k: clean_jsonb(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean_jsonb(i) for i in value]
    return value

def batch_insert(supabase: Client, table: str, rows: list[dict], dry_run: bool, batch_size: int = 100):
    """Insert rows into a Supabase table in batches, skipping conflicts."""
    if not rows:
        return 0
    inserted = 0
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        if dry_run:
            log.info(f"  [DRY RUN] Would insert {len(chunk)} rows into {table}")
            inserted += len(chunk)
            continue
        try:
            supabase.table(table).upsert(chunk, on_conflict="id").execute()
            inserted += len(chunk)
        except Exception as e:
            log.error(f"  Error inserting into {table}: {e}")
            log.debug(f"  First failing row: {json.dumps(chunk[0], default=str)}")
    return inserted

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 1 — User Roles
# ─────────────────────────────────────────────────────────────────────────────
def migrate_user_roles(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating user_role → user_roles")
    docs = list(mongo_db["user_role"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":          to_uuid(doc["_id"]),
            "name":        doc.get("name", ""),
            "description": doc.get("description"),
            "is_active":   doc.get("is_active", True),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "user_roles", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} user_roles")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 2 — Users (Login Users)
# NOTE: also creates Supabase auth.users via Admin API
# ─────────────────────────────────────────────────────────────────────────────
def migrate_users(mongo_db, supabase, dry_run, skip_auth, batch_size):
    log.info("── Migrating login_users → users")
    docs = list(mongo_db["login_users"].find())
    rows = []

    for doc in docs:
        user_uuid = to_uuid(doc["_id"])
        email = doc.get("email") or f"{doc.get('username', user_uuid)}@migrated.local"

        # Create Supabase auth user
        if not skip_auth and not dry_run:
            try:
                # Use admin API to create auth user with known UUID
                supabase.auth.admin.create_user({
                    "id":                user_uuid,
                    "email":             email,
                    "password":          DEFAULT_PASS,
                    "email_confirm":     True,
                    "user_metadata": {
                        "username":   doc.get("username", ""),
                        "first_name": doc.get("first_name", ""),
                        "last_name":  doc.get("last_name", ""),
                        "migrated":   True,
                    },
                })
            except Exception as e:
                if "already registered" in str(e).lower() or "already exists" in str(e).lower():
                    log.debug(f"   Auth user {email} already exists, skipping")
                else:
                    log.warning(f"   Could not create auth user for {email}: {e}")

        role_ref = doc.get("user_role")
        rows.append({
            "id":            user_uuid,
            "username":      doc.get("username", f"user_{user_uuid[:8]}"),
            "first_name":    doc.get("first_name"),
            "last_name":     doc.get("last_name"),
            "email":         email,
            "is_staff":      bool(doc.get("is_staff", False)),
            "is_active":     bool(doc.get("is_active", True)),
            "phone_number":  doc.get("phone_number"),
            "country":       doc.get("country"),
            "state":         doc.get("state"),
            "city":          doc.get("city"),
            "address":       doc.get("address"),
            "zip_code":      doc.get("zip_code"),
            "gender":        doc.get("gender"),
            "avatar_url":    doc.get("avatar_url"),
            "user_role_id":  resolve_id(role_ref),
            "installer_info": clean_jsonb(doc.get("installer_info")),
            "created_at":    dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":    dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })

    n = batch_insert(supabase, "users", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} users")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 3 — Project Stages
# ─────────────────────────────────────────────────────────────────────────────
def migrate_project_stages(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_stage → project_stages")
    docs = list(mongo_db["project_stage"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":          to_uuid(doc["_id"]),
            "name":        doc.get("name", ""),
            "description": doc.get("description"),
            "is_active":   bool(doc.get("is_active", True)),
            "order":       doc.get("order"),
            "other_name":  doc.get("other_name"),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_stages", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_stages")

def migrate_project_task_stages(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_task_stage → project_task_stages")
    docs = list(mongo_db["project_task_stage"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":          to_uuid(doc["_id"]),
            "name":        doc.get("name", ""),
            "description": doc.get("description"),
            "is_active":   bool(doc.get("is_active", True)),
            "order":       doc.get("order"),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_task_stages", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_task_stages")

def migrate_project_roles(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_role → project_roles")
    docs = list(mongo_db["project_role"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":          to_uuid(doc["_id"]),
            "name":        doc.get("name", ""),
            "description": doc.get("description"),
            "is_active":   bool(doc.get("is_active", True)),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_roles", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_roles")

def migrate_project_permissions(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_permissions → project_permissions")
    docs = list(mongo_db["project_permissions"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":          to_uuid(doc["_id"]),
            "name":        doc.get("name", ""),
            "description": doc.get("description"),
            "is_active":   bool(doc.get("is_active", True)),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_permissions", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_permissions")

def migrate_service_stages(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating service_stage → service_stages")
    docs = list(mongo_db["service_stage"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":          to_uuid(doc["_id"]),
            "name":        doc.get("name", ""),
            "description": doc.get("description"),
            "is_active":   bool(doc.get("is_active", True)),
            "order":       doc.get("order"),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "service_stages", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} service_stages")

def migrate_service_issues(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating service_issue → service_issues")
    docs = list(mongo_db["service_issue"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":               to_uuid(doc["_id"]),
            "name":             doc.get("name", ""),
            "description":      doc.get("description"),
            "user_reporter_id": resolve_id(doc.get("user_reporter")),
            "is_active":        bool(doc.get("is_active", True)),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "service_issues", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} service_issues")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 4 — Zoho Integration
# ─────────────────────────────────────────────────────────────────────────────
def migrate_zoho_customers(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating zoho_customer → zoho_customers")
    docs = list(mongo_db["zoho_customer"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                                   to_uuid(doc["_id"]),
            "contact_id":                           doc.get("contact_id", ""),
            "contact_name":                         doc.get("contact_name", ""),
            "customer_name":                        doc.get("customer_name", ""),
            "company_name":                         doc.get("company_name"),
            "status":                               doc.get("status", ""),
            "first_name":                           doc.get("first_name", ""),
            "last_name":                            doc.get("last_name", ""),
            "email":                                doc.get("email", ""),
            "phone":                                doc.get("phone", ""),
            "mobile":                               doc.get("mobile"),
            "contact_type":                         doc.get("contact_type", ""),
            "has_transaction":                      doc.get("has_transaction"),
            "is_linked_with_zohocrm":               doc.get("is_linked_with_zohocrm"),
            "website":                              doc.get("website"),
            "primary_contact_id":                   doc.get("primary_contact_id"),
            "payment_terms":                        doc.get("payment_terms"),
            "payment_terms_label":                  doc.get("payment_terms_label"),
            "currency_id":                          doc.get("currency_id"),
            "currency_code":                        doc.get("currency_code"),
            "currency_symbol":                      doc.get("currency_symbol"),
            "outstanding_receivable_amount":        doc.get("outstanding_receivable_amount"),
            "outstanding_receivable_amount_bcy":    doc.get("outstanding_receivable_amount_bcy"),
            "unused_credits_receivable_amount":     doc.get("unused_credits_receivable_amount"),
            "unused_credits_receivable_amount_bcy": doc.get("unused_credits_receivable_amount_bcy"),
            "notes":                                doc.get("notes"),
            "is_taxable":                           doc.get("is_taxable"),
            "tax_id":                               doc.get("tax_id"),
            "tax_name":                             doc.get("tax_name"),
            "tax_percentage":                       doc.get("tax_percentage"),
            "custom_fields":                        clean_jsonb(doc.get("custom_fields", [])),
            "billing_address":                      clean_jsonb(doc.get("billing_address")),
            "shipping_address":                     clean_jsonb(doc.get("shipping_address")),
            "contact_persons":                      clean_jsonb(doc.get("contact_persons", [])),
            "default_templates":                    clean_jsonb(doc.get("default_templates")),
            "qb_list_id":                           doc.get("qb_list_id"),
            "created_time":                         dt(doc.get("created_time")),
            "last_modified_time":                   dt(doc.get("last_modified_time")),
            "created_at":                           dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":                           dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "zoho_customers", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} zoho_customers")

def migrate_zoho_sales_orders(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating zoho_inventory_shipment_sales_order → zoho_sales_orders")
    docs = list(mongo_db["zoho_inventory_shipment_sales_order"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                   to_uuid(doc["_id"]),
            "salesorder_id":        doc.get("salesorder_id"),
            "salesorder_number":    doc.get("salesorder_number"),
            "date":                 dt(doc.get("date")),
            "status":               doc.get("status"),
            "customer_id":          doc.get("customer_id"),
            "customer_name":        doc.get("customer_name"),
            "is_taxable":           doc.get("is_taxable"),
            "tax_id":               doc.get("tax_id"),
            "tax_name":             doc.get("tax_name"),
            "tax_percentage":       doc.get("tax_percentage"),
            "currency_id":          doc.get("currency_id"),
            "currency_code":        doc.get("currency_code"),
            "currency_symbol":      doc.get("currency_symbol"),
            "exchange_rate":        doc.get("exchange_rate"),
            "delivery_method":      doc.get("delivery_method"),
            "total_quantity":       doc.get("total_quantity"),
            "sub_total":            doc.get("sub_total"),
            "tax_total":            doc.get("tax_total"),
            "total":                doc.get("total"),
            "created_by_email":     doc.get("created_by_email"),
            "created_by_name":      doc.get("created_by_name"),
            "salesperson_id":       doc.get("salesperson_id"),
            "salesperson_name":     doc.get("salesperson_name"),
            "is_test_order":        doc.get("is_test_order"),
            "notes":                doc.get("notes"),
            "payment_terms":        doc.get("payment_terms"),
            "payment_terms_label":  doc.get("payment_terms_label"),
            "reference_number":     doc.get("reference_number"),
            "line_items":           clean_jsonb(doc.get("line_items", [])),
            "shipping_address":     clean_jsonb(doc.get("shipping_address")),
            "billing_address":      clean_jsonb(doc.get("billing_address")),
            "warehouses":           clean_jsonb(doc.get("warehouses", [])),
            "custom_fields":        clean_jsonb(doc.get("custom_fields", [])),
            "order_sub_statuses":   clean_jsonb(doc.get("order_sub_statuses", [])),
            "shipment_sub_statuses": clean_jsonb(doc.get("shipment_sub_statuses", [])),
            "created_time":         dt(doc.get("created_time")),
            "last_modified_time":   dt(doc.get("last_modified_time")),
            "created_at":           dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":           dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "zoho_sales_orders", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} zoho_sales_orders")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 5 — Project Default Tasks & Guide Products
# ─────────────────────────────────────────────────────────────────────────────
def migrate_project_default_guide_products(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_default_guide_product → project_default_guide_products")
    docs = list(mongo_db["project_default_guide_product"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":          to_uuid(doc["_id"]),
            "name":        doc.get("name", ""),
            "description": doc.get("description"),
            "price":       doc.get("price"),
            "is_active":   bool(doc.get("is_active", True)),
            "order":       doc.get("order"),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_default_guide_products", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_default_guide_products")

def migrate_project_default_materials(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_default_material → project_default_materials")
    docs = list(mongo_db["project_default_material"].find())
    rows = []
    junction_rows = []

    for doc in docs:
        mat_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":               mat_uuid,
            "name":             doc.get("name", ""),
            "description":      doc.get("description"),
            "price":            doc.get("price"),
            "quantity":         doc.get("quantity"),
            "is_packaged":      bool(doc.get("is_packaged", False)),
            "package_quantity": doc.get("package_quantity"),
            "is_active":        bool(doc.get("is_active", True)),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
        for gp in doc.get("default_guide_products", []):
            gp_id = resolve_id(gp)
            if gp_id:
                junction_rows.append({
                    "default_material_id":      mat_uuid,
                    "default_guide_product_id": gp_id,
                })

    n = batch_insert(supabase, "project_default_materials", rows, dry_run, batch_size)
    j = batch_insert(supabase, "project_default_material_guide_products", junction_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_default_materials, {j} guide_product links")

def migrate_project_default_tasks(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_default_task → project_default_tasks")
    docs = list(mongo_db["project_default_task"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                   to_uuid(doc["_id"]),
            "name":                 doc.get("name", ""),
            "number":               doc.get("number"),
            "description":          doc.get("description"),
            "order":                doc.get("order"),
            "project_stage_id":     resolve_id(doc.get("project_stage")),
            "project_stage_status": doc.get("project_stage_status"),
            "has_attachments":      bool(doc.get("has_attachments", False)),
            "is_active":            bool(doc.get("is_active", True)),
            "created_at":           dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":           dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_default_tasks", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_default_tasks")

def migrate_service_default_tasks(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating service_default_task → service_default_tasks")
    docs = list(mongo_db["service_default_task"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                    to_uuid(doc["_id"]),
            "name":                  doc.get("name", ""),
            "number":                doc.get("number"),
            "description":           doc.get("description"),
            "order":                 doc.get("order"),
            "service_stage_id":      resolve_id(doc.get("service_stage")),
            "service_stage_status":  doc.get("service_stage_status"),
            "has_attachments":       bool(doc.get("has_attachments", False)),
            "is_active":             bool(doc.get("is_active", True)),
            "created_at":            dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":            dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "service_default_tasks", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} service_default_tasks")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 6 — Projects (core)
# ─────────────────────────────────────────────────────────────────────────────
def migrate_projects(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project → projects")
    docs = list(mongo_db["project"].find())
    rows = []
    assignee_rows = []

    for doc in tqdm(docs, desc="projects"):
        proj_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":                             proj_uuid,
            "name":                           doc.get("name", ""),
            "number":                         doc.get("number", ""),
            "description":                    doc.get("description"),
            "sales_order_id":                 resolve_id(doc.get("sales_order")),
            "reference_number":               doc.get("reference_number"),
            "user_reporter_id":               resolve_id(doc.get("user_reporter")),
            "user_manager_id":                resolve_id(doc.get("user_manager")),
            "user_installer_id":              resolve_id(doc.get("user_installer")),
            "current_stage_id":               resolve_id(doc.get("current_stage")),
            "start_date":                     dt(doc.get("start_date")),
            "end_date":                       dt(doc.get("end_date")),
            "duration":                       doc.get("duration"),
            "address":                        doc.get("address"),
            "phone":                          doc.get("phone"),
            "is_active":                      bool(doc.get("is_active", True)),
            "has_permission":                 bool(doc.get("has_permission", False)),
            "all_products_marked":            bool(doc.get("all_products_marked", False)),
            "all_windows_marked":             bool(doc.get("all_windows_marked", False)),
            "all_screw_marked":               bool(doc.get("all_screw_marked", False)),
            "all_trash_marked":               bool(doc.get("all_trash_marked", False)),
            "feedback":                       doc.get("feedback"),
            "work_scope":                     doc.get("work_scope"),
            "project_materials_other_notes":  doc.get("project_materials_other_notes"),
            "inspection_date":                dt(doc.get("inspection_date")),
            "inspection_end_date":            dt(doc.get("inspection_end_date")),
            "inspection_duration":            doc.get("inspection_duration"),
            "inspection_is_part_days":        bool(doc.get("inspection_is_part_days", False)),
            "finish_permission_date":         dt(doc.get("finish_permission_date")),
            "finish_permission_end_date":     dt(doc.get("finish_permission_end_date")),
            "finish_permission_duration":     doc.get("finish_permission_duration"),
            "finish_permission_is_part_days": bool(doc.get("finish_permission_is_part_days", False)),
            "is_part_days":                   bool(doc.get("is_part_days", False)),
            "created_at":                     dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":                     dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })

        for assignee in doc.get("users_assignees", []):
            uid = resolve_id(assignee)
            if uid:
                assignee_rows.append({
                    "id":         str(uuid.uuid4()),
                    "project_id": proj_uuid,
                    "user_id":    uid,
                })

    n = batch_insert(supabase, "projects", rows, dry_run, batch_size)
    a = batch_insert(supabase, "project_assignees", assignee_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} projects, {a} assignees")

def migrate_project_users(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_user → project_users")
    docs = list(mongo_db["project_user"].find())
    rows = []
    perm_rows = []

    for doc in docs:
        pu_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":         pu_uuid,
            "user_id":    resolve_id(doc.get("user")),
            "project_id": resolve_id(doc.get("project")),
            "role_id":    resolve_id(doc.get("role")),
            "is_active":  bool(doc.get("is_active", True)),
            "created_at": dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at": dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
        for perm in doc.get("project_permissions", []):
            perm_id = resolve_id(perm)
            if perm_id:
                perm_rows.append({
                    "id":              str(uuid.uuid4()),
                    "project_user_id": pu_uuid,
                    "permission_id":   perm_id,
                })

    n = batch_insert(supabase, "project_users", rows, dry_run, batch_size)
    p = batch_insert(supabase, "project_user_permissions", perm_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_users, {p} permissions")

def migrate_project_attachments(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_attachment → project_attachments")
    docs = list(mongo_db["project_attachment"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":               to_uuid(doc["_id"]),
            "name":             doc.get("name", ""),
            "description":      doc.get("description"),
            "file_url":         doc.get("file"),
            "project_id":       resolve_id(doc.get("project")),
            "user_upload_id":   resolve_id(doc.get("user_upload")),
            "current_stage_id": resolve_id(doc.get("current_stage")),
            "is_active":        bool(doc.get("is_active", True)),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_attachments", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_attachments")

def migrate_project_materials(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_material → project_materials")
    docs = list(mongo_db["project_material"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":               to_uuid(doc["_id"]),
            "name":             doc.get("name", ""),
            "description":      doc.get("description"),
            "quantity":         doc.get("quantity"),
            "cost":             doc.get("cost"),
            "store":            doc.get("store"),
            "notes":            doc.get("notes"),
            "project_id":       resolve_id(doc.get("project")),
            "user_reporter_id": resolve_id(doc.get("user_reporter")),
            "is_active":        bool(doc.get("is_active", True)),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_materials", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_materials")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 7 — Project Tasks
# ─────────────────────────────────────────────────────────────────────────────
def migrate_project_tasks(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_task → project_tasks")
    docs = list(mongo_db["project_task"].find())
    rows = []
    assignee_rows = []

    for doc in tqdm(docs, desc="project_tasks"):
        task_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":               task_uuid,
            "name":             doc.get("name", ""),
            "number":           doc.get("number", ""),
            "description":      doc.get("description"),
            "project_id":       resolve_id(doc.get("project")),
            "user_reporter_id": resolve_id(doc.get("user_reporter")),
            "current_stage_id": resolve_id(doc.get("current_stage")),
            "start_date":       dt(doc.get("start_date")),
            "end_date":         dt(doc.get("end_date")),
            "priority":         doc.get("priority"),
            "is_active":        bool(doc.get("is_active", True)),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
        for assignee in doc.get("users_assignees", []):
            uid = resolve_id(assignee)
            if uid:
                assignee_rows.append({
                    "id":              str(uuid.uuid4()),
                    "project_task_id": task_uuid,
                    "user_id":         uid,
                })

    n = batch_insert(supabase, "project_tasks", rows, dry_run, batch_size)
    a = batch_insert(supabase, "project_task_assignees", assignee_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_tasks, {a} assignees")

def migrate_project_task_comments(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_task_comment → project_task_comments")
    docs = list(mongo_db["project_task_comment"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                      to_uuid(doc["_id"]),
            "comment":                 doc.get("comment", ""),
            "user_reporter_id":        resolve_id(doc.get("user_reporter")),
            "project_id":              resolve_id(doc.get("project")),
            "project_default_task_id": resolve_id(doc.get("project_default_task")),
            "is_active":               bool(doc.get("is_active", True)),
            "created_at":              dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":              dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_task_comments", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_task_comments")

def migrate_project_task_attachments(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_task_attachment → project_task_attachments")
    docs = list(mongo_db["project_task_attachment"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                    to_uuid(doc["_id"]),
            "name":                  doc.get("name", ""),
            "description":           doc.get("description"),
            "file_url":              doc.get("file"),
            "due_project_stage_id":  resolve_id(doc.get("due_project_stage")),
            "user_upload_id":        resolve_id(doc.get("user_upload")),
            "project_task_id":       resolve_id(doc.get("project_task")),
            "is_active":             bool(doc.get("is_active", True)),
            "created_at":            dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":            dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_task_attachments", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_task_attachments")

def migrate_project_task_history(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_task_history")
    docs = list(mongo_db["project_task_history"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                       to_uuid(doc["_id"]),
            "project_task_id":          resolve_id(doc.get("project_task")),
            "user_involved_id":         resolve_id(doc.get("user_involved")),
            "project_stage_initial_id": resolve_id(doc.get("project_stage_initial")),
            "project_stage_final_id":   resolve_id(doc.get("project_stage_final")),
            "initial_date":             dt(doc.get("initial_date")),
            "final_date":               dt(doc.get("final_date")),
            "created_at":               dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_task_history", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_task_history")

def migrate_project_default_task_info(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_default_task_info")
    docs = list(mongo_db["project_default_task_info"].find())
    rows = []
    assignee_rows = []
    for doc in docs:
        info_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":                       info_uuid,
            "project_default_task_id":  resolve_id(doc.get("project_default_task")),
            "project_id":               resolve_id(doc.get("project")),
            "status":                   doc.get("status"),
            "percentage":               doc.get("percentage"),
            "is_active":                bool(doc.get("is_active", True)),
            "created_at":               dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":               dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
        for assignee in doc.get("users_assignees", []):
            uid = resolve_id(assignee)
            if uid:
                assignee_rows.append({
                    "id":                           str(uuid.uuid4()),
                    "project_default_task_info_id": info_uuid,
                    "user_id":                      uid,
                })
    n = batch_insert(supabase, "project_default_task_info", rows, dry_run, batch_size)
    a = batch_insert(supabase, "project_default_task_assignees", assignee_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_default_task_info, {a} assignees")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 8 — Project Notifications, Calendar, Extras
# ─────────────────────────────────────────────────────────────────────────────
def migrate_project_notifications(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_notification → project_notifications")
    docs = list(mongo_db["project_notification"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":         to_uuid(doc["_id"]),
            "module":     doc.get("module"),
            "info":       doc.get("info"),
            "info_id":    doc.get("info_id"),
            "type":       doc.get("type", "load"),
            "created_at": dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at": dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_notifications", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_notifications")

def migrate_project_notification_users(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_notification_user → project_notification_users")
    docs = list(mongo_db["project_notification_user"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":              to_uuid(doc["_id"]),
            "notification_id": resolve_id(doc.get("notification")),
            "user_id":         resolve_id(doc.get("user")),
            "username":        doc.get("username", ""),
            "read":            bool(doc.get("read", False)),
            "created_at":      dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":      dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_notification_users", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_notification_users")

def migrate_project_calendar_notes(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_calendar_notes")
    docs = list(mongo_db["project_calendar_notes"].find())
    rows = []
    assignee_rows = []
    event_rows = []
    for doc in docs:
        note_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":                note_uuid,
            "name":              doc.get("name", ""),
            "description":       doc.get("description"),
            "start_date":        dt(doc.get("start_date")),
            "end_date":          dt(doc.get("end_date")),
            "duration":          doc.get("duration"),
            "user_manager_id":   resolve_id(doc.get("user_manager")),
            "user_installer_id": resolve_id(doc.get("user_installer")),
            "user_reporter_id":  resolve_id(doc.get("user_reporter")),
            "is_active":         bool(doc.get("is_active", True)),
            "created_at":        dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":        dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
        for ua in doc.get("user_assignees", []):
            uid = resolve_id(ua)
            if uid:
                assignee_rows.append({"id": str(uuid.uuid4()), "calendar_note_id": note_uuid, "user_id": uid})
        for ev in doc.get("associated_events", []):
            pid = resolve_id(ev)
            if pid:
                event_rows.append({"id": str(uuid.uuid4()), "calendar_note_id": note_uuid, "project_id": pid})

    n = batch_insert(supabase, "project_calendar_notes", rows, dry_run, batch_size)
    a = batch_insert(supabase, "project_calendar_note_assignees", assignee_rows, dry_run, batch_size)
    e = batch_insert(supabase, "project_calendar_note_events", event_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} notes, {a} assignees, {e} events")

def migrate_project_reminders(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_remainder → project_reminders")
    docs = list(mongo_db["project_remainder"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                       to_uuid(doc["_id"]),
            "user_reporter_id":         resolve_id(doc.get("user_reporter")),
            "project_id":               resolve_id(doc.get("project")),
            "project_default_task_id":  resolve_id(doc.get("project_default_task")),
            "notes":                    doc.get("notes"),
            "date":                     dt(doc.get("date")),
            "is_active":                bool(doc.get("is_active", True)),
            "created_at":               dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":               dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_reminders", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_reminders")

def migrate_project_profit_reports(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_profit_report → project_profit_reports")
    docs = list(mongo_db["project_profit_report"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                                to_uuid(doc["_id"]),
            "project_id":                        resolve_id({"_id": doc.get("project_id")}) or doc.get("project_id"),
            "project_info":                      clean_jsonb(doc.get("project_info", {})),
            "project_amount":                    doc.get("project_amount"),
            "installation_amount":               doc.get("installation_amount"),
            "installation_cost_subcontractor":   doc.get("installation_cost_subcontractor"),
            "installation_cost_onhouse":         doc.get("installation_cost_onhouse"),
            "installation_profit_subcontractor": doc.get("installation_profit_subcontractor"),
            "installation_profit_onhouse":       doc.get("installation_profit_onhouse"),
            "notes":                             doc.get("notes"),
            "has_been_edited":                   bool(doc.get("has_been_edited", False)),
            "working_type":                      doc.get("working_type"),
            "created_at":                        dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":                        dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_profit_reports", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_profit_reports")

def migrate_project_installation_crews(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_installation_crew → project_installation_crews")
    docs = list(mongo_db["project_installation_crew"].find())
    rows = []
    installer_rows = []
    helper_rows = []
    for doc in docs:
        crew_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":               crew_uuid,
            "name":             doc.get("name", ""),
            "cost_by_unit":     doc.get("cost_by_unit"),
            "unit":             clean_jsonb(doc.get("unit")),
            "type_crew":        clean_jsonb(doc.get("type_crew")),
            "type_working":     clean_jsonb(doc.get("type_working")),
            "description":      doc.get("description"),
            "user_reporter_id": resolve_id(doc.get("user_reporter")),
            "is_active":        bool(doc.get("is_active", True)),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
        for u in doc.get("users_installers", []):
            uid = resolve_id(u)
            if uid:
                installer_rows.append({"id": str(uuid.uuid4()), "crew_id": crew_uuid, "user_id": uid})
        for u in doc.get("users_helpers", []):
            uid = resolve_id(u)
            if uid:
                helper_rows.append({"id": str(uuid.uuid4()), "crew_id": crew_uuid, "user_id": uid})

    n = batch_insert(supabase, "project_installation_crews", rows, dry_run, batch_size)
    i = batch_insert(supabase, "project_installation_crew_installers", installer_rows, dry_run, batch_size)
    h = batch_insert(supabase, "project_installation_crew_helpers", helper_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} crews, {i} installers, {h} helpers")

def migrate_project_tracking(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating project_tracking")
    docs = list(mongo_db["project_tracking"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":               to_uuid(doc["_id"]),
            "user_reporter_id": resolve_id(doc.get("user_reporter")),
            "action":           doc.get("action", ""),
            "managed_data":     clean_jsonb(doc.get("managed_data")),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "project_tracking", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} project_tracking")

def migrate_work_orders(mongo_db, supabase, dry_run, batch_size):
    """Migrate embedded work_orders from project documents into the work_orders table."""
    log.info("── Extracting work_orders from project documents")
    docs = list(mongo_db["project"].find({"work_orders": {"$exists": True, "$ne": []}}))
    rows = []
    for doc in docs:
        proj_uuid = to_uuid(doc["_id"])
        for wo in doc.get("work_orders", []):
            if isinstance(wo, dict):
                wo_id = wo.get("_id") or wo.get("id")
                rows.append({
                    "id":             to_uuid(wo_id) if wo_id else str(uuid.uuid4()),
                    "project_id":     proj_uuid,
                    "name":           wo.get("name"),
                    "description":    wo.get("description"),
                    "status":         wo.get("status"),
                    "assigned_to_id": resolve_id(wo.get("assigned_to") or wo.get("user")),
                    "start_date":     dt(wo.get("start_date")),
                    "end_date":       dt(wo.get("end_date")),
                    "notes":          wo.get("notes"),
                    "extra_data":     clean_jsonb({k: v for k, v in wo.items() if k not in (
                        "_id", "id", "name", "description", "status", "start_date", "end_date", "notes"
                    )}),
                    "is_active":      bool(wo.get("is_active", True)),
                    "created_at":     dt(wo.get("created_time")) or datetime.utcnow().isoformat(),
                    "updated_at":     dt(wo.get("last_modified_time")) or datetime.utcnow().isoformat(),
                })
    n = batch_insert(supabase, "work_orders", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} work_orders")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 9 — Services
# ─────────────────────────────────────────────────────────────────────────────
def migrate_services(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating service → services")
    docs = list(mongo_db["service"].find())
    rows = []
    assignee_rows = []
    team_rows = []

    for doc in tqdm(docs, desc="services"):
        svc_uuid = to_uuid(doc["_id"])
        rows.append({
            "id":               svc_uuid,
            "number":           doc.get("number", ""),
            "name":             doc.get("name", ""),
            "version":          doc.get("version", 1),
            "sales_order_id":   resolve_id(doc.get("sales_order")),
            "reference_number": doc.get("reference_number"),
            "phone":            doc.get("phone"),
            "user_reporter_id": resolve_id(doc.get("user_reporter")),
            "user_manager_id":  resolve_id(doc.get("user_manager")),
            "created_by_id":    resolve_id(doc.get("created_by")),
            "current_stage_id": resolve_id(doc.get("current_stage")),
            "start_date":       dt(doc.get("start_date")),
            "end_date":         dt(doc.get("end_date")),
            "duration":         doc.get("duration"),
            "address":          doc.get("address"),
            "is_active":        bool(doc.get("is_active", True)),
            "service_type":     doc.get("service_type"),
            "service_place":    clean_jsonb(doc.get("service_place")),
            "service_notes":    doc.get("service_notes"),
            "has_to_pay":       bool(doc.get("has_to_pay", False)),
            "paid":             bool(doc.get("paid", False)),
            "by_factory":       bool(doc.get("by_factory", False)),
            "repaired":         bool(doc.get("repaired", False)),
            "is_part_days":     bool(doc.get("is_part_days", False)),
            "is_closed":        bool(doc.get("is_closed", False)),
            "issued_products":  clean_jsonb(doc.get("issued_products", [])),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
        for u in doc.get("users_assignees", []):
            uid = resolve_id(u)
            if uid:
                assignee_rows.append({"id": str(uuid.uuid4()), "service_id": svc_uuid, "user_id": uid})
        for u in doc.get("users_service_team", []):
            uid = resolve_id(u)
            if uid:
                team_rows.append({"id": str(uuid.uuid4()), "service_id": svc_uuid, "user_id": uid})

    n = batch_insert(supabase, "services", rows, dry_run, batch_size)
    a = batch_insert(supabase, "service_assignees", assignee_rows, dry_run, batch_size)
    t = batch_insert(supabase, "service_team_members", team_rows, dry_run, batch_size)
    log.info(f"   ✓ {n} services, {a} assignees, {t} team members")

def migrate_service_attachments(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating service_attachment → service_attachments")
    docs = list(mongo_db["service_attachment"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                      to_uuid(doc["_id"]),
            "name":                    doc.get("name", ""),
            "description":             doc.get("description"),
            "file_url":                doc.get("file"),
            "service_id":              resolve_id(doc.get("service")),
            "user_upload_id":          resolve_id(doc.get("user_upload")),
            "current_stage_id":        resolve_id(doc.get("current_stage")),
            "service_default_task_id": resolve_id(doc.get("service_default_task")),
            "attachment_type":         doc.get("attachment_type"),
            "is_active":               bool(doc.get("is_active", True)),
            "created_at":              dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":              dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "service_attachments", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} service_attachments")

def migrate_service_task_comments(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating service_task_comment → service_task_comments")
    docs = list(mongo_db["service_task_comment"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                      to_uuid(doc["_id"]),
            "comment":                 doc.get("comment", ""),
            "user_reporter_id":        resolve_id(doc.get("user_reporter")),
            "service_id":              resolve_id(doc.get("service")),
            "service_default_task_id": resolve_id(doc.get("service_default_task")),
            "comment_attachments":     clean_jsonb(doc.get("service_default_task_comment_attachments", [])),
            "is_active":               bool(doc.get("is_active", True)),
            "created_at":              dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":              dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "service_task_comments", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} service_task_comments")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 10 — Measurements
# ─────────────────────────────────────────────────────────────────────────────
def migrate_measurements(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating measurement → measurements")
    docs = list(mongo_db["measurement"].find())
    rows = []
    for doc in tqdm(docs, desc="measurements"):
        rows.append({
            "id":                to_uuid(doc["_id"]),
            "number":            doc.get("number", ""),
            "sales_order_id":    resolve_id(doc.get("sales_order")),
            "customer":          clean_jsonb(doc.get("customer")),
            "service":           clean_jsonb(doc.get("service")),
            "project":           clean_jsonb(doc.get("project")),
            "user_reporter_id":  resolve_id(doc.get("user_reporter")),
            "user_manager_id":   resolve_id(doc.get("user_manager")),
            "phone":             doc.get("phone"),
            "address":           doc.get("address"),
            "color":             clean_jsonb(doc.get("color")),
            "marks":             clean_jsonb(doc.get("marks", [])),
            "is_active":         bool(doc.get("is_active", True)),
            "first_date":        dt(doc.get("first_date")),
            "check_date":        dt(doc.get("check_date")),
            "first_assignee_id": resolve_id(doc.get("first_assignee")),
            "check_assignee_id": resolve_id(doc.get("check_assignee")),
            "general_notes":     doc.get("general_notes"),
            "created_at":        dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":        dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "measurements", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} measurements")

def migrate_measurement_attachments(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating measurement_attachment → measurement_attachments")
    docs = list(mongo_db["measurement_attachment"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":               to_uuid(doc["_id"]),
            "name":             doc.get("name", ""),
            "description":      doc.get("description"),
            "file_url":         doc.get("file"),
            "measurement_id":   resolve_id(doc.get("measurement")),
            "user_upload_id":   resolve_id(doc.get("user_upload")),
            "is_active":        bool(doc.get("is_active", True)),
            "created_at":       dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":       dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "measurement_attachments", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} measurement_attachments")

def migrate_measurement_comments(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating measurement_comment → measurement_comments")
    docs = list(mongo_db["measurement_comment"].find())
    rows = []
    for doc in docs:
        rows.append({
            "id":                  to_uuid(doc["_id"]),
            "comment":             doc.get("comment", ""),
            "user_reporter_id":    resolve_id(doc.get("user_reporter")),
            "measurement_id":      resolve_id(doc.get("measurement")),
            "comment_attachments": clean_jsonb(doc.get("measurement_default_task_comment_attachments", [])),
            "is_active":           bool(doc.get("is_active", True)),
            "created_at":          dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":          dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "measurement_comments", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} measurement_comments")

# ─────────────────────────────────────────────────────────────────────────────
# MODULE 11 — Task Timers
# ─────────────────────────────────────────────────────────────────────────────
def migrate_task_timers(mongo_db, supabase, dry_run, batch_size):
    log.info("── Migrating task_timers")
    docs = list(mongo_db["task_timers"].find())
    rows = []
    for doc in docs:
        # original used username string; resolve to user UUID via ID_MAP or username lookup
        username = doc.get("username", "")
        user_uuid = None
        # Try to find the user by username in already-mapped IDs
        for mongo_doc in mongo_db["login_users"].find({"username": username}, {"_id": 1}):
            user_uuid = to_uuid(mongo_doc["_id"])
            break

        if not user_uuid:
            log.warning(f"   Cannot resolve username '{username}' for timer {doc['_id']}, skipping")
            continue

        rows.append({
            "id":          to_uuid(doc["_id"]),
            "user_id":     user_uuid,
            "entity_type": doc.get("entity_type"),
            "entity_id":   resolve_id(doc.get("entity_id")) or str(uuid.uuid4()),
            "entity_info": clean_jsonb(doc.get("entity_info")),
            "elapsed_ms":  doc.get("elapsed_ms", 0),
            "start_time":  dt(doc.get("start_time")),
            "is_running":  bool(doc.get("is_running", False)),
            "created_at":  dt(doc.get("created_time")) or datetime.utcnow().isoformat(),
            "updated_at":  dt(doc.get("last_modified_time")) or datetime.utcnow().isoformat(),
        })
    n = batch_insert(supabase, "task_timers", rows, dry_run, batch_size)
    log.info(f"   ✓ {n} task_timers")

# ─────────────────────────────────────────────────────────────────────────────
# ORCHESTRATION
# ─────────────────────────────────────────────────────────────────────────────
ALL_MODULES = {
    # order matters — dependencies first
    "user_roles":                   lambda mg, sb, dr, bs: migrate_user_roles(mg, sb, dr, bs),
    "users":                        None,   # handled separately (needs skip_auth)
    "project_stages":               lambda mg, sb, dr, bs: migrate_project_stages(mg, sb, dr, bs),
    "project_task_stages":          lambda mg, sb, dr, bs: migrate_project_task_stages(mg, sb, dr, bs),
    "project_roles":                lambda mg, sb, dr, bs: migrate_project_roles(mg, sb, dr, bs),
    "project_permissions":          lambda mg, sb, dr, bs: migrate_project_permissions(mg, sb, dr, bs),
    "service_stages":               lambda mg, sb, dr, bs: migrate_service_stages(mg, sb, dr, bs),
    "service_issues":               lambda mg, sb, dr, bs: migrate_service_issues(mg, sb, dr, bs),
    "project_default_guide_products": lambda mg, sb, dr, bs: migrate_project_default_guide_products(mg, sb, dr, bs),
    "project_default_materials":    lambda mg, sb, dr, bs: migrate_project_default_materials(mg, sb, dr, bs),
    "project_default_tasks":        lambda mg, sb, dr, bs: migrate_project_default_tasks(mg, sb, dr, bs),
    "service_default_tasks":        lambda mg, sb, dr, bs: migrate_service_default_tasks(mg, sb, dr, bs),
    "zoho_customers":               lambda mg, sb, dr, bs: migrate_zoho_customers(mg, sb, dr, bs),
    "zoho_sales_orders":            lambda mg, sb, dr, bs: migrate_zoho_sales_orders(mg, sb, dr, bs),
    "projects":                     lambda mg, sb, dr, bs: migrate_projects(mg, sb, dr, bs),
    "project_users":                lambda mg, sb, dr, bs: migrate_project_users(mg, sb, dr, bs),
    "project_attachments":          lambda mg, sb, dr, bs: migrate_project_attachments(mg, sb, dr, bs),
    "project_materials":            lambda mg, sb, dr, bs: migrate_project_materials(mg, sb, dr, bs),
    "project_default_task_info":    lambda mg, sb, dr, bs: migrate_project_default_task_info(mg, sb, dr, bs),
    "work_orders":                  lambda mg, sb, dr, bs: migrate_work_orders(mg, sb, dr, bs),
    "project_tasks":                lambda mg, sb, dr, bs: migrate_project_tasks(mg, sb, dr, bs),
    "project_task_comments":        lambda mg, sb, dr, bs: migrate_project_task_comments(mg, sb, dr, bs),
    "project_task_attachments":     lambda mg, sb, dr, bs: migrate_project_task_attachments(mg, sb, dr, bs),
    "project_task_history":         lambda mg, sb, dr, bs: migrate_project_task_history(mg, sb, dr, bs),
    "project_notifications":        lambda mg, sb, dr, bs: migrate_project_notifications(mg, sb, dr, bs),
    "project_notification_users":   lambda mg, sb, dr, bs: migrate_project_notification_users(mg, sb, dr, bs),
    "project_calendar_notes":       lambda mg, sb, dr, bs: migrate_project_calendar_notes(mg, sb, dr, bs),
    "project_reminders":            lambda mg, sb, dr, bs: migrate_project_reminders(mg, sb, dr, bs),
    "project_profit_reports":       lambda mg, sb, dr, bs: migrate_project_profit_reports(mg, sb, dr, bs),
    "project_installation_crews":   lambda mg, sb, dr, bs: migrate_project_installation_crews(mg, sb, dr, bs),
    "project_tracking":             lambda mg, sb, dr, bs: migrate_project_tracking(mg, sb, dr, bs),
    "services":                     lambda mg, sb, dr, bs: migrate_services(mg, sb, dr, bs),
    "service_attachments":          lambda mg, sb, dr, bs: migrate_service_attachments(mg, sb, dr, bs),
    "service_task_comments":        lambda mg, sb, dr, bs: migrate_service_task_comments(mg, sb, dr, bs),
    "measurements":                 lambda mg, sb, dr, bs: migrate_measurements(mg, sb, dr, bs),
    "measurement_attachments":      lambda mg, sb, dr, bs: migrate_measurement_attachments(mg, sb, dr, bs),
    "measurement_comments":         lambda mg, sb, dr, bs: migrate_measurement_comments(mg, sb, dr, bs),
    "task_timers":                  lambda mg, sb, dr, bs: migrate_task_timers(mg, sb, dr, bs),
}

def main():
    parser = argparse.ArgumentParser(description="Migrate MongoDB → Supabase")
    parser.add_argument("--only",       type=str, help="Comma-separated modules to run")
    parser.add_argument("--dry-run",    action="store_true", help="Validate without inserting")
    parser.add_argument("--skip-auth",  action="store_true", help="Skip Supabase auth user creation")
    parser.add_argument("--batch-size", type=int, default=100, help="Insert batch size")
    args = parser.parse_args()

    dry_run    = args.dry_run
    skip_auth  = args.skip_auth
    batch_size = args.batch_size
    only       = set(args.only.split(",")) if args.only else None

    log.info("=" * 60)
    log.info("  MongoDB → Supabase Migration")
    log.info(f"  Dry run:    {dry_run}")
    log.info(f"  Skip auth:  {skip_auth}")
    log.info(f"  Batch size: {batch_size}")
    log.info(f"  Modules:    {only or 'ALL'}")
    log.info("=" * 60)

    # Connect MongoDB
    log.info(f"Connecting to MongoDB: {MONGO_URI[:30]}...")
    mongo_client = MongoClient(MONGO_URI)
    mongo_db     = mongo_client[MONGO_DB_NAME]
    log.info(f"  Collections: {sorted(mongo_db.list_collection_names())}")

    # Connect Supabase
    log.info(f"Connecting to Supabase: {SUPABASE_URL}")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Run modules
    for module_name, fn in ALL_MODULES.items():
        if only and module_name not in only:
            continue

        if module_name == "users":
            migrate_users(mongo_db, supabase, dry_run, skip_auth, batch_size)
            continue

        if fn is not None:
            try:
                fn(mongo_db, supabase, dry_run, batch_size)
            except Exception as e:
                log.error(f"  ✗ Module '{module_name}' failed: {e}", exc_info=True)

    log.info("=" * 60)
    log.info(f"  Migration complete. ID map size: {len(ID_MAP)} entries")
    log.info("=" * 60)

    # Save ID map for debugging / reuse
    if not dry_run:
        with open("id_map.json", "w") as f:
            json.dump(ID_MAP, f, indent=2)
        log.info("  Saved ID mapping → id_map.json")

if __name__ == "__main__":
    main()
