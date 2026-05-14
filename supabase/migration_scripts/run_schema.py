"""
Run the SQL schema migrations via Supabase Management API.
Requires SUPABASE_ACCESS_TOKEN in .env.migration
(Get it from: https://supabase.com/dashboard/account/tokens)
"""
import os, sys, httpx
from dotenv import load_dotenv

load_dotenv(".env.migration")

PROJECT_REF  = "foqyvkblfblyqbqcepnh"
ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")

if not ACCESS_TOKEN:
    print("❌  SUPABASE_ACCESS_TOKEN not set in .env.migration")
    print("   Get one from: https://supabase.com/dashboard/account/tokens")
    sys.exit(1)

SQL_FILES = [
    "../migrations/001_extensions_users_roles.sql",
    "../migrations/002_stages_and_roles.sql",
    "../migrations/003_zoho_integration.sql",
    "../migrations/004_projects.sql",
    "../migrations/005_project_tasks.sql",
    "../migrations/006_project_attachments.sql",
    "../migrations/007_project_notifications_calendar.sql",
    "../migrations/008_project_extras.sql",
    "../migrations/009_services.sql",
    "../migrations/010_measurements.sql",
    "../migrations/011_timers_tracking.sql",
    "../migrations/012_rls_policies.sql",
    "../migrations/013_functions_triggers.sql",
]

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json",
}

for sql_file in SQL_FILES:
    with open(sql_file) as f:
        sql = f.read()

    print(f"Running {sql_file}...", end=" ", flush=True)
    resp = httpx.post(url, headers=headers, json={"query": sql}, timeout=60)

    if resp.status_code in (200, 201):
        print("✓")
    else:
        print(f"✗  {resp.status_code}: {resp.text[:200]}")
        sys.exit(1)

print("\n✅  All schema migrations complete!")
