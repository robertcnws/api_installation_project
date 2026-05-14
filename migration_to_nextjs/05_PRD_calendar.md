# PRD 05 — Calendar Module

## Objective

Migrate the FullCalendar-based calendar (`frontend_app/src/sections/calendar/`) to Next.js + Supabase. The calendar aggregates events from projects, services, measurements, and calendar notes.

## Current System

### Frontend (`frontend_app/src/sections/calendar/`)

- `view/` — calendar view components (month, week, day, list)
- `calendar-form.jsx` — event create/edit form (for project events)
- `calendar-note-form.jsx` — create/edit calendar notes
- `calendar-filters.jsx` — filter by entity type, user, date range
- `calendar-toolbar.jsx` — navigation + view switcher

Uses `@fullcalendar/react` with plugins: `daygrid`, `timegrid`, `interaction`, `list`, `timeline`.

### Data Sources (aggregated in the frontend via GraphQL)

| Source | Event Type | Date Fields |
|--------|-----------|-------------|
| `project` | Installation event | `start_date`, `end_date`, `inspection_date`, `finish_permission_date` |
| `service` | Service event | `scheduled_date`, `close_date` |
| `measurement` | Measurement event | `scheduled_date`, `inspection_date` |
| `project_calendar_notes` | Calendar note | `start_date`, `end_date` |

### Current Django Side

No dedicated calendar API — the frontend queries each module's GraphQL endpoint and merges the results client-side.

## Target: Next.js Calendar Page

### Page

```
app/(dashboard)/calendar/
  page.tsx        ← server component — fetches initial data
  components/     ← client components (FullCalendar must be client-side)
    CalendarView.tsx
    CalendarEventForm.tsx
    CalendarNoteForm.tsx
    CalendarFilters.tsx
```

### Supabase Tables Used

| Table | Usage |
|-------|-------|
| `projects` | Events from `start_date`, `end_date`, `inspection_date`, `finish_permission_date` |
| `services` | Events from `scheduled_date` |
| `measurements` | Events from `scheduled_date`, `inspection_date` |
| `project_calendar_notes` | Direct calendar events with `start_date`, `end_date`, `duration` |
| `project_calendar_note_assignees` | Assignees for calendar notes |
| `project_calendar_note_events` | Project links for calendar notes |

### Data Fetching Strategy

**Server Component** fetches all event sources in parallel:

```typescript
const [projects, services, measurements, calNotes] = await Promise.all([
  supabase.from("projects")
    .select("id, name, number, start_date, end_date, inspection_date, finish_permission_date, current_stage:project_stages(name)")
    .eq("is_active", true),
  supabase.from("services")
    .select("id, name, number, scheduled_date")
    .eq("is_active", true),
  supabase.from("measurements")
    .select("id, name, number, scheduled_date, inspection_date, color")
    .eq("is_active", true),
  supabase.from("project_calendar_notes")
    .select("*, assignees:project_calendar_note_assignees(user:users(id, first_name, last_name))")
    .eq("is_active", true),
])
```

**Transform to FullCalendar event format:**

```typescript
function transformToCalendarEvents(projects, services, measurements, calNotes): EventInput[] {
  const events: EventInput[] = []

  projects.forEach(p => {
    if (p.start_date) events.push({
      id: `project-start-${p.id}`, title: p.name, start: p.start_date,
      end: p.end_date, extendedProps: { type: "project", entity: p }
    })
    if (p.inspection_date) events.push({
      id: `project-inspection-${p.id}`, title: `[Inspection] ${p.name}`,
      start: p.inspection_date, extendedProps: { type: "inspection", entity: p }
    })
  })

  measurements.forEach(m => {
    if (m.scheduled_date) events.push({
      id: `meas-${m.id}`, title: m.name, start: m.scheduled_date,
      backgroundColor: m.color || "#666",
      extendedProps: { type: "measurement", entity: m }
    })
  })

  calNotes.forEach(n => {
    events.push({
      id: `note-${n.id}`, title: n.name, start: n.start_date, end: n.end_date,
      extendedProps: { type: "calendar_note", entity: n }
    })
  })

  return events
}
```

### Calendar Note Management

**Server Actions (`actions/calendar-notes.ts`):**

```typescript
createCalendarNote(data: {
  name: string
  description?: string
  start_date: string
  end_date: string
  duration?: number
  user_manager_id?: string
  user_installer_id?: string
  user_assignee_ids?: string[]
  associated_project_ids?: string[]
})

updateCalendarNote(id, data)
deleteCalendarNote(id)
```

The action handles:
1. Insert into `project_calendar_notes`
2. Insert rows into `project_calendar_note_assignees` for each `user_assignee_id`
3. Insert rows into `project_calendar_note_events` for each `associated_project_id`

### Project Event Updates via Calendar

When a user drags a project event to a new date on the calendar (FullCalendar `eventDrop` callback):
- Call `updateProject(id, { start_date: newDate, end_date: ... })` Server Action

### Filters

Maintain filter state in URL search params (`?type=project,measurement&user=uuid`):
```typescript
// In CalendarView.tsx (client component)
const searchParams = useSearchParams()
const filteredEvents = events.filter(e =>
  activeTypes.includes(e.extendedProps.type)
)
```

### FullCalendar Setup

```typescript
// CalendarView.tsx — must be "use client"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"

// Install: npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
```

### Real-time Calendar Updates

Subscribe to `project_calendar_notes` + `projects` changes to refresh events without page reload. See PRD 06.

## What to Remove After Completion

- `frontend_app/src/sections/calendar/`
- `frontend_app/src/pages/calendar/`
