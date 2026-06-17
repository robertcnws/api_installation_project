# PRD 02 — Projects Module

## Objective

Migrate the full `api_projects` Django app and `frontend_app/src/sections/project/` UI to Next.js + Supabase. This is the core module of the system.

## Current Backend Endpoints

All under `POST/PUT/DELETE /api/projects/`:

### Projects CRUD
- `create/project/` — creates project + triggers async task to rebuild scope/materials
- `update/project/<id>/` — full project update
- `update/project/<id>/manage-profit-report/`
- `update/project/<id>/change-permission/`
- `update/project/<id>/change-address/`
- `update/project/<id>/change-phone-number/`
- `update/project/<id>/change-reference-number/`
- `update/project/<id>/change-release-form/`
- `update/project/<id>/change-installation-guide-form/`
- `update/project/<id>/check-item-installation-guide/`
- `update/project/<id>/remove-date/`
- `update/project/<id>/change-installer/`
- `update/project/<id>/change-description/`
- `delete/project/<id>/`
- `delete/projects/` (bulk)

### Work Orders
- `update/project/<id>/manage-work-order/` — create/edit work order inside a project
- `delete/project/<projectId>/work-order/<id>/`
- `finish/project/<projectId>/work-order/<id>/`

### Users & Teams
- `add/project/<id>/users/` — assign users to project
- `delete/project/<id>/user/<userId>/`

### Comments
- `create/project/<id>/comment/`
- `edit/project/<projectId>/comment/<id>/`
- `delete/project/<projectId>/comment/<id>/`

### Attachments
- `upload/project/<id>/file/`
- `upload/project/<projectId>/task/<id>/file/`
- `delete/file/<id>/project/<folder>/<file>/`
- `delete/file/<projectId>/project/<id>/task/<folder>/<file>/`
- `download/files/` — ZIP download from S3

### Default Tasks
- Full CRUD for `project_default_tasks` and `project_task_stages`

### Stages
- Full CRUD for `project_stages`

### Notifications
- `delete/old-notifications/`
- `mark-read/notifications/`
- `delete/notifications/`

### Timer
- `GET timers/<entity_type>/<entity_id>/`
- `POST timers/start/`, `timers/pause/`, `timers/reset/`

### GraphQL endpoint: `POST /api/projects/graphql/`
Used for complex queries: project list with filters, kanban data, task details, tracking history.

## Current Frontend Sections

`frontend_app/src/sections/project/`:
- **Table view** (`project-table.jsx`) — paginated project list with filters
- **Grid/Kanban view** (`project-grid-view.jsx`, `kanban/`, `kanban-project/`)
- **Project details** (`project-details-content.jsx`) — tabs: overview, tasks, attachments, work orders
- **Task details** (`project-task-details.jsx`) — priority, stage, assignees, comments, attachments
- **Calendar** (`calendar/`) — FullCalendar view of project events
- **Tracking** — activity/history table

## Target: Next.js Pages & Server Actions

### Pages

```
app/(dashboard)/projects/
  page.tsx                        ← list (table + kanban toggle) ✅ scaffold
  new/page.tsx                    ← create form
  [id]/page.tsx                   ← detail tabs ✅ scaffold
  [id]/edit/page.tsx              ← edit form
```

### Supabase Tables Used

| Table | Purpose |
|-------|---------|
| `projects` | Core project record |
| `project_stages` | Stage lookup |
| `project_stage_history` | Stage change history |
| `project_users` | Team assignees |
| `project_roles` | Roles within a project |
| `project_permissions` | Permission templates |
| `project_user_permissions` | Per-user permission overrides |
| `project_default_tasks` | Task templates |
| `project_default_task_info` | Task detail snapshot per project |
| `project_default_task_assignees` | Task→user assignments |
| `project_task_stages` | Task stage lookup |
| `project_tasks` | Individual task records |
| `project_task_comments` | Task-level comments |
| `project_task_comment_attachments` | Files attached to comments |
| `project_task_attachments` | Files attached to tasks |
| `project_task_history` | Task state history |
| `project_attachments` | Project-level file attachments |
| `work_orders` | Work orders embedded in projects |
| `project_notifications` | System notifications |
| `project_notification_users` | Notification read receipts |
| `project_profit_reports` | Financial summary per project |
| `project_tracking` | Activity log |
| `project_reminders` | Reminder records |
| `project_calendar_notes` | Calendar-linked notes |
| `project_calendar_note_assignees` | Assignees for calendar notes |
| `project_calendar_note_events` | Events linked to calendar notes |
| `project_guide_products` | Guide products for a project |
| `project_default_guide_products` | Guide product templates |
| `project_materials` | Materials list for a project |
| `project_default_materials` | Material templates |
| `project_installation_crews` | Crew assignments |

