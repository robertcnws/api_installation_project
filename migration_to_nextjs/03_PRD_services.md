# PRD 03 — Services Module

## Objective

Migrate `api_services` Django app and `frontend_app/src/sections/service/` to Next.js + Supabase.

## Current Backend Endpoints (`/api/services/`)

### Service Issues (lookup data)
- `create/service-issue/`, `edit/service-issue/<id>/`, `delete/service-issue/<id>/`, `delete/service-issues/`

### Services CRUD
- `create/service/`
- `update/service/<id>/` — full update
- `update/service/<id>/close-service/`
- `update/service/<id>/remove-date/`
- `update/service/<id>/change-address/`
- `update/service/<id>/change-phone-number/`
- `update/service/<id>/change-reference-number/`
- `update/service/<id>/change-user-manager/`
- `update/service/<id>/change-users-team/`
- `update/service/<id>/change-dates/`
- `update/service/<id>/change-type/`
- `update/service/<id>/change-notes/`
- `update/service/<id>/change-properties/`
- `update/service/<id>/set-place/`
- `update/service/<id>/add-issued-products/`
- `update/service/<id>/add-new-issue/<issued_product_id>/`
- `update/service/<id>/edit-issue/<issued_product_id>/<issue_id>/`
- `update/service/<id>/delete-issue/<issued_product_id>/<issue_id>/`
- `delete/service/<id>/`, `delete/services/`

### Service Default Tasks
- Full CRUD: `create/default-task/`, `edit/default-task/<id>/`, `delete/default-task/<id>/`, `delete/default-tasks/`
- `update/service/<serviceId>/task/<id>/change-status/`

### Service Stages
- Full CRUD: `create/stage/`, `edit/stage/<id>/`, `delete/stage/`, `delete/stages/`

### Comments
- `create/service/<id>/comment/`
- `edit/service/<serviceId>/comment/<id>/`
- `delete/service/<serviceId>/comment/<id>/`

### File Attachments
- `upload/service/<id>/file/`
- `delete/file/<id>/service/<folder>/<file>/`
- `download/files/`
- `get-file-url/`

### GraphQL endpoint: `POST /api/services/graphql/`
Used for service list with filters, service detail with related records, task info.

## Current Frontend Sections

`frontend_app/src/sections/service/`:
- Service list table with filters (stage, type, date, assignee)
- Service detail: stage stepper, overview tab, tasks tab, comments, attachments
- Kanban view for services by stage
- Add/edit modals: address, attachments, issues table (mobile + desktop variants)
- Charts: semicircle gauge + task completion pie

`frontend_app/src/sections/maintenance/`:
- Service issue list and CRUD management UI

## Target: Next.js Pages & Server Actions

### Pages

```
app/(dashboard)/services/
  page.tsx                 ← service list (table + kanban toggle)
  new/page.tsx             ← create service form
  [id]/page.tsx            ← service detail (tabs: overview, tasks, comments, attachments)
  [id]/edit/page.tsx       ← edit form

app/(dashboard)/stages/   ← already exists (stub)
  page.tsx                 ← stages + task-stages management (shared with services)
```

### Supabase Tables Used

| Table | Purpose |
|-------|---------|
| `services` | Core service record |
| `service_stages` | Stage lookup |
| `service_stage_history` | Stage change log |
| `service_issues` | Issue type lookup |
| `service_default_tasks` | Task templates |
| `service_attachments` | File attachments |
| `service_task_comments` | Comments on service tasks |

### Server Actions (`actions/services.ts`)

```typescript
createService(data)
updateService(id, data)
deleteService(id)
deleteServices(ids)
closeService(id)
removeServiceDate(id)
changeServiceAddress(id, address)
changeServicePhoneNumber(id, phone)
changeServiceReferenceNumber(id, ref)
changeServiceManager(id, managerId)
changeServiceTeam(id, userIds)
changeServiceDates(id, startDate, endDate)
changeServiceType(id, type)
changeServiceNotes(id, notes)
changeServiceProperties(id, properties)
setServicePlace(id, place)

// Issued products & issues:
addIssuedProducts(serviceId, products)
addNewIssue(serviceId, issuedProductId, issue)
editIssue(serviceId, issuedProductId, issueId, data)
deleteIssue(serviceId, issuedProductId, issueId)

// Default tasks:
createServiceDefaultTask(data)
editServiceDefaultTask(id, data)
deleteServiceDefaultTask(id)
changeServiceDefaultTaskStatus(serviceId, taskId, stageId)

// Stages:
createServiceStage(data)
editServiceStage(id, data)
deleteServiceStage(id)
deleteServiceStages(ids)

// Comments:
createServiceComment(serviceId, comment)
editServiceComment(serviceId, commentId, comment)
deleteServiceComment(serviceId, commentId)

// Service issues (lookup):
createServiceIssue(data)
editServiceIssue(id, data)
deleteServiceIssue(id)
```

### Service Stage Stepper Component

The current React app has a visual stage stepper (`service-details-stage-stepper.jsx`). Rebuild using shadcn/ui components:
- Display current stage with completed/active/pending states
- Clicking a stage calls `changeServiceStage(id, stageId)` Server Action
- Supabase Realtime subscription updates stage in real-time (see PRD 06)

### Comments System

Comments use a JSON display format (`service-details-comment-list-json-display.jsx`) for structured tracking entries. This means `comment` field can contain nested JSON describing changes (e.g., stage transitions, field edits).

Implement with:
1. A `CommentInput` component that supports both plain text and structured JSON entries
2. Server Action inserts row into `service_task_comments`
3. List renders plain text or a pretty-printed diff display

### File Attachments

Replace S3 with Supabase Storage bucket `service-attachments`. See PRD 08.

### Real-time

Subscribe to `services` table changes for live stage/status updates. See PRD 06.

## What to Remove After Completion

- `backend_app/api_services/` entire app
- `frontend_app/src/sections/service/`
- `frontend_app/src/sections/service-issue/`
- `frontend_app/src/sections/service-stages/`
- `frontend_app/src/sections/service-task-default/`
- `frontend_app/src/sections/maintenance/`
