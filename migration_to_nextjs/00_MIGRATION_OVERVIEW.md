# Migration to Next.js + Supabase — Master Overview

## Project

**Installation Project Management System**
Replace the current Django (backend) + React/Vite (frontend) stack with a unified Next.js 15 application backed by Supabase.

## Supabase Project

| Key | Value |
|-----|-------|
| Project URL | `https://foqyvkblfblyqbqcepnh.supabase.co` |
| Anon Key | In `nextjs_app/.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service Role Key | In `nextjs_app/.env.local` as `SUPABASE_SERVICE_ROLE_KEY` |
| Database | PostgreSQL 15 (fully migrated — 1,825-line schema in `supabase/full_schema.sql`) |

## What Already Exists

The `nextjs_app/` directory is a working scaffold with:
- Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase SSR auth (`@supabase/ssr`) with route protection middleware
- Projects list + detail pages (read-only)
- Server Actions for create/update/delete projects
- Supabase schema fully deployed (14 migrations + RLS + triggers + functions)
- Data fully migrated from MongoDB (sync_v7 — all 33 table pairs synced)

## Migration Documents Index

| # | Document | What It Covers |
|---|----------|----------------|
| 01 | [Authentication & Users](./01_PRD_auth_users.md) | Replace Django session/JWT auth with Supabase Auth |
| 02 | [Projects Module](./02_PRD_projects.md) | Full projects CRUD, kanban, tasks, attachments, work orders, profit reports |
| 03 | [Services Module](./03_PRD_services.md) | Services CRUD, stages, tasks, comments, issues |
| 04 | [Measurements Module](./04_PRD_measurements.md) | Measurements CRUD, marks, comments, notes |
| 05 | [Calendar Module](./05_PRD_calendar.md) | FullCalendar views, calendar notes, project events |
| 06 | [Real-time & Notifications](./06_PRD_realtime_notifications.md) | Replace Django Channels/WebSocket with Supabase Realtime |
| 07 | [Scheduled Tasks](./07_PRD_scheduled_tasks.md) | Replace Celery beat with Supabase pg_cron + Edge Functions |
| 08 | [File Storage](./08_PRD_file_storage.md) | Replace AWS S3 direct upload with Supabase Storage |
| 09 | [Zoho Integration](./09_PRD_zoho_integration.md) | Replace Django Zoho API proxy with Next.js Route Handlers |
| 10 | [Admin & User Management](./10_PRD_admin_users.md) | User roles, permissions, installation crews management |
| 11 | [Reporting & Analytics](./11_PRD_reporting.md) | Profit reports, tracking, kanban analytics |
| 12 | [Infrastructure & Deployment](./12_PRD_infrastructure.md) | Retire Docker stack, deploy Next.js to Vercel/AWS |

## Stack Comparison

| Concern | Current | Target |
|---------|---------|--------|
| Backend framework | Django 5.1 | Next.js 15 Server Actions + Route Handlers |
| Database | MongoDB (primary) + SQLite | Supabase (PostgreSQL 15) ✅ migrated |
| Auth | Custom session + JWT (MongoDB) | Supabase Auth |
| API query language | GraphQL (graphene-mongo) + REST | Supabase JS SDK (direct DB) + RLS |
| Real-time | Django Channels (Redis) | Supabase Realtime |
| Scheduled tasks | Celery + Redis | Supabase pg_cron + Edge Functions |
| File storage | AWS S3 | Supabase Storage |
| Frontend | React 18 / Vite / MUI | Next.js 15 / Tailwind / shadcn/ui ✅ scaffold exists |
| Deployment | Docker Compose + EC2 + Nginx | Vercel (frontend) + Supabase (all backend services) |

## Migration Phases

```
Phase 1 (PRDs 01–02):  Auth + Projects        ← highest usage, unblocks everything
Phase 2 (PRDs 03–04):  Services + Measurements
Phase 3 (PRDs 05–06):  Calendar + Real-time
Phase 4 (PRDs 07–08):  Scheduled tasks + File storage
Phase 5 (PRDs 09–11):  Zoho + Admin + Reporting
Phase 6 (PRD 12):      Infra cutover + decommission Django stack
```

## Permanent Constraints

- **RLS is enabled** on all Supabase tables. Every Server Action and Route Handler runs under the anon key (user session) — never the service role key, except admin-only operations.
- **`is_staff` check** is done via `public.is_staff()` SQL function (reads `users.is_staff`).
- **Orphan records**: 20 `project_task_comments` and 1 `measurement_comment` reference deleted MongoDB documents and cannot be linked — treat as read-only historical data.
- The `nextjs_app/` scaffold already uses the file naming and folder conventions documented in the Next.js App Router — continue the established pattern.