### Server Actions (`actions/projects.ts`) — extend existing

```typescript
// Already scaffolded:
createProject(formData)
updateProject(id, formData)
deleteProject(id)

// To add:
changeProjectStage(id, stageId)
changeProjectInstaller(id, installerId)
changeProjectAddress(id, address)
changeProjectDescription(id, description)
changeProjectDates(id, startDate, endDate)
changeProjectReleaseForm(id, data)
changeProjectInstallationGuide(id, data)
checkInstallationGuideItem(id, itemId, checked)
changeProjectPermission(id, permissionId)
manageProjectProfitReport(id, data)

// Work orders:
createWorkOrder(projectId, data)
updateWorkOrder(projectId, workOrderId, data)
finishWorkOrder(projectId, workOrderId)
deleteWorkOrder(projectId, workOrderId)

// Team:
addProjectUsers(projectId, userIds)
removeProjectUser(projectId, userId)

// Comments:
createProjectComment(projectId, comment, defaultTaskId?)
editProjectComment(projectId, commentId, comment)
deleteProjectComment(projectId, commentId)

// Default tasks:
createDefaultTask(data)
editDefaultTask(id, data)
deleteDefaultTask(id)

// Default stages:
createStage(data)
editStage(id, data)
deleteStage(id)

// Task stage changes:
changeProjectDefaultTaskStatus(projectId, taskId, stageId)
changeProjectDefaultTaskPriority(projectId, taskId, priority)
addProjectTaskUsers(projectId, taskId, userIds)
removeProjectTaskUser(projectId, taskId, userId)

// Reminders:
manageProjectReminder(projectId, taskId, data)
quitProjectReminder(reminderId)

// Notifications:
markNotificationsRead()
deleteNotifications()

// Default guide products & materials:
createDefaultGuideProduct(data)
editDefaultGuideProduct(id, data)
deleteDefaultGuideProduct(id)
createDefaultMaterial(data)
editDefaultMaterial(id, data)
deleteDefaultMaterial(id)

// Installation crews:
createInstallationCrew(data)
editInstallationCrew(id, data)
deleteInstallationCrew(id)
```

### Server Actions (`actions/timers.ts`)

```typescript
getTimer(entityType: "project" | "task", entityId: string)
startTimer(entityType, entityId, userId)
pauseTimer(entityType, entityId, userId)
resetTimer(entityType, entityId, userId)
```

### Kanban View

Replace GraphQL-driven kanban with Supabase query:
- Fetch all projects grouped by `current_stage_id`
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (already in `nextjs_app/package.json`)
- Stage change calls `changeProjectStage()` Server Action

### Project List / Table

Replace GraphQL paginated query with:
```typescript
supabase
  .from("projects")
  .select(`*, current_stage:project_stages(id, name), user_manager:users!...`)
  .eq("is_active", true)
  .order("created_at", { ascending: false })
  .range(from, to)
```

### Real-time Updates

Use Supabase Realtime channel on `projects` table. See PRD 06.

### Async Tasks on Project Create

The current Django system runs a Celery chain on project creation:
- Rebuild project scope
- Rebuild materials
- Generate initial profit report

Replace with **Supabase Database Trigger + Edge Function** (see PRD 07).

### File Attachments

Replace AWS S3 with Supabase Storage bucket `project-attachments`. See PRD 08.

## What to Remove After Completion

- `backend_app/api_projects/` entire app
- `backend_app/api_projects_async_task_sequence/` app
- `frontend_app/src/sections/project/`
- `frontend_app/src/pages/project/`
- GraphQL schema files (`schema.py`, `schema_ini.py`, `schema_models/`)
