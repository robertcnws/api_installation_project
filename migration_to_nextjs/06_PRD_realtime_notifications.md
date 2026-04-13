# PRD 06 — Real-time & Notifications

## Objective

Replace Django Channels (WebSocket + Redis) with Supabase Realtime. Replace the MongoDB notification system with Supabase Realtime broadcasts and `project_notifications` / `project_notification_users` tables.

## Current System

### Django Channels WebSocket Consumers (`api_projects/consumers.py`, `api_services/consumers.py`, `api_measurements/consumers.py`, `api_users/consumers.py`)

| Consumer | Group Name | What it broadcasts |
|----------|-----------|-------------------|
| `TaskTimerConsumer` | `timer` | Timer start/pause/reset/elapsed events |
| `ProjectInstallationCrewConsumer` | `project_installation_crew` | Crew assignment changes |
| `ProjectConsumer` | `project` | Project CRUD, stage changes |
| `ServiceConsumer` | `service` | Service CRUD, stage changes |
| `MeasurementConsumer` | `measurement` | Measurement CRUD |
| `ProjectNotificationConsumer` | `project_notification` | New notification events |
| `UserConsumer` | `user` | User profile updates |

### Notification System

- MongoDB `project_notification` collection: `{module, info, info_id, type}`
- MongoDB `project_notification_user` collection: `{notification, user, read}`
- On any significant project/service/measurement action, a notification is created and broadcast via WebSocket
- Frontend polls + WebSocket to show notification badges and toasts

### Infrastructure

- Redis channel layer on `localhost:6379` (port `6399` in Docker)
- Django Channels ASGI server (uvicorn)
- All WebSocket connections go through nginx

## Target: Supabase Realtime

### Supabase Realtime Setup

Supabase Realtime is already enabled in `supabase/config.toml` with the comment:
```
# Realtime subscriptions — enable for live updates on:
# projects, services, measurements, project_notifications
```

### Channel Strategy

Replace each Django Channels group with a Supabase Realtime channel:

| Current Group | Supabase Channel | Tables to watch |
|--------------|-----------------|-----------------|
| `project` | `projects-channel` | `projects` (INSERT, UPDATE, DELETE) |
| `service` | `services-channel` | `services` |
| `measurement` | `measurements-channel` | `measurements` |
| `project_notification` | `notifications-channel` | `project_notification_users` (for current user) |
| `project_installation_crew` | `crews-channel` | `project_installation_crews` |
| `timer` | Broadcast (no table — transient) | Supabase Realtime broadcast |
| `user` | `users-channel` | `users` |

### Client-Side Implementation

Create a custom hook library `hooks/use-realtime.ts`:

```typescript
"use client"

import { useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

// Generic table subscription hook
export function useTableSubscription<T>(
  table: string,
  onInsert?: (row: T) => void,
  onUpdate?: (row: T) => void,
  onDelete?: (row: { old: T }) => void
) {
  const supabase = createBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table }, (payload) => {
        onInsert?.(payload.new as T)
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table }, (payload) => {
        onUpdate?.(payload.new as T)
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table }, (payload) => {
        onDelete?.(payload as { old: T })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table])
}

// Notification-specific hook — filters to current user
export function useNotifications(userId: string, onNew: (notif: any) => void) {
  const supabase = createBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "project_notification_users",
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        onNew(payload.new)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])
}
```

Create `lib/supabase/client.ts` for browser-side Supabase client:
```typescript
"use client"
import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

export function createBrowserClient() {
  return createSSRBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Timer Real-time (Broadcast)

The timer is transient state (start time + elapsed, not stored per-event in a table). Use Supabase Realtime **broadcast** (no persistence):

```typescript
// In timer Server Action — after updating timer state:
const channel = supabase.channel("timer")
await channel.send({
  type: "broadcast",
  event: "timer_update",
  payload: { entityType, entityId, state: "running", elapsed }
})

// In client component:
const channel = supabase.channel("timer")
channel.on("broadcast", { event: "timer_update" }, (payload) => {
  updateTimerUI(payload)
}).subscribe()
```

### Notification System (replacing MongoDB notifications)

**On any significant action** (project stage change, service close, etc.), insert into `project_notifications` + `project_notification_users`:

```typescript
// Utility: lib/notifications.ts
export async function createNotification(supabase, {
  module,   // "project" | "service" | "measurement"
  info,     // human-readable description
  info_id,  // entity ID
  type,     // "load" | "update" | "delete"
  userIds,  // array of user UUIDs to notify
}) {
  const { data: notif } = await supabase
    .from("project_notifications")
    .insert({ module, info, info_id, type })
    .select().single()

  if (notif && userIds.length > 0) {
    await supabase.from("project_notification_users").insert(
      userIds.map(uid => ({ notification_id: notif.id, user_id: uid, read: false }))
    )
  }
}
```

The Realtime subscription on `project_notification_users` (filtered by `user_id`) triggers the frontend toast/badge.

### Notification Bell UI Component

Create `components/layout/NotificationBell.tsx` (client component):
- Badge count = unread notifications from `project_notification_users` where `read = false`
- Click → dropdown list of recent notifications
- Click notification → navigate to entity detail page
- Mark as read via Server Action `markNotificationsRead()`
- Uses `useNotifications()` hook for real-time badge updates

### Unread Count Query

```typescript
const { count } = await supabase
  .from("project_notification_users")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id)
  .eq("read", false)
```

## What to Remove After Completion

- `backend_app/api_projects/consumers.py`, `ws_urls.py`
- `backend_app/api_services/consumers.py`, `ws_urls.py`
- `backend_app/api_measurements/consumers.py`, `ws_urls.py`
- `backend_app/api_users/consumers.py`, `ws_urls.py`
- `backend_app/system_installation_project/asgi.py` (Channels ASGI config)
- Redis container from `docker-compose.yml` (after full migration)
- `channels`, `channels-redis` Python packages
