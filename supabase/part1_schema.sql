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
-- ============================================================
-- Migration 002: Project & Service Stages, Project Roles
-- ============================================================

-- ============================================================
-- TABLE: project_stages
-- Source: api_projects/models.py :: ProjectStage
-- ============================================================
CREATE TABLE public.project_stages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  "order"     INTEGER,
  other_name  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_stages_order     ON public.project_stages ("order");
CREATE INDEX idx_project_stages_is_active ON public.project_stages (is_active);

CREATE TRIGGER set_project_stages_updated_at
  BEFORE UPDATE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_task_stages
-- Source: api_projects/models.py :: ProjectTaskStage
-- ============================================================
CREATE TABLE public.project_task_stages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  "order"     INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_task_stages_order ON public.project_task_stages ("order");

CREATE TRIGGER set_project_task_stages_updated_at
  BEFORE UPDATE ON public.project_task_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_roles
-- Source: api_projects/models.py :: ProjectRole
-- ============================================================
CREATE TABLE public.project_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_project_roles_updated_at
  BEFORE UPDATE ON public.project_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: service_stages
-- Source: api_services/models.py :: ServiceStage
-- ============================================================
CREATE TABLE public.service_stages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  "order"     INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_stages_order     ON public.service_stages ("order");
CREATE INDEX idx_service_stages_is_active ON public.service_stages (is_active);

CREATE TRIGGER set_service_stages_updated_at
  BEFORE UPDATE ON public.service_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: service_issues
