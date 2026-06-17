# PRD 12 — Infrastructure & Deployment

## Objective

Decommission the Docker Compose stack (Django, MongoDB, Redis, Nginx, Celery) and deploy the unified Next.js app to production. Establish CI/CD for the new stack.

## Current Infrastructure

### Docker Compose Services (`docker-compose.yml`)

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| `mongodb_installation` | `mongodb_installation` | 27037 | Primary data store |
| `mongoexpress_installation` | `mongoexpress_installation` | 8085 | MongoDB admin UI |
| `adminmongo_installation` | `adminmongo_installation` | 8082 | Alternative MongoDB UI |
| `api_installation` | `api_installation` | 8001 | Django API (Gunicorn + Uvicorn) |
| `nginx_installation` | `nginx_installation` | 85/543 | Reverse proxy |
| `redis_installation` | `redis_installation` | 6399 | Celery broker + WS channel layer |

### Production AWS Docker Compose Files

- `docker-compose.aws.backend.prod.yml` — backend on EC2
- `docker-compose.aws.frontend.prod.yml` — frontend (Vite/React) on separate EC2 or S3+CloudFront
- `docker-compose.aws.jenkins.prod.yml` — Jenkins CI/CD server

### CI/CD

Jenkins (`Jenkinsfile`) handles build + deploy pipelines.

## Target Infrastructure

### Application Hosting

| Component | Service | Notes |
|-----------|---------|-------|
| Next.js app | **Vercel** (recommended) or AWS App Runner | Zero-config deployment, edge functions, automatic HTTPS |
| Database | **Supabase** (PostgreSQL) | Already live at `foqyvkblfblyqbqcepnh.supabase.co` |
| Auth | **Supabase Auth** | Included |
| Realtime | **Supabase Realtime** | Included |
| File storage | **Supabase Storage** | Included |
| Scheduled tasks | **Supabase pg_cron + Edge Functions** | Included |
| Zoho sync | **Supabase Edge Functions** | Serverless |

### Vercel Deployment

```bash
# From nextjs_app/
npx vercel --prod

# Or connect GitHub repo in Vercel dashboard:
# Root directory: nextjs_app/
# Build command: npm run build
# Output directory: .next
```

**Environment Variables (set in Vercel dashboard):**

```
NEXT_PUBLIC_SUPABASE_URL=https://foqyvkblfblyqbqcepnh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ZOHO_CLIENT_ID=<zoho_client_id>
ZOHO_CLIENT_SECRET=<zoho_client_secret>
ZOHO_REFRESH_TOKEN=<zoho_refresh_token>
ZOHO_ORG_ID=<zoho_org_id>
```

### Custom Domain

Configure in Vercel dashboard: point existing domain (or new domain) to Vercel deployment.
Update Supabase Auth `site_url` and `additional_redirect_urls` in `supabase/config.toml` to match production domain.

### CI/CD: GitHub Actions (replace Jenkins)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
    paths: ["nextjs_app/**"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: nextjs_app

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: nextjs_app/package-lock.json

      - run: npm ci

      - run: npm run type-check

      - run: npm run lint

      - run: npm run build

      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: nextjs_app
          vercel-args: "--prod"
```

### Supabase CLI for Schema Migrations

```bash
# Link to production project
supabase link --project-ref foqyvkblfblyqbqcepnh

# Push new migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy
```

Add to GitHub Actions:
```yaml
- name: Push Supabase migrations
  run: supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Cutover Plan

### Phase A — Parallel Running

1. Deploy Next.js app to Vercel (staging URL)
2. Keep Django stack running
3. New users authenticate via Supabase Auth; existing users via Django (dual auth)
4. Test all Next.js features against live Supabase data

### Phase B — Traffic Switch

1. Update DNS: route production domain to Vercel
2. Disable new writes to MongoDB (read-only mode on Django)
3. All writes go through Next.js → Supabase
4. Monitor for 1 week

### Phase C — Decommission

1. Stop Django API server
2. Stop Redis container
3. Stop Celery workers
4. Keep MongoDB running for 30 days as read-only backup
5. After 30 days: snapshot MongoDB and shut down container
6. Decommission EC2 backend instance
7. Optionally keep Jenkins or migrate to GitHub Actions

### Rollback Plan

- Vercel supports instant rollback to previous deployment
- Keep Django stack in stopped (not deleted) state for 30 days
- MongoDB data is read-only backup — can be re-activated if needed

## Environment Files to Create

### `nextjs_app/.env.local` (local development)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://foqyvkblfblyqbqcepnh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvcXl2a2JsZmJseXFicWNlcG5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2NjcyNywiZXhwIjoyMDkwNjQyNzI3fQ.P2m47mrwaG40EgXXsfifu5TT84kONJhF-782keqUVZc
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ORG_ID=
```

### `nextjs_app/.env.example` (committed to repo — no secrets)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ORG_ID=
```

## Services to Decommission (After Full Migration)

| Service | When to decommission |
|---------|---------------------|
| Django API (`api_installation` container) | After Phase C |
| Redis (`redis_installation` container) | After PRD 06 (Realtime) and PRD 07 (Celery) complete |
| MongoDB (`mongodb_installation` container) | 30 days after Phase C |
| MongoExpress / AdminMongo | Same as MongoDB |
| Nginx (`nginx_installation` container) | After Phase C |
| Jenkins | After GitHub Actions CI/CD is stable |
| AWS EC2 backend instance | After all containers decommissioned |
| AWS EC2 frontend instance | After Vercel deployment stable |

## Cost Comparison

| Item | Current Monthly | Target Monthly |
|------|----------------|----------------|
| EC2 backend | ~$50–100 | $0 |
| EC2 frontend | ~$20–50 | $0 |
| EC2 Jenkins | ~$20 | $0 |
| AWS S3 | ~$5–20 | ~$0 (Supabase Storage included) |
| Redis (ElastiCache or self-hosted) | ~$15–30 | $0 |
| Supabase | $0 (free tier) | $25/mo (Pro, for production) |
| Vercel | $0 (free tier) | $20/mo (Pro, for team) |
| **Total estimate** | ~$110–220/mo | ~$45/mo |
