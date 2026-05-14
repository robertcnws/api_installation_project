# PRD 04 — Measurements Module

## Objective

Migrate `api_measurements` Django app and `frontend_app/src/sections/measurement/` to Next.js + Supabase.

## Current Backend Endpoints (`/api/measurements/`)

### Measurement CRUD
- `create/measurement/`
- `update/measurement/<id>/check-mark/` — toggle a checklist mark
- `update/measurement/<id>/delete-mark/<mark_id>/`
- `update/measurement/<id>/save-general-notes/`
- `update/measurement/<id>/change-date/`
- `update/measurement/<id>/remove-date/`
- `update/measurement/<id>/change-assignee/`
- `update/measurement/<id>/change-address/`
- `update/measurement/<id>/change-color/`
- `update/measurement/<id>/change-phone-number/`
- `delete/measurement/<id>/`
- `delete/measurements/` (bulk)

### Comments
- `create/measurement/<id>/comment/`
- `edit/measurement/<measurementId>/comment/<id>/`
- `delete/measurement/<measurementId>/comment/<id>/`

### GraphQL endpoint: `POST /api/measurements/graphql/`
Used for measurement list with filters, detail views.

## Current Frontend Sections

`frontend_app/src/sections/measurement/`:
- Measurement list (table + calendar toggle)
- Measurement detail: marks/checklist, notes, comments with file attachments
- Color-coded cards (measurements have a `color` field for visual differentiation)
- Filter by assignee, date range, status

## Target: Next.js Pages & Server Actions

### Pages

```
app/(dashboard)/measurements/
  page.tsx           ← measurement list ✅ scaffold exists
  new/page.tsx       ← create form
  [id]/page.tsx      ← detail ✅ scaffold exists
  [id]/edit/page.tsx ← edit form
```

### Supabase Tables Used

| Table | Purpose |
|-------|---------|
| `measurements` | Core measurement record |
| `measurement_attachments` | File attachments (currently empty — 0 migrated) |
| `measurement_comments` | Comments with optional file attachments |

### Key Fields on `measurements`

From the Supabase schema (`supabase/migrations/010_measurements.sql`):
- `number` TEXT (e.g., "MR-C0476")
- `name` TEXT
- `address`, `phone` TEXT
- `color` TEXT — visual label color
- `marks` JSONB — checklist items array `[{id, label, checked, checked_by, checked_at}]`
- `general_notes` TEXT
- `scheduled_date`, `inspection_date` TIMESTAMPTZ
- `current_stage_id` UUID → `service_stages` (measurements share stages with services)
- `user_assignee_id` UUID → `users`
- `user_reporter_id` UUID → `users`
- `is_active` BOOLEAN
- `zoho_sales_order_id` UUID → `zoho_sales_orders`

### Server Actions (`actions/measurements.ts`)

```typescript
createMeasurement(data)
deleteMeasurement(id)
deleteMeasurements(ids)

// Field updates:
checkMark(id, markId, checked)          // toggles marks JSONB item
deleteMark(id, markId)
saveGeneralNotes(id, notes)
changeMeasurementDate(id, date)
removeMeasurementDate(id)
changeMeasurementAssignee(id, userId)
changeMeasurementAddress(id, address)
changeMeasurementColor(id, color)
changeMeasurementPhoneNumber(id, phone)

// Comments:
createMeasurementComment(id, comment, attachments?)
editMeasurementComment(measurementId, commentId, comment)
deleteMeasurementComment(measurementId, commentId)
```

### Marks / Checklist Implementation

The `marks` column is a JSONB array. Updates use a Supabase `rpc` call or a Server Action that reads the current array, modifies it, and writes it back:

```typescript
// Pseudo-code for checkMark Server Action:
const { data: m } = await supabase.from("measurements").select("marks").eq("id", id).single()
const updated = m.marks.map(mark =>
  mark.id === markId
    ? { ...mark, checked: true, checked_by: user.id, checked_at: new Date().toISOString() }
    : mark
)
await supabase.from("measurements").update({ marks: updated }).eq("id", id)
```

Alternatively, create a Supabase function `toggle_measurement_mark(measurement_id, mark_id, checked)` for atomic update.

### Comments with Attachments

`measurement_comments.comment_attachments` is a JSONB column `[{name, file_url}]`.
- Files upload to Supabase Storage bucket `measurement-attachments`
- After upload, append `{name, file_url}` to the comment's `comment_attachments` array

### Measurement List — Color Display

Measurements have a `color` field used for visual cards. The UI shows color-coded badges/tags. Implement a `ColorBadge` component using Tailwind utility classes mapped from the color string.

### Calendar Integration

Measurements with `scheduled_date` or `inspection_date` appear in the Calendar module. See PRD 05.

## What to Remove After Completion

- `backend_app/api_measurements/` entire app
- `frontend_app/src/sections/measurement/`
