# PRD 10 — Admin & User Management

## Objective

Migrate all admin-facing management pages from `frontend_app` to Next.js + Supabase: user roles, installation crews, project stages, task stages, default tasks, default guide products, default materials, and user management.

## Current System

### Frontend Admin Sections

| Section | Path in frontend_app | Purpose |
|---------|---------------------|---------|
| Users | `src/sections/user/` | List, create, edit, delete users |
| User Roles | `src/sections/user-role/` | CRUD user roles |
| Stages | `src/sections/stages/` | Project stages CRUD |
| Task Stages | `src/sections/stages-task/` | Project task stages CRUD |
| Default Tasks | `src/sections/task-default/` | Default task templates CRUD |
| Default Guide Products | `src/sections/default-guide-product/` | Guide product templates CRUD |
| Default Materials | `src/sections/default-material/` | Material templates CRUD |
| Installation Crews | `src/sections/installation-crew/` | Installation crew CRUD |

All these sections make REST API calls to Django backends, protected by staff/role checks.

### Django Endpoints Involved

- `api_users/`: user, user-role CRUD
- `api_projects/`: stages, task-stages, default-tasks, default-guide-products, default-materials, installation-crews CRUD

## Target: Next.js Admin Pages

All admin pages are **staff-only**. Access is controlled by the `is_staff` field on the user record, enforced by:
1. Server Component guard: `if (!user?.is_staff) redirect("/dashboard")`
2. RLS: Supabase `is_staff()` function (`supabase/migrations/012_rls_policies.sql`)

### Page Structure

```
app/(dashboard)/
  users/
    page.tsx           ← user list (staff only)
    new/page.tsx       ← create user (staff only)
    [id]/page.tsx      ← user profile / edit

  user-roles/
    page.tsx           ← user roles list + inline CRUD
    already exists as stub

  stages/
    page.tsx           ← project stages + task stages (tabs)
    already exists as stub

  installation-crews/
    page.tsx           ← crews list + CRUD
    already exists as stub

  (settings or admin group — new):
    default-tasks/
      page.tsx         ← default task templates CRUD
    default-guide-products/
      page.tsx         ← guide product templates CRUD
    default-materials/
      page.tsx         ← material templates CRUD
```

### Server Actions

#### Users (`actions/users.ts`)

```typescript
createUser(data: {
  email: string
  username: string
  first_name: string
  last_name: string
  phone_number?: string
  user_role_id?: string
  is_staff?: boolean
  avatar_url?: string
  installer_info?: object
}): Promise<User>
// Uses SUPABASE_SERVICE_ROLE_KEY to call supabase.auth.admin.createUser()
// Then inserts public.users row

updateUser(id: string, data: Partial<User>): Promise<User>
deleteUser(id: string): Promise<void>
// Calls supabase.auth.admin.deleteUser(id) + deletes public.users row

changeUserPassword(id: string, password: string): Promise<void>
// Uses supabase.auth.admin.updateUserById(id, { password })
```

#### User Roles (`actions/user-roles.ts` — already documented in PRD 01)

#### Stages (`actions/stages.ts`)

```typescript
// Project stages
createProjectStage(data: { name: string, description?: string, order?: number })
updateProjectStage(id: string, data)
deleteProjectStage(id: string)
deleteProjectStages(ids: string[])

// Task stages
createProjectTaskStage(data: { name: string, description?: string, order?: number })
updateProjectTaskStage(id: string, data)
deleteProjectTaskStage(id: string)
deleteProjectTaskStages(ids: string[])

// Service stages
createServiceStage(data)
updateServiceStage(id: string, data)
deleteServiceStage(id: string)
```

#### Default Tasks (`actions/default-tasks.ts` — part of PRD 02)

Already covered in `actions/projects.ts` — expose the same actions from a management page.

#### Installation Crews (`actions/installation-crews.ts` — part of PRD 02)

#### Default Guide Products & Materials

```typescript
// actions/default-guide-products.ts
createDefaultGuideProduct(data: { name: string, description?: string, unit?: string, price?: number })
updateDefaultGuideProduct(id: string, data)
deleteDefaultGuideProduct(id: string)
deleteDefaultGuideProducts(ids: string[])

// actions/default-materials.ts
createDefaultMaterial(data: { name: string, description?: string, unit?: string })
updateDefaultMaterial(id: string, data)
deleteDefaultMaterial(id: string)
deleteDefaultMaterials(ids: string[])
```

### User Management Page Features

The current `frontend_app/src/sections/user/` has:
- Data table with avatar, name, email, role, status columns
- Inline activation/deactivation toggle
- Change password dialog
- Role assignment dropdown
- Installer info card (for installer users: certifications, skills, etc.)

Rebuild using shadcn/ui:
- `DataTable` with column definitions
- `UserForm` sheet/dialog for create/edit
- `ChangePasswordDialog`
- Avatar upload via PRD 08 `uploadAvatar()` action

### Staff Guard Utility

```typescript
// lib/auth.ts
export async function requireStaff(): Promise<User> {
  const supabase = await createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: user } = await supabase
    .from("users")
    .select("*, user_role:user_roles(*)")
    .eq("id", authUser.id)
    .single()

  if (!user?.is_staff) redirect("/dashboard")
  return user
}
```

Use in every admin Server Component:
```typescript
export default async function AdminPage() {
  await requireStaff()
  // ...
}
```

## What to Remove After Completion

- `backend_app/api_users/` entire app
- `frontend_app/src/sections/user/`
- `frontend_app/src/sections/user-role/`
- `frontend_app/src/sections/stages/`
- `frontend_app/src/sections/stages-task/`
- `frontend_app/src/sections/task-default/`
- `frontend_app/src/sections/default-guide-product/`
- `frontend_app/src/sections/default-material/`
- `frontend_app/src/sections/installation-crew/`
