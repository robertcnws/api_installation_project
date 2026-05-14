# PRD 11 — Reporting & Analytics

## Objective

Migrate the reporting, analytics, and tracking views from the React frontend to Next.js + Supabase. These pages rely heavily on aggregated queries — move computation to SQL/Supabase RPC functions where possible.

## Current System

### Frontend Sections

| Section | Path | Purpose |
|---------|------|---------|
| Overview Dashboard | `src/sections/overview/` | KPI summary widgets |
| Track | `src/sections/track/` | Project activity/tracking history table |
| Kanban | `src/sections/kanban/` | Generic Kanban board |
| Kanban (project) | `src/sections/kanban-project/` | Project-specific kanban |

### Reports Page (`frontend_app/src/sections/order/`, `src/pages/overview/`)

The dashboard shows:
- Total projects (active / by stage)
- Total services (by status)
- Total measurements
- Revenue/profit summary from `project_profit_reports`
- Recent activity from `project_tracking`
- Installation crew utilization

### Tracking (`project_tracking` table)

Each action on a project/service creates a `project_tracking` record:
- `{project_id, user_id, action, managed_data: JSONB, created_at}`
- `managed_data` contains a snapshot or diff of the changed fields
- The tracking view renders a timeline/activity feed per project or globally

### Profit Reports (`project_profit_reports` table)

Per-project financial snapshot:
- `project_amount` — total project value
- `installation_amount` — installation cost
- `installation_cost_subcontractor` / `_onhouse`
- `installation_profit_subcontractor` / `_onhouse`
- `project_info: JSONB` — detailed breakdown including materials, labor, guide products

## Target: Next.js Reporting Pages

### Pages

```
app/(dashboard)/
  page.tsx               ← main dashboard / overview (currently exists as stub)
  reports/
    page.tsx             ← already exists as stub — reports summary
  track/
    page.tsx             ← already under dashboard (verify path)
```

### Dashboard Overview Page (`app/(dashboard)/page.tsx`)

Server Component — fetch all KPIs in parallel:

```typescript
const [projectStats, serviceStats, measurementStats, profitSummary, recentActivity] =
  await Promise.all([
    // Projects by stage
    supabase.from("projects")
      .select("current_stage_id, project_stages(name)", { count: "exact" })
      .eq("is_active", true),

    // Services by stage
    supabase.from("services")
      .select("current_stage_id", { count: "exact" })
      .eq("is_active", true),

    // Measurements count
    supabase.from("measurements")
      .select("id", { count: "exact" })
      .eq("is_active", true),

    // Profit totals
    supabase.from("project_profit_reports")
      .select("project_amount, installation_profit_subcontractor, installation_profit_onhouse"),

    // Recent tracking
    supabase.from("project_tracking")
      .select("*, user:users(first_name, last_name, avatar_url), project:projects(name, number)")
      .order("created_at", { ascending: false })
      .limit(10),
  ])
```

**Supabase RPC for aggregated stats:**

```sql
-- supabase/migrations/015_pg_cron_jobs.sql or new migration
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_projects',     (SELECT COUNT(*) FROM projects WHERE is_active = TRUE),
    'total_services',     (SELECT COUNT(*) FROM services WHERE is_active = TRUE),
    'total_measurements', (SELECT COUNT(*) FROM measurements WHERE is_active = TRUE),
    'total_revenue',      (SELECT COALESCE(SUM(project_amount), 0) FROM project_profit_reports),
    'total_profit',       (SELECT COALESCE(SUM(installation_profit_onhouse), 0) FROM project_profit_reports),
    'projects_by_stage',  (
      SELECT json_agg(json_build_object('stage', ps.name, 'count', cnt))
      FROM (
        SELECT current_stage_id, COUNT(*) as cnt FROM projects
        WHERE is_active = TRUE GROUP BY current_stage_id
      ) g JOIN project_stages ps ON ps.id = g.current_stage_id
    )
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

Call via: `supabase.rpc("get_dashboard_stats")`

### Reports Page (`app/(dashboard)/reports/page.tsx`)

Full profit report table with filters:
- Filter by date range, stage, user manager
- Per-row drill-down into `project_info` JSONB breakdown
- Export to CSV/XLSX using `xlsx` package (already in `package.json`)
- Export to PDF using `jspdf` + `jspdf-autotable` (already in `package.json`)

```typescript
// components/reports/ExportButtons.tsx (client component)
import { utils, writeFile } from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function ExportToExcel({ data }: { data: ProfitReport[] }) { ... }
export function ExportToPDF({ data }: { data: ProfitReport[] }) { ... }
```

### Tracking / Activity Feed (`app/(dashboard)/track/` or per-entity)

Two views:
1. **Global feed** — all recent activity across projects/services
2. **Per-entity feed** — activity for a specific project in the detail tabs

```typescript
// Server Component for global tracking
const { data: tracking } = await supabase
  .from("project_tracking")
  .select(`
    *,
    user:users(first_name, last_name, avatar_url),
    project:projects(name, number)
  `)
  .order("created_at", { ascending: false })
  .limit(50)
```

Render as a timeline with `managed_data` displayed as structured diffs.

### Profit Report Rebuild

The current system has `trigger_profit_rebuild` endpoint which triggers a Celery task to recalculate all profit reports. Replace with a Supabase RPC:

```sql
CREATE OR REPLACE FUNCTION public.rebuild_profit_report(p_project_id UUID)
RETURNS VOID AS $$
  -- Recalculate from project's task info, materials, guide products
  UPDATE project_profit_reports
  SET
    project_amount = (...),
    installation_amount = (...),
    updated_at = NOW()
  WHERE project_id = p_project_id;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Call via Server Action:
```typescript
await supabase.rpc("rebuild_profit_report", { p_project_id: projectId })
```

### KPI Widgets

Build reusable `components/reports/KPICard.tsx`:
```typescript
interface KPICardProps {
  title: string
  value: string | number
  trend?: number  // percentage change
  icon?: React.ReactNode
  color?: "blue" | "green" | "orange" | "red"
}
```

### Tracking Record Creation Utility

When any Server Action modifies a project/service/measurement, record the change:

```typescript
// lib/tracking.ts
export async function recordActivity(supabase, {
  projectId,
  userId,
  action,        // "stage_changed" | "field_updated" | "comment_added" | ...
  managedData,   // { before, after } or snapshot
}) {
  await supabase.from("project_tracking").insert({
    project_id: projectId,
    user_id: userId,
    action,
    managed_data: managedData,
  })
}
```

## What to Remove After Completion

- `frontend_app/src/sections/overview/`
- `frontend_app/src/sections/track/`
- `frontend_app/src/sections/kanban/`
- `frontend_app/src/sections/kanban-project/`
- `frontend_app/src/pages/dashboard/`
- `frontend_app/src/pages/home.jsx`
