# PRD 01 — Authentication & Users

## Objective

Replace Django's custom MongoDB session/JWT authentication (`api_authorization`) with Supabase Auth. The `users` table already exists in Supabase and mirrors `auth.users` via a foreign key.

## Current System

**Django `api_authorization` app:**
- `POST /api/authorization/login/` — creates a session, returns a signed cookie
- `POST /api/authorization/logout/` — clears session
- `POST /api/authorization/token/` — returns JWT access + refresh tokens
- `POST /api/authorization/token/refresh/` — refreshes JWT
- `MongoAuthMiddleware` — reads `session['user_id']`, looks up `LoginUser` from MongoDB, sets `request.user`
- `RevocationCheckJWTAuthentication` — validates JWT and checks `revoked_tokens` collection
- Custom `MongoDBBackend` — bypasses Django's ORM auth entirely

**Current user model fields:** `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `phone_number`, `user_role`, `avatar_url`, `installer_info`

**Frontend (React/Vite):** Uses Auth0 + AWS Amplify + Firebase auth wrappers, but actual API calls use session cookies from the Django backend.

## Target System (Supabase Auth + Next.js)

### Supabase Tables (already deployed)

```sql
public.users           -- mirrors auth.users (id FK), all profile fields
public.user_roles      -- Administrator, Installer, Manager, etc.
public.revoked_tokens  -- jti-based token revocation (keep for audit trail)
```

### Auth Flow

1. **Login:** `supabase.auth.signInWithPassword({ email, password })` from the Next.js login page (`app/(auth)/login/page.tsx`)
2. **Session management:** Handled by `@supabase/ssr` via middleware (`middleware.ts`) — already implemented
3. **Logout:** `supabase.auth.signOut()` Server Action
4. **Route protection:** Middleware already redirects unauthenticated users to `/login` — already implemented
5. **Password reset:** `supabase.auth.resetPasswordForEmail()` — new page needed

### Pages to Build

| Route | Description | Status |
|-------|-------------|--------|
| `/login` | Email + password sign-in form | Scaffold exists — wire up action |
| `/register` | Invite-only registration (admin creates users) | Scaffold exists — restrict to admin flow |
| `/reset-password` | Request password reset email | New |
| `/reset-password/confirm` | Set new password from magic link | New |

### Server Actions to Build (`actions/auth.ts`)

```typescript
loginAction(email: string, password: string): Promise<AuthResult>
logoutAction(): Promise<void>
resetPasswordRequestAction(email: string): Promise<void>
resetPasswordConfirmAction(password: string): Promise<void>
```

### User Profile Management

**Pages:**
- `/users` — list all users (staff only)
- `/users/[id]` — user profile view/edit
- `/users/new` — create user (admin only — calls `supabase.auth.admin.createUser()` via service role)

**Server Actions (`actions/users.ts`):**
```typescript
createUser(data): Promise<User>      // service role — creates auth.user + public.users row
updateUser(id, data): Promise<User>  // anon key with RLS
deleteUser(id): Promise<void>        // staff only
changePassword(id, password)         // service role
```

**RLS rules to verify:**
- Users can read their own profile
- Staff can read/write all users
- Non-staff can only update their own record

### User Roles Management

**Pages:**
- `/user-roles` — list + CRUD (staff only)

**Server Actions (`actions/user-roles.ts`):**
```typescript
createUserRole(data): Promise<UserRole>
updateUserRole(id, data): Promise<UserRole>
deleteUserRole(id): Promise<void>
```

### Current User Context (replacing `request.user`)

Create a server utility `lib/auth.ts`:
```typescript
export async function getCurrentUser(): Promise<User | null>
// Calls supabase.auth.getUser() → looks up public.users by id
```

Use in Server Components and Server Actions to get the authenticated user's full profile including `is_staff`, `user_role_id`.

### Migration Steps

1. Confirm all existing users have Supabase Auth accounts (password: `ChangeMe2024!` set during migration)
2. Wire up the login page Server Action (replace placeholder)
3. Wire up the register page to admin-only user creation
4. Build reset password flow
5. Build `/users` and `/user-roles` pages
6. Test RLS: non-staff users cannot access other users' data
7. Remove `revoked_tokens` JWT logic — Supabase Auth handles session revocation natively

### Env Variables Required

```bash
# nextjs_app/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://foqyvkblfblyqbqcepnh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## What to Remove After Completion

- `backend_app/api_authorization/` entire app
- Django session-based auth middleware
- JWT `revoked_tokens` MongoDB collection (keep Supabase table for audit)
- Auth0 / AWS Amplify / Firebase auth code in `frontend_app/src/auth/`
