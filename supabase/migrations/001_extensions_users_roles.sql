-- ============================================================
-- Migration 001: Extensions, User Roles, Users, Tokens
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: user_roles
-- Source: api_users/models.py :: UserRole
-- ============================================================
CREATE TABLE public.user_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_roles_is_active ON public.user_roles (is_active);

CREATE TRIGGER set_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: users
-- Source: api_authorization/models.py :: LoginUser
-- Extends Supabase auth.users via id FK
-- ============================================================
CREATE TABLE public.users (
  id            UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username      TEXT        NOT NULL UNIQUE,
  first_name    TEXT,
  last_name     TEXT,
  email         TEXT,
  is_staff      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  phone_number  TEXT,
  country       TEXT,
  state         TEXT,
  city          TEXT,
  address       TEXT,
  zip_code      TEXT,
  gender        TEXT,
  avatar_url    TEXT,
  user_role_id  UUID        REFERENCES public.user_roles (id) ON DELETE SET NULL,
  installer_info JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username    ON public.users (username);
CREATE INDEX idx_users_email       ON public.users (email);
CREATE INDEX idx_users_user_role   ON public.users (user_role_id);
CREATE INDEX idx_users_is_active   ON public.users (is_active);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: revoked_tokens
-- Source: api_authorization/models.py :: RevokedToken
-- ============================================================
CREATE TABLE public.revoked_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jti        TEXT        NOT NULL UNIQUE,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revoked_tokens_jti ON public.revoked_tokens (jti);

-- ============================================================
-- TABLE: project_permissions
-- Source: api_projects/models.py :: ProjectPermissions
-- Defined here because project_users references it
-- ============================================================
CREATE TABLE public.project_permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_project_permissions_updated_at
  BEFORE UPDATE ON public.project_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Auto-create public.users row when a new auth user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
