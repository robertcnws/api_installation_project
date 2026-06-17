"""Check which tables already exist in Supabase."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.migration")
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

TABLES = [
    "user_roles", "users", "project_stages", "project_task_stages",
    "project_roles", "project_permissions", "service_stages", "service_issues",
    "project_default_guide_products", "project_default_materials",
    "project_default_tasks", "service_default_tasks",
    "zoho_customers", "zoho_sales_orders",
    "projects", "project_users", "project_attachments", "project_materials",
    "project_default_task_info", "work_orders",
    "project_tasks", "project_task_comments", "project_task_attachments",
    "project_task_history", "project_notifications", "project_notification_users",
    "project_calendar_notes", "project_reminders", "project_profit_reports",
    "project_installation_crews", "project_tracking",
    "services", "service_attachments", "service_task_comments",
    "measurements", "measurement_attachments", "measurement_comments",
    "task_timers",
]

print("\nChecking Supabase tables...\n")
existing, missing = [], []
for t in TABLES:
    try:
        sb.table(t).select("id").limit(1).execute()
        existing.append(t)
        print(f"  ✓ {t}")
    except Exception as e:
        missing.append(t)
        print(f"  ✗ {t}  ← MISSING ({str(e)[:60]})")

print(f"\n{len(existing)} exist, {len(missing)} missing")
