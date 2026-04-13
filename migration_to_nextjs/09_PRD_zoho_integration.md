# PRD 09 — Zoho Integration

## Objective

Migrate the Zoho CRM/Inventory API proxy (`api_integration`) from Django to Next.js Route Handlers + Supabase.

## Current System

### Django `api_integration` Endpoints (`/api/integration/`)

| Endpoint | Purpose |
|----------|---------|
| `GET list_sales_orders/` | Fetch Zoho Sales Orders and sync to MongoDB |
| `DELETE delete_sales_orders/` | Delete sales orders from MongoDB |
| `GET list_customers/<zoho_org_id>/` | Fetch customers from Zoho |
| `GET list_salesorder_to_service/` | List sales orders linkable to services |
| `POST refetch_salesorder/<project_id>/` | Re-sync a specific SO for a project |
| `POST refetch_salesorder_service/<service_id>/` | Re-sync a specific SO for a service |
| `GET list_users_permissions/` | List user permission sets |
| `POST manage_user_permissions/` | Create/update user permission sets |

### Supabase Tables (already deployed)

| Table | Content |
|-------|---------|
| `zoho_sales_orders` | 181 sales orders migrated from MongoDB |
| `zoho_customers` | Customer lookup data |

### Data in Supabase

- `zoho_sales_orders` contains the local copy/cache of Zoho data
- The Django backend fetches from Zoho API and stores locally — this caching layer moves to Next.js

## Target: Next.js Route Handlers + Server Actions

### Zoho API Client (`lib/zoho.ts`)

```typescript
// Zoho OAuth token management
export class ZohoClient {
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken
    }
    // Refresh token using Zoho OAuth2
    const res = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    })
    const data = await res.json()
    this.accessToken = data.access_token
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000)
    return this.accessToken
  }

  async listSalesOrders(orgId: string): Promise<ZohoSalesOrder[]> { ... }
  async getSalesOrder(orderId: string): Promise<ZohoSalesOrder> { ... }
  async listCustomers(orgId: string): Promise<ZohoCustomer[]> { ... }
}

export const zoho = new ZohoClient()
```

### Route Handlers (`app/api/zoho/`)

```
app/api/zoho/
  sales-orders/route.ts          ← GET: list, DELETE: bulk delete
  sales-orders/sync/route.ts     ← POST: sync from Zoho to Supabase
  customers/[orgId]/route.ts     ← GET: list customers
  projects/[id]/resync/route.ts  ← POST: resync SO for a project
  services/[id]/resync/route.ts  ← POST: resync SO for a service
```

Example — sync sales orders:

```typescript
// app/api/zoho/sales-orders/sync/route.ts
export async function POST() {
  const supabase = createServiceRoleClient()
  const orders = await zoho.listSalesOrders(process.env.ZOHO_ORG_ID!)

  // Upsert into zoho_sales_orders
  const { error } = await supabase
    .from("zoho_sales_orders")
    .upsert(
      orders.map(o => ({
        id: o.salesorder_id,
        number: o.salesorder_number,
        customer_name: o.customer_name,
        status: o.status,
        total: o.total,
        raw_data: o,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "id" }
    )

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ synced: orders.length })
}
```

### Server Actions (`actions/zoho.ts`)

```typescript
export async function syncSalesOrders(): Promise<{ synced: number }>
export async function deleteSalesOrders(ids: string[]): Promise<void>
export async function refetchSalesOrderForProject(projectId: string): Promise<void>
export async function refetchSalesOrderForService(serviceId: string): Promise<void>
```

### User Permissions (Zoho-linked)

`list_users_permissions` and `manage_user_permissions` manage which Zoho users/orgs have access:
- Move to Supabase table `project_user_permissions` (already in schema)
- CRUD via Server Actions in `actions/users.ts`

### Sales Orders Page

```
app/(dashboard)/
  sales-order/
    page.tsx     ← list of zoho_sales_orders with sync button
```

Clicking "Sync" calls `syncSalesOrders()` Server Action → calls Zoho API → upserts to Supabase → revalidates page.

### Env Variables

```bash
# nextjs_app/.env.local
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_ORG_ID=...
```

### Scheduled Sync

Auto-sync sales orders daily via pg_cron Edge Function (see PRD 07):

```sql
SELECT cron.schedule(
  'sync-zoho-sales-orders',
  '0 6 * * *',  -- 6:00 AM UTC daily
  $$
    SELECT net.http_post(
      url := 'https://foqyvkblfblyqbqcepnh.supabase.co/functions/v1/sync-zoho',
      headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
    );
  $$
);
```

## What to Remove After Completion

- `backend_app/api_integration/` entire app
- Zoho credentials from `backend_app/.env`
- `frontend_app/src/pages/sales-order/`
- `frontend_app/src/sections/sales-order/`
- `frontend_app/src/sections/order/`
