# PRD 07 — Scheduled Tasks

## Objective

Replace Celery beat + Celery worker (backed by Redis) with Supabase `pg_cron` (for simple DB-level tasks) and Supabase Edge Functions (for complex logic or tasks requiring external calls).

## Current Celery Tasks

### Daily Chain (runs at 8:00 AM ET, `api_projects_async_task_sequence`)

```python
task_sequence_daily():
  chain(
    task_delete_old_notifications,
    task_delete_old_trackings,
    task_generate_db_backup,
    task_delete_old_reminders,
  )
```

### 5-Minute Chain
```python
task_sequence_5min():
  chain(task_redefine_project_task_attachments)
```

### On-demand Tasks (triggered from API endpoints)
- `task_rebuild_project_scope` — called when a project is created (rebuilds materials/guide products)
- `task_rebuild_default_task_updates` — updates default task schedule info

### Task Descriptions

| Task | What it does |
|------|-------------|
| `task_delete_old_notifications` | Deletes `project_notifications` records older than N days |
| `task_delete_old_trackings` | Deletes `project_tracking` records older than N days |
| `task_generate_db_backup` | Creates MongoDB backup archive and stores in S3 |
| `task_delete_old_reminders` | Deletes expired `project_remainder` records |
| `task_redefine_project_task_attachments` | Updates task attachment metadata |
| `task_rebuild_project_scope` | Populates `project_default_task_info` on project creation |

## Target: Supabase pg_cron + Edge Functions

### 1. `task_delete_old_notifications` → pg_cron SQL function

```sql
-- supabase/migrations/015_pg_cron_jobs.sql

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Delete notifications older than 90 days (adjust as needed)
SELECT cron.schedule(
  'delete-old-notifications',
  '0 8 * * *',  -- 8:00 AM UTC daily
  $$
    DELETE FROM public.project_notifications
    WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);
```

### 2. `task_delete_old_trackings` → pg_cron SQL function

```sql
SELECT cron.schedule(
  'delete-old-trackings',
  '0 8 * * *',
  $$
    DELETE FROM public.project_tracking
    WHERE created_at < NOW() - INTERVAL '180 days';
  $$
);
```

### 3. `task_delete_old_reminders` → pg_cron SQL function

```sql
SELECT cron.schedule(
  'delete-old-reminders',
  '0 8 * * *',
  $$
    DELETE FROM public.project_reminders
    WHERE date < NOW() - INTERVAL '30 days'
    AND is_active = FALSE;
  $$
);
```

### 4. `task_generate_db_backup` → Supabase Edge Function

MongoDB backups are no longer needed (data is in Supabase PostgreSQL). Replace with a Supabase database backup strategy:
- Supabase Pro tier provides automatic daily backups
- For custom backup/export: create an Edge Function that calls Supabase Management API to trigger a backup or export to S3

```
supabase/functions/
  daily-backup/
    index.ts
```

```typescript
// supabase/functions/daily-backup/index.ts
import { serve } from "https://deno.land/std/http/server.ts"

serve(async () => {
  // Option A: rely on Supabase automatic backups (Pro tier)
  // Option B: pg_dump via Supabase Management API
  // Option C: export critical tables to S3 as JSON/CSV
  return new Response("Backup triggered", { status: 200 })
})
```

Schedule the Edge Function via Supabase cron:
```sql
SELECT cron.schedule(
  'daily-backup',
  '30 8 * * *',  -- 8:30 AM UTC
  $$
    SELECT net.http_post(
      url := 'https://foqyvkblfblyqbqcepnh.supabase.co/functions/v1/daily-backup',
      headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
    );
  $$
);
```

### 5. `task_rebuild_project_scope` → Database Trigger

Called on project creation. Move to a `AFTER INSERT` trigger on `projects`:

```sql
-- supabase/migrations/015_pg_cron_jobs.sql (continued)

CREATE OR REPLACE FUNCTION public.on_project_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy default tasks template into project_default_task_info
  INSERT INTO public.project_default_task_info (project_id, default_task_id, status, ...)
  SELECT NEW.id, id, 'pending', ...
  FROM public.project_default_tasks
  WHERE is_active = TRUE;

  -- Initialize profit report row
  INSERT INTO public.project_profit_reports (project_id, project_amount, ...)
  VALUES (NEW.id, 0, ...);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER project_created_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.on_project_created();
```

### 6. `task_redefine_project_task_attachments` → pg_cron + SQL

```sql
SELECT cron.schedule(
  'redefine-task-attachments',
  '*/5 * * * *',  -- every 5 minutes
  $$
    -- Update task attachment metadata based on current project state
    UPDATE public.project_task_attachments
    SET updated_at = NOW()
    WHERE ... -- add specific logic from the original task
  $$
);
```

Note: Review `task_redefine_project_task_attachments` source code for exact logic before implementing.

### Migration File

Create `supabase/migrations/015_pg_cron_jobs.sql`:
1. Enable `pg_cron` extension
2. Enable `pg_net` extension (for HTTP calls from SQL)
3. Register all cron jobs
4. Create `on_project_created` trigger

### Edge Functions Deployment

```bash
supabase functions deploy daily-backup
supabase functions deploy project-created-hook  # if trigger is too complex for SQL
```

### Env Variables for Edge Functions

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>
supabase secrets set AWS_S3_BUCKET=<bucket>  # if backup to S3
```

## What to Remove After Completion

- `backend_app/api_projects_async_task_sequence/` entire app
- `backend_app/api_projects/tasks.py`
- `backend_app/system_installation_project/celery.py`
- `celery.beat.PersistentScheduler` config in `settings.py`
- `celerybeat-schedule` file
- Redis container (shared with WebSockets — remove after PRD 06 done)
- `celery`, `kombu`, `billiard`, `redis`, `amqp` Python packages