-- Source: api_services/models.py :: ServiceIssue
-- ============================================================
CREATE TABLE public.service_issues (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  description     TEXT,
  user_reporter_id UUID       REFERENCES public.users (id) ON DELETE SET NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_service_issues_updated_at
  BEFORE UPDATE ON public.service_issues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_default_guide_products
-- Source: api_projects/models.py :: ProjectDefaultGuideProduct
-- ============================================================
CREATE TABLE public.project_default_guide_products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  price       NUMERIC(12,2),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  "order"     INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_project_default_guide_products_updated_at
  BEFORE UPDATE ON public.project_default_guide_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_default_materials
-- Source: api_projects/models.py :: ProjectDefaultMaterial
-- ============================================================
CREATE TABLE public.project_default_materials (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  description       TEXT,
  price             NUMERIC(12,2),
  quantity          INTEGER,
  is_packaged       BOOLEAN     NOT NULL DEFAULT FALSE,
  package_quantity  INTEGER,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_project_default_materials_updated_at
  BEFORE UPDATE ON public.project_default_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: default_material <-> default_guide_products
CREATE TABLE public.project_default_material_guide_products (
  default_material_id     UUID NOT NULL REFERENCES public.project_default_materials (id) ON DELETE CASCADE,
  default_guide_product_id UUID NOT NULL REFERENCES public.project_default_guide_products (id) ON DELETE CASCADE,
  PRIMARY KEY (default_material_id, default_guide_product_id)
);
-- ============================================================
-- Migration 003: Zoho Integration Tables
-- Created before projects/services so they can FK to them
-- Source: api_integration/models.py
-- ============================================================

-- ============================================================
-- TABLE: zoho_customers
-- Source: ZohoCustomer
-- ============================================================
CREATE TABLE public.zoho_customers (
  id                                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                           TEXT        NOT NULL UNIQUE,
  contact_name                         TEXT        NOT NULL,
  customer_name                        TEXT        NOT NULL,
  company_name                         TEXT,
  status                               TEXT        NOT NULL,
  first_name                           TEXT        NOT NULL,
  last_name                            TEXT        NOT NULL,
  email                                TEXT        NOT NULL,
  phone                                TEXT        NOT NULL,
  mobile                               TEXT,
  contact_type                         TEXT        NOT NULL,
  has_transaction                      BOOLEAN,
  is_linked_with_zohocrm               BOOLEAN,
  website                              TEXT,
  primary_contact_id                   TEXT,
  payment_terms                        INTEGER,
  payment_terms_label                  TEXT,
  currency_id                          INTEGER,
  currency_code                        TEXT,
  currency_symbol                      TEXT,
  outstanding_receivable_amount        NUMERIC(14,4),
  outstanding_receivable_amount_bcy    NUMERIC(14,4),
  unused_credits_receivable_amount     NUMERIC(14,4),
  unused_credits_receivable_amount_bcy NUMERIC(14,4),
  facebook                             TEXT,
  twitter                              TEXT,
  payment_remainder_enabled            BOOLEAN,
  notes                                TEXT,
  is_taxable                           BOOLEAN,
  tax_id                               TEXT,
  tax_name                             TEXT,
  tax_percentage                       NUMERIC(6,4),
  tax_authority_id                     TEXT,
  tax_exemption_id                     TEXT,
  tax_authority_name                   TEXT,
  tax_exemption_code                   TEXT,
  place_of_contact                     TEXT,
  gst_no                               TEXT,
  tax_treatment                        TEXT,
  tax_regime                           TEXT,
  legal_name                           TEXT,
  is_tds_applicable                    BOOLEAN,
  vst_treatment                        TEXT,
  gst_treatment                        TEXT,
  -- Complex nested objects stored as JSONB
  custom_fields                        JSONB        DEFAULT '[]',
  billing_address                      JSONB,
  shipping_address                     JSONB,
  contact_persons                      JSONB        DEFAULT '[]',
  default_templates                    JSONB,
  qb_list_id                           TEXT,
  created_time                         TIMESTAMPTZ,
  created_time_formatted               TEXT,
  last_modified_time                   TIMESTAMPTZ,
  last_modified_time_formatted         TEXT,
  created_at                           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zoho_customers_contact_id ON public.zoho_customers (contact_id);
CREATE INDEX idx_zoho_customers_email      ON public.zoho_customers (email);
CREATE INDEX idx_zoho_customers_status     ON public.zoho_customers (status);

CREATE TRIGGER set_zoho_customers_updated_at
  BEFORE UPDATE ON public.zoho_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: zoho_sales_orders
-- Source: ZohoSalesOrder
-- ============================================================
CREATE TABLE public.zoho_sales_orders (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salesorder_id           TEXT        UNIQUE,
  salesorder_number       TEXT,
  date                    TIMESTAMPTZ,
  status                  TEXT,
  customer_id             TEXT,
  customer_name           TEXT,
  is_taxable              BOOLEAN,
  tax_id                  TEXT,
  tax_name                TEXT,
  tax_percentage          NUMERIC(6,4),
  currency_id             TEXT,
  currency_code           TEXT,
  currency_symbol         TEXT,
  exchange_rate           NUMERIC(14,6),
  delivery_method         TEXT,
  total_quantity          NUMERIC(14,4),
  sub_total               NUMERIC(14,4),
  tax_total               NUMERIC(14,4),
  total                   NUMERIC(14,4),
  created_by_email        TEXT,
  created_by_name         TEXT,
  salesperson_id          TEXT,
  salesperson_name        TEXT,
  is_test_order           BOOLEAN,
  notes                   TEXT,
  payment_terms           INTEGER,
  payment_terms_label     TEXT,
  reference_number        TEXT,
  -- Arrays stored as JSONB
  line_items              JSONB        DEFAULT '[]',
  shipping_address        JSONB,
  billing_address         JSONB,
  warehouses              JSONB        DEFAULT '[]',
  custom_fields           JSONB        DEFAULT '[]',
  order_sub_statuses      JSONB        DEFAULT '[]',
  shipment_sub_statuses   JSONB        DEFAULT '[]',
  -- zoho_customer FK (optional — customer may not exist locally)
  zoho_customer_id        UUID         REFERENCES public.zoho_customers (id) ON DELETE SET NULL,
  created_time            TIMESTAMPTZ,
  last_modified_time      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zoho_sales_orders_salesorder_id  ON public.zoho_sales_orders (salesorder_id);
CREATE INDEX idx_zoho_sales_orders_customer_id    ON public.zoho_sales_orders (customer_id);
CREATE INDEX idx_zoho_sales_orders_status         ON public.zoho_sales_orders (status);
CREATE INDEX idx_zoho_sales_orders_reference      ON public.zoho_sales_orders (reference_number);

CREATE TRIGGER set_zoho_sales_orders_updated_at
  BEFORE UPDATE ON public.zoho_sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
