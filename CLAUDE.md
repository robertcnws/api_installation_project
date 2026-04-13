# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Installation Project Management System** consisting of three applications:

1. **`backend_app/`** — Django 5.1 REST API + GraphQL backend (Python)
2. **`frontend_app/`** — React/Vite SPA frontend (JavaScript, MUI)
3. **`nextjs_app/`** — Next.js 15 frontend (TypeScript, Tailwind, Supabase)

The system also includes MongoDB, Redis, Nginx, and optional Supabase infrastructure, all orchestrated via Docker Compose.

---

## Commands

### Backend (`backend_app/`)

```bash
# Local development (from backend_app/)
python manage.py runserver 8001

# Migrations
python manage.py makemigrations
python manage.py migrate

# Run a specific test
python manage.py test api_projects.tests

# Celery worker (requires Redis)
celery -A system_installation_project worker --loglevel=info -E

# Celery beat scheduler
celery -A system_installation_project beat --loglevel=info

# Collect static files
python manage.py collectstatic --no-input
```

### Frontend (`frontend_app/`) — Vite/React, uses Yarn

```bash
yarn dev           # Start dev server
yarn build         # Production build
yarn lint          # ESLint
yarn lint:fix      # ESLint with auto-fix
yarn fm:check      # Prettier check
yarn fm:fix        # Prettier fix
```

### Next.js App (`nextjs_app/`) — uses npm/pnpm

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm run lint       # ESLint via next lint
npm run type-check # TypeScript check without emitting
```

### Docker (full stack)

```bash
# Start all services locally
docker-compose up --build

# Services exposed:
# Backend API:    http://localhost:8001
# Nginx:          http://localhost:85
# MongoDB:        localhost:27037
# MongoExpress:   http://localhost:8085
# AdminMongo:     http://localhost:8082
# Redis:          localhost:6399
```

### Supabase (local)

```bash
supabase start     # Starts local Supabase (API: 54321, DB: 54322, Studio: 54323)
supabase stop
supabase db reset  # Reapply migrations + seed
```

---

## Architecture

### Backend (`backend_app/`)

Django project at `system_installation_project/` with these apps:

| App | Responsibility |
|-----|---------------|
| `api_authorization` | Custom MongoDB-backed auth (session-based, JWT revocation), `MongoAuthMiddleware`, `MongoConnectionMiddleware` |
| `api_projects` | Core domain — projects, tasks, stages, crews, work orders, timers, calendar notes, profit reports |
| `api_services` | Services management |
| `api_measurements` | Measurements tracking |
| `api_users` | User management |
| `api_integration` | External integrations |
| `api_projects_async_task_sequence` | Celery async task orchestration for project workflows |

**Database pattern:** SQLite is the Django ORM default DB (sessions/admin), but **primary data is stored in MongoDB via MongoEngine**. Authentication uses a custom `MongoDBBackend` with `LoginUser` as the user model.

**API pattern:** Each app exposes both REST endpoints (DRF) and GraphQL (graphene-django/graphene-mongo). GraphQL schemas live in `schema.py` and `schema_models/` within each app. REST views in `views.py`, URL routing in `urls.py`.

**Repository pattern:** `api_projects/repository/` contains one file per domain entity (e.g., `project_crud_repository.py`, `project_work_orders_repository.py`). Views delegate to these repositories.

**WebSockets:** Django Channels with Redis channel layers. Each app with real-time features has `consumers.py` and `ws_urls.py`.

**Async tasks:** Celery + Redis. `api_projects/tasks.py` and `api_projects_async_task_sequence/tasks.py`.

**Startup sequence (Docker):** makemigrations → migrate → collectstatic → `init_scripts.py` → `sync_scripts` management command → Celery worker + beat → Gunicorn (uvicorn workers) on port 8001.

### Frontend — React/Vite (`frontend_app/`)

Standard Minimal Kit v6 (Vite + JS) structure:
- `src/sections/` — feature-level page components (projects, calendar, kanban, etc.)
- `src/pages/` — route-level page wrappers
- `src/components/` — shared UI components
- `src/hooks/` — custom React hooks
- `src/auth/` — Auth0 + AWS Amplify + Firebase auth integrations
- API calls use Axios; GraphQL via Apollo Client; data fetching with TanStack Query + SWR

### Frontend — Next.js (`nextjs_app/`)

App Router structure:
- `app/(auth)/` — login, register pages
- `app/(dashboard)/` — authenticated routes: projects, services, measurements, calendar, stages, users, reports, installation-crews
- `app/api/` — Next.js API routes
- `components/` — organized into `ui/`, `shared/`, `projects/`, `services/`, `measurements/`, `auth/`, `layout/`
- `actions/` — Next.js Server Actions
- `hooks/` — client-side hooks
- `lib/` — utilities, Supabase client setup

**Auth:** Supabase Auth via `@supabase/ssr`. Middleware at `middleware.ts` protects all routes except `/login`, `/register`, `/api/auth`. Unauthenticated users redirect to `/login`; authenticated users redirect away from auth pages to `/dashboard`.

### Supabase (`supabase/`)

- Schema split across `part1_schema.sql`, `part2_schema.sql`, `part3_schema.sql` (combined in `full_schema.sql`)
- Migrations in `migrations/`, seed data in `seed/`
- Storage buckets: `project-attachments`, `service-attachments`, `measurement-attachments`, `avatars`
- Realtime enabled for: projects, services, measurements, project_notifications

### Infrastructure

- **Nginx** proxies frontend → backend; config in `nginx/nginx.conf`
- **Production Docker Compose** files are separate per service tier: `docker-compose.aws.backend.prod.yml`, `docker-compose.aws.frontend.prod.yml`, `docker-compose.aws.jenkins.prod.yml`
- **CI/CD:** Jenkins (`Jenkinsfile`, `jenkins/`)
- `shared-network` Docker bridge network must exist externally before running compose: `docker network create shared-network`
