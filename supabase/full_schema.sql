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
-- ============================================================
-- Migration 004: Projects (core + related tables)
-- Source: api_projects/models.py
-- ============================================================

-- ============================================================
-- TABLE: project_default_tasks
-- Source: ProjectDefaultTask
-- ============================================================
CREATE TABLE public.project_default_tasks (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  number               TEXT,
  description          TEXT,
  "order"              INTEGER,
  project_stage_id     UUID        REFERENCES public.project_stages (id) ON DELETE SET NULL,
  project_stage_status TEXT,
  has_attachments      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_default_tasks_stage ON public.project_default_tasks (project_stage_id);
CREATE INDEX idx_project_default_tasks_order ON public.project_default_tasks ("order");

CREATE TRIGGER set_project_default_tasks_updated_at
  BEFORE UPDATE ON public.project_default_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: projects
-- Source: Project
-- ============================================================
CREATE TABLE public.projects (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                            TEXT        NOT NULL,
  number                          TEXT        NOT NULL UNIQUE,
  description                     TEXT,
  sales_order_id                  UUID        REFERENCES public.zoho_sales_orders (id) ON DELETE SET NULL,
  reference_number                TEXT,
  user_reporter_id                UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  user_manager_id                 UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  user_installer_id               UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  current_stage_id                UUID        REFERENCES public.project_stages (id) ON DELETE SET NULL,
  start_date                      TIMESTAMPTZ,
  end_date                        TIMESTAMPTZ,
  duration                        INTEGER,
  address                         TEXT,
  phone                           TEXT,
  is_active                       BOOLEAN     NOT NULL DEFAULT TRUE,
  has_permission                  BOOLEAN     NOT NULL DEFAULT FALSE,
  all_products_marked             BOOLEAN     NOT NULL DEFAULT FALSE,
  all_windows_marked              BOOLEAN     NOT NULL DEFAULT FALSE,
  all_screw_marked                BOOLEAN     NOT NULL DEFAULT FALSE,
  all_trash_marked                BOOLEAN     NOT NULL DEFAULT FALSE,
  feedback                        TEXT,
  work_scope                      TEXT,
  project_materials_other_notes   TEXT,
  inspection_date                 TIMESTAMPTZ,
  inspection_end_date             TIMESTAMPTZ,
  inspection_duration             INTEGER,
  inspection_is_part_days         BOOLEAN     NOT NULL DEFAULT FALSE,
  finish_permission_date          TIMESTAMPTZ,
  finish_permission_end_date      TIMESTAMPTZ,
  finish_permission_duration      INTEGER,
  finish_permission_is_part_days  BOOLEAN     NOT NULL DEFAULT FALSE,
  is_part_days                    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_number          ON public.projects (number);
CREATE INDEX idx_projects_user_reporter   ON public.projects (user_reporter_id);
CREATE INDEX idx_projects_user_manager    ON public.projects (user_manager_id);
CREATE INDEX idx_projects_user_installer  ON public.projects (user_installer_id);
CREATE INDEX idx_projects_current_stage   ON public.projects (current_stage_id);
CREATE INDEX idx_projects_sales_order     ON public.projects (sales_order_id);
CREATE INDEX idx_projects_is_active       ON public.projects (is_active);
CREATE INDEX idx_projects_start_date      ON public.projects (start_date);

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_stage_history
-- Source: Project.stage_history (ListField)
-- ============================================================
CREATE TABLE public.project_stage_history (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  stage_id             UUID        REFERENCES public.project_stages (id) ON DELETE SET NULL,
  user_id              UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  changed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes                TEXT
);

CREATE INDEX idx_project_stage_history_project ON public.project_stage_history (project_id);

-- ============================================================
-- TABLE: project_users
-- Source: ProjectUser
-- ============================================================
CREATE TABLE public.project_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  project_id  UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  role_id     UUID        REFERENCES public.project_roles (id) ON DELETE SET NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX idx_project_users_project ON public.project_users (project_id);
CREATE INDEX idx_project_users_user    ON public.project_users (user_id);

CREATE TRIGGER set_project_users_updated_at
  BEFORE UPDATE ON public.project_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: project_users <-> project_permissions
CREATE TABLE public.project_user_permissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_user_id  UUID NOT NULL REFERENCES public.project_users (id) ON DELETE CASCADE,
  permission_id    UUID NOT NULL REFERENCES public.project_permissions (id) ON DELETE CASCADE,
  UNIQUE (project_user_id, permission_id)
);

-- ============================================================
-- TABLE: project_materials
-- Source: ProjectMaterial
-- ============================================================
CREATE TABLE public.project_materials (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  description     TEXT,
  quantity        INTEGER,
  cost            NUMERIC(12,2),
  store           TEXT,
  notes           TEXT,
  project_id      UUID        REFERENCES public.projects (id) ON DELETE CASCADE,
  user_reporter_id UUID       REFERENCES public.users (id) ON DELETE SET NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_materials_project ON public.project_materials (project_id);

CREATE TRIGGER set_project_materials_updated_at
  BEFORE UPDATE ON public.project_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: project <-> project_default_guide_products
CREATE TABLE public.project_guide_products (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  guide_product_id         UUID        NOT NULL REFERENCES public.project_default_guide_products (id) ON DELETE CASCADE,
  UNIQUE (project_id, guide_product_id)
);

-- ============================================================
-- TABLE: project_default_task_info
-- Source: ProjetDefaultTaskInfo (per-project instance of a default task)
-- ============================================================
CREATE TABLE public.project_default_task_info (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_default_task_id UUID      NOT NULL REFERENCES public.project_default_tasks (id) ON DELETE CASCADE,
  project_id            UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  status                TEXT,
  percentage            NUMERIC(5,2),
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_default_task_id, project_id)
);

CREATE INDEX idx_project_default_task_info_project ON public.project_default_task_info (project_id);
CREATE INDEX idx_project_default_task_info_task    ON public.project_default_task_info (project_default_task_id);

CREATE TRIGGER set_project_default_task_info_updated_at
  BEFORE UPDATE ON public.project_default_task_info
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: project_default_task_info <-> users (assignees)
CREATE TABLE public.project_default_task_assignees (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_default_task_info_id UUID NOT NULL REFERENCES public.project_default_task_info (id) ON DELETE CASCADE,
  user_id                   UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  UNIQUE (project_default_task_info_id, user_id)
);

-- ============================================================
-- TABLE: work_orders
-- Source: Project.work_orders (ListField) — now a proper table
-- ============================================================
CREATE TABLE public.work_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name            TEXT,
  description     TEXT,
  status          TEXT,
  assigned_to_id  UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  notes           TEXT,
  extra_data      JSONB,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_orders_project ON public.work_orders (project_id);
CREATE INDEX idx_work_orders_status  ON public.work_orders (status);

CREATE TRIGGER set_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration 005: Project Tasks
-- Source: api_projects/models.py :: ProjectTask + related
-- ============================================================

-- ============================================================
-- TABLE: project_tasks
-- Source: ProjectTask
-- ============================================================
CREATE TABLE public.project_tasks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  number           TEXT        NOT NULL,
  description      TEXT,
  project_id       UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  user_reporter_id UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  current_stage_id UUID        REFERENCES public.project_task_stages (id) ON DELETE SET NULL,
  start_date       TIMESTAMPTZ,
  end_date         TIMESTAMPTZ,
  priority         TEXT,         -- e.g. 'low', 'medium', 'high', 'critical'
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_tasks_project ON public.project_tasks (project_id);
CREATE INDEX idx_project_tasks_stage   ON public.project_tasks (current_stage_id);
CREATE INDEX idx_project_tasks_active  ON public.project_tasks (is_active);

CREATE TRIGGER set_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: project_task <-> users (assignees)
CREATE TABLE public.project_task_assignees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_task_id UUID NOT NULL REFERENCES public.project_tasks (id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  UNIQUE (project_task_id, user_id)
);

CREATE INDEX idx_project_task_assignees_task ON public.project_task_assignees (project_task_id);
CREATE INDEX idx_project_task_assignees_user ON public.project_task_assignees (user_id);

-- ============================================================
-- TABLE: project_task_attachments
-- Source: ProjectTaskAttachment
-- ============================================================
CREATE TABLE public.project_task_attachments (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  description        TEXT,
  file_url           TEXT,
  due_project_stage_id UUID      REFERENCES public.project_stages (id) ON DELETE SET NULL,
  user_upload_id     UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  project_task_id    UUID        REFERENCES public.project_tasks (id) ON DELETE CASCADE,
  is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_task_attachments_task ON public.project_task_attachments (project_task_id);

CREATE TRIGGER set_project_task_attachments_updated_at
  BEFORE UPDATE ON public.project_task_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_task_history
-- Source: ProjectTaskHistory
-- ============================================================
CREATE TABLE public.project_task_history (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_task_id         UUID        NOT NULL REFERENCES public.project_tasks (id) ON DELETE CASCADE,
  user_involved_id        UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  project_stage_initial_id UUID       REFERENCES public.project_task_stages (id) ON DELETE SET NULL,
  project_stage_final_id   UUID       REFERENCES public.project_task_stages (id) ON DELETE SET NULL,
  initial_date            TIMESTAMPTZ,
  final_date              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_task_history_task ON public.project_task_history (project_task_id);

-- ============================================================
-- TABLE: project_task_comments
-- Source: ProjectTaskComment
-- ============================================================
CREATE TABLE public.project_task_comments (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment                  TEXT        NOT NULL,
  user_reporter_id         UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  project_id               UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  project_default_task_id  UUID        REFERENCES public.project_default_tasks (id) ON DELETE SET NULL,
  is_active                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_task_comments_project  ON public.project_task_comments (project_id);
CREATE INDEX idx_project_task_comments_reporter ON public.project_task_comments (user_reporter_id);

CREATE TRIGGER set_project_task_comments_updated_at
  BEFORE UPDATE ON public.project_task_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_task_comment_attachments
-- Source: ProjectTaskCommentAttachment
-- ============================================================
CREATE TABLE public.project_task_comment_attachments (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT        NOT NULL,
  file_url                TEXT,
  user_upload_id          UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  project_task_comment_id UUID        REFERENCES public.project_task_comments (id) ON DELETE CASCADE,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_task_comment_attachments_comment
  ON public.project_task_comment_attachments (project_task_comment_id);

CREATE TRIGGER set_project_task_comment_attachments_updated_at
  BEFORE UPDATE ON public.project_task_comment_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration 006: Project Attachments
-- Source: api_projects/models.py :: ProjectAttachment
-- ============================================================

-- ============================================================
-- TABLE: project_attachments
-- Source: ProjectAttachment
-- ============================================================
CREATE TABLE public.project_attachments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  description      TEXT,
  file_url         TEXT,
  project_id       UUID        REFERENCES public.projects (id) ON DELETE CASCADE,
  user_upload_id   UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  current_stage_id UUID        REFERENCES public.project_stages (id) ON DELETE SET NULL,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_attachments_project ON public.project_attachments (project_id);
CREATE INDEX idx_project_attachments_stage   ON public.project_attachments (current_stage_id);

CREATE TRIGGER set_project_attachments_updated_at
  BEFORE UPDATE ON public.project_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration 007: Project Notifications & Calendar Notes
-- Source: api_projects/models.py
-- ============================================================

-- ============================================================
-- TABLE: project_notifications
-- Source: ProjectNotification
-- ============================================================
CREATE TABLE public.project_notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module      TEXT,
  info        TEXT,
  info_id     TEXT,
  type        TEXT        NOT NULL DEFAULT 'load',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_notifications_module  ON public.project_notifications (module);
CREATE INDEX idx_project_notifications_info_id ON public.project_notifications (info_id);

CREATE TRIGGER set_project_notifications_updated_at
  BEFORE UPDATE ON public.project_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_notification_users
-- Source: ProjectNotificationUser
-- ============================================================
CREATE TABLE public.project_notification_users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id  UUID        NOT NULL REFERENCES public.project_notifications (id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  username         TEXT        NOT NULL,
  read             BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_notification_users_notification ON public.project_notification_users (notification_id);
CREATE INDEX idx_project_notification_users_user        ON public.project_notification_users (user_id);
CREATE INDEX idx_project_notification_users_read        ON public.project_notification_users (read);

CREATE TRIGGER set_project_notification_users_updated_at
  BEFORE UPDATE ON public.project_notification_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_calendar_notes
-- Source: ProjectCalendarNotes
-- ============================================================
CREATE TABLE public.project_calendar_notes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  description       TEXT,
  start_date        TIMESTAMPTZ,
  end_date          TIMESTAMPTZ,
  duration          INTEGER,
  user_manager_id   UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  user_installer_id UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  user_reporter_id  UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_calendar_notes_start_date ON public.project_calendar_notes (start_date);
CREATE INDEX idx_project_calendar_notes_is_active  ON public.project_calendar_notes (is_active);

CREATE TRIGGER set_project_calendar_notes_updated_at
  BEFORE UPDATE ON public.project_calendar_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: calendar_notes <-> users (user_assignees)
CREATE TABLE public.project_calendar_note_assignees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_note_id UUID NOT NULL REFERENCES public.project_calendar_notes (id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  UNIQUE (calendar_note_id, user_id)
);

CREATE INDEX idx_project_calendar_note_assignees_note ON public.project_calendar_note_assignees (calendar_note_id);

-- Junction: calendar_notes <-> projects (associated_events)
CREATE TABLE public.project_calendar_note_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_note_id UUID NOT NULL REFERENCES public.project_calendar_notes (id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  UNIQUE (calendar_note_id, project_id)
);

CREATE INDEX idx_project_calendar_note_events_note    ON public.project_calendar_note_events (calendar_note_id);
CREATE INDEX idx_project_calendar_note_events_project ON public.project_calendar_note_events (project_id);
-- ============================================================
-- Migration 008: Project Extras
-- Installation Crews, Profit Reports, Reminders, Tracking
-- Source: api_projects/models.py
-- ============================================================

-- ============================================================
-- TABLE: project_installation_crews
-- Source: ProjectInstallationCrew
-- ============================================================
CREATE TABLE public.project_installation_crews (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  cost_by_unit    NUMERIC(12,2),
  unit            JSONB,        -- DynamicField: unit object
  type_crew       JSONB,        -- DynamicField: crew type object
  type_working    JSONB,        -- DynamicField: working type object
  description     TEXT,
  user_reporter_id UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_installation_crews_is_active ON public.project_installation_crews (is_active);

CREATE TRIGGER set_project_installation_crews_updated_at
  BEFORE UPDATE ON public.project_installation_crews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: installation_crew <-> users (installers)
CREATE TABLE public.project_installation_crew_installers (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id   UUID NOT NULL REFERENCES public.project_installation_crews (id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  UNIQUE (crew_id, user_id)
);

-- Junction: installation_crew <-> users (helpers)
CREATE TABLE public.project_installation_crew_helpers (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id   UUID NOT NULL REFERENCES public.project_installation_crews (id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  UNIQUE (crew_id, user_id)
);

-- ============================================================
-- TABLE: project_profit_reports
-- Source: ProjectProfitReport
-- ============================================================
CREATE TABLE public.project_profit_reports (
  id                               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                       UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  project_info                     JSONB       NOT NULL DEFAULT '{}',
  project_amount                   NUMERIC(14,2),
  installation_amount              NUMERIC(14,2),
  installation_cost_subcontractor  NUMERIC(14,2),
  installation_cost_onhouse        NUMERIC(14,2),
  installation_profit_subcontractor NUMERIC(14,2),
  installation_profit_onhouse      NUMERIC(14,2),
  notes                            TEXT,
  has_been_edited                  BOOLEAN     NOT NULL DEFAULT FALSE,
  working_type                     TEXT,
  created_at                       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_profit_reports_project ON public.project_profit_reports (project_id);

CREATE TRIGGER set_project_profit_reports_updated_at
  BEFORE UPDATE ON public.project_profit_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_reminders
-- Source: ProjectReminder
-- ============================================================
CREATE TABLE public.project_reminders (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_reporter_id        UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  project_id              UUID        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  project_default_task_id UUID        REFERENCES public.project_default_tasks (id) ON DELETE SET NULL,
  notes                   TEXT,
  date                    TIMESTAMPTZ,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_reminders_project  ON public.project_reminders (project_id);
CREATE INDEX idx_project_reminders_user     ON public.project_reminders (user_reporter_id);
CREATE INDEX idx_project_reminders_date     ON public.project_reminders (date);

CREATE TRIGGER set_project_reminders_updated_at
  BEFORE UPDATE ON public.project_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: project_tracking
-- Source: ProjectTracking
-- ============================================================
CREATE TABLE public.project_tracking (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_reporter_id UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  action           TEXT        NOT NULL,
  managed_data     JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_tracking_user   ON public.project_tracking (user_reporter_id);
CREATE INDEX idx_project_tracking_action ON public.project_tracking (action);
CREATE INDEX idx_project_tracking_date   ON public.project_tracking (created_at);
-- ============================================================
-- Migration 009: Services Module
-- Source: api_services/models.py
-- ============================================================

-- ============================================================
-- TABLE: service_default_tasks
-- Source: ServiceDefaultTask
-- ============================================================
CREATE TABLE public.service_default_tasks (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT        NOT NULL,
  number                TEXT,
  description           TEXT,
  "order"               INTEGER,
  service_stage_id      UUID        REFERENCES public.service_stages (id) ON DELETE SET NULL,
  service_stage_status  TEXT,
  has_attachments       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_default_tasks_stage ON public.service_default_tasks (service_stage_id);
CREATE INDEX idx_service_default_tasks_order ON public.service_default_tasks ("order");

CREATE TRIGGER set_service_default_tasks_updated_at
  BEFORE UPDATE ON public.service_default_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: services
-- Source: Service
-- ============================================================
CREATE TABLE public.services (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  number           TEXT        NOT NULL UNIQUE,
  name             TEXT        NOT NULL,
  version          INTEGER     DEFAULT 1,
  sales_order_id   UUID        REFERENCES public.zoho_sales_orders (id) ON DELETE SET NULL,
  reference_number TEXT,
  phone            TEXT,
  user_reporter_id UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  user_manager_id  UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  created_by_id    UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  current_stage_id UUID        REFERENCES public.service_stages (id) ON DELETE SET NULL,
  start_date       TIMESTAMPTZ,
  end_date         TIMESTAMPTZ,
  duration         INTEGER,
  address          TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  service_type     TEXT,
  -- service_place stored as JSONB (DynamicField in original)
  service_place    JSONB,
  service_notes    TEXT,
  has_to_pay       BOOLEAN     NOT NULL DEFAULT FALSE,
  paid             BOOLEAN     NOT NULL DEFAULT FALSE,
  by_factory       BOOLEAN     NOT NULL DEFAULT FALSE,
  repaired         BOOLEAN     NOT NULL DEFAULT FALSE,
  is_part_days     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_closed        BOOLEAN     NOT NULL DEFAULT FALSE,
  -- issued_products is a complex embedded list, stored as JSONB
  issued_products  JSONB       DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_number          ON public.services (number);
CREATE INDEX idx_services_user_reporter   ON public.services (user_reporter_id);
CREATE INDEX idx_services_user_manager    ON public.services (user_manager_id);
CREATE INDEX idx_services_current_stage   ON public.services (current_stage_id);
CREATE INDEX idx_services_sales_order     ON public.services (sales_order_id);
CREATE INDEX idx_services_is_active       ON public.services (is_active);
CREATE INDEX idx_services_is_closed       ON public.services (is_closed);
CREATE INDEX idx_services_start_date      ON public.services (start_date);

CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Junction: service <-> users (assignees)
CREATE TABLE public.service_assignees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  UNIQUE (service_id, user_id)
);

-- Junction: service <-> users (service_team)
CREATE TABLE public.service_team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  UNIQUE (service_id, user_id)
);

-- ============================================================
-- TABLE: service_stage_history
-- Source: Service.stage_history (ListField)
-- ============================================================
CREATE TABLE public.service_stage_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID        NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  stage_id    UUID        REFERENCES public.service_stages (id) ON DELETE SET NULL,
  user_id     UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes       TEXT
);

CREATE INDEX idx_service_stage_history_service ON public.service_stage_history (service_id);

-- ============================================================
-- TABLE: service_attachments
-- Source: ServiceAttachment
-- ============================================================
CREATE TABLE public.service_attachments (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT        NOT NULL,
  description              TEXT,
  file_url                 TEXT,
  service_id               UUID        REFERENCES public.services (id) ON DELETE CASCADE,
  user_upload_id           UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  current_stage_id         UUID        REFERENCES public.service_stages (id) ON DELETE SET NULL,
  service_default_task_id  UUID        REFERENCES public.service_default_tasks (id) ON DELETE SET NULL,
  attachment_type          TEXT,
  is_active                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_attachments_service ON public.service_attachments (service_id);

CREATE TRIGGER set_service_attachments_updated_at
  BEFORE UPDATE ON public.service_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: service_task_comments
-- Source: ServiceTaskComment
-- ============================================================
CREATE TABLE public.service_task_comments (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment                  TEXT        NOT NULL,
  user_reporter_id         UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  service_id               UUID        NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  service_default_task_id  UUID        REFERENCES public.service_default_tasks (id) ON DELETE SET NULL,
  -- Attachments for this comment stored as JSONB (file list)
  comment_attachments      JSONB       DEFAULT '[]',
  is_active                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_task_comments_service  ON public.service_task_comments (service_id);
CREATE INDEX idx_service_task_comments_reporter ON public.service_task_comments (user_reporter_id);

CREATE TRIGGER set_service_task_comments_updated_at
  BEFORE UPDATE ON public.service_task_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: service_default_task_info
-- (Per-service instance of a service default task)
-- ============================================================
CREATE TABLE public.service_default_task_info (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_default_task_id  UUID        NOT NULL REFERENCES public.service_default_tasks (id) ON DELETE CASCADE,
  service_id               UUID        NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  status                   TEXT,
  percentage               NUMERIC(5,2),
  is_active                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_default_task_id, service_id)
);

CREATE INDEX idx_service_default_task_info_service ON public.service_default_task_info (service_id);

CREATE TRIGGER set_service_default_task_info_updated_at
  BEFORE UPDATE ON public.service_default_task_info
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration 010: Measurements Module
-- Source: api_measurements/models.py
-- ============================================================

-- ============================================================
-- TABLE: measurements
-- Source: Measurement
-- ============================================================
CREATE TABLE public.measurements (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  number            TEXT        NOT NULL UNIQUE,
  sales_order_id    UUID        REFERENCES public.zoho_sales_orders (id) ON DELETE SET NULL,
  -- customer, service, project stored as JSONB (DynamicField references)
  customer          JSONB,
  service           JSONB,
  project           JSONB,
  user_reporter_id  UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  user_manager_id   UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  phone             TEXT,
  address           TEXT,
  color             JSONB,       -- DynamicField: color object
  marks             JSONB        DEFAULT '[]',  -- ListField(DynamicField)
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  first_date        TIMESTAMPTZ,
  check_date        TIMESTAMPTZ,
  first_assignee_id UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  check_assignee_id UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  general_notes     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_measurements_number          ON public.measurements (number);
CREATE INDEX idx_measurements_user_reporter   ON public.measurements (user_reporter_id);
CREATE INDEX idx_measurements_is_active       ON public.measurements (is_active);
CREATE INDEX idx_measurements_first_date      ON public.measurements (first_date);

CREATE TRIGGER set_measurements_updated_at
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: measurement_attachments
-- Source: MesurementAttachment (sic — typo preserved as note)
-- ============================================================
CREATE TABLE public.measurement_attachments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  description      TEXT,
  file_url         TEXT,
  measurement_id   UUID        REFERENCES public.measurements (id) ON DELETE CASCADE,
  user_upload_id   UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_measurement_attachments_measurement ON public.measurement_attachments (measurement_id);

CREATE TRIGGER set_measurement_attachments_updated_at
  BEFORE UPDATE ON public.measurement_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: measurement_comments
-- Source: MeasurementComment
-- ============================================================
CREATE TABLE public.measurement_comments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment           TEXT        NOT NULL,
  user_reporter_id  UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  measurement_id    UUID        NOT NULL REFERENCES public.measurements (id) ON DELETE CASCADE,
  -- measurement_default_task_comment_attachments stored as JSONB
  comment_attachments JSONB     DEFAULT '[]',
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_measurement_comments_measurement ON public.measurement_comments (measurement_id);
CREATE INDEX idx_measurement_comments_reporter    ON public.measurement_comments (user_reporter_id);

CREATE TRIGGER set_measurement_comments_updated_at
  BEFORE UPDATE ON public.measurement_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration 011: Task Timers
-- Source: api_projects/models_extra.py :: TaskTimer
-- ============================================================

CREATE TABLE public.task_timers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Original used username; we use user_id FK for relational integrity
  user_id     UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  entity_type TEXT,         -- e.g. 'project_task', 'project_default_task', 'service_task'
  entity_id   UUID        NOT NULL,
  entity_info JSONB,        -- snapshot of entity at timer creation
  elapsed_ms  BIGINT      NOT NULL DEFAULT 0,
  start_time  TIMESTAMPTZ,
  is_running  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_timers_user        ON public.task_timers (user_id);
CREATE INDEX idx_task_timers_entity      ON public.task_timers (entity_id);
CREATE INDEX idx_task_timers_is_running  ON public.task_timers (is_running);

CREATE TRIGGER set_task_timers_updated_at
  BEFORE UPDATE ON public.task_timers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Migration 012: Row Level Security Policies
-- Enables RLS and defines access rules per table
-- ============================================================

-- ============================================================
-- HELPER: returns the current user's id from auth.users
-- ============================================================
-- (built-in: auth.uid())

-- ============================================================
-- HELPER: returns true if the current user is staff
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_staff FROM public.users WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.users                              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revoked_tokens                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_stages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_roles                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_permissions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_guide_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_material_guide_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_stages                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_issues                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_customers                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_sales_orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stage_history              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_user_permissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_guide_products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_task_info          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_task_assignees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_assignees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_attachments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_history               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_comment_attachments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notification_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_calendar_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_calendar_note_assignees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_calendar_note_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_installation_crews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_installation_crew_installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_installation_crew_helpers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_profit_reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reminders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tracking                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_default_tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_assignees                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_team_members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_stage_history              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_attachments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_task_comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_default_task_info          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_attachments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_timers                        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY: users — can read all active users; update own record
-- ============================================================
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Staff can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

-- ============================================================
-- POLICY: reference / lookup tables — readable by all authenticated
-- ============================================================
-- Apply SELECT-only policy to lookup tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_roles', 'project_stages', 'project_task_stages', 'project_roles',
    'project_permissions', 'service_stages', 'service_issues',
    'project_default_guide_products', 'project_default_materials',
    'project_default_material_guide_products', 'project_default_tasks',
    'service_default_tasks'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated can view %I" ON public.%I FOR SELECT TO authenticated USING (TRUE)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Staff can manage %I" ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- POLICY: projects — accessible to project members + staff
-- ============================================================
CREATE POLICY "Users can view projects they belong to"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
    OR user_installer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_users pu
      WHERE pu.project_id = id AND pu.user_id = auth.uid() AND pu.is_active = TRUE
    )
  );

CREATE POLICY "Staff and managers can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid());

CREATE POLICY "Staff and managers can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
  )
  WITH CHECK (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
  );

-- ============================================================
-- POLICY: services — similar to projects
-- ============================================================
CREATE POLICY "Users can view services they belong to"
  ON public.services FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.service_assignees sa
      WHERE sa.service_id = id AND sa.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff and reporters can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid());

CREATE POLICY "Staff and managers can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid())
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid());

-- ============================================================
-- POLICY: measurements — reporter + manager + staff
-- ============================================================
CREATE POLICY "Users can view own measurements"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
    OR first_assignee_id = auth.uid()
    OR check_assignee_id = auth.uid()
  );

CREATE POLICY "Authenticated users can insert measurements"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (user_reporter_id = auth.uid() OR public.is_staff());

CREATE POLICY "Reporters and managers can update measurements"
  ON public.measurements FOR UPDATE
  TO authenticated
  USING (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid())
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid());

-- ============================================================
-- POLICY: task_timers — own timers only
-- ============================================================
CREATE POLICY "Users can view own timers"
  ON public.task_timers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Users can manage own timers"
  ON public.task_timers FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- POLICY: notifications — users see their own
-- ============================================================
CREATE POLICY "Users see their own notification items"
  ON public.project_notification_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Staff see all notifications"
  ON public.project_notifications FOR SELECT
  TO authenticated
  USING (TRUE);

-- ============================================================
-- POLICY: Zoho data — read-only for all authenticated
-- ============================================================
CREATE POLICY "Authenticated can view zoho customers"
  ON public.zoho_customers FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Staff can manage zoho customers"
  ON public.zoho_customers FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "Authenticated can view zoho sales orders"
  ON public.zoho_sales_orders FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Staff can manage zoho sales orders"
  ON public.zoho_sales_orders FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============================================================
-- POLICY: reminders — own only
-- ============================================================
CREATE POLICY "Users manage own reminders"
  ON public.project_reminders FOR ALL
  TO authenticated
  USING (user_reporter_id = auth.uid() OR public.is_staff())
  WITH CHECK (user_reporter_id = auth.uid() OR public.is_staff());

-- ============================================================
-- POLICY: profit reports — staff only
-- ============================================================
CREATE POLICY "Staff manage profit reports"
  ON public.project_profit_reports FOR ALL
  TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============================================================
-- Broad SELECT policy for child tables (project members see related rows)
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'project_stage_history', 'project_users', 'project_user_permissions',
    'project_materials', 'project_guide_products', 'project_default_task_info',
    'project_default_task_assignees', 'work_orders',
    'project_tasks', 'project_task_assignees', 'project_task_attachments',
    'project_task_history', 'project_task_comments', 'project_task_comment_attachments',
    'project_attachments', 'project_calendar_notes', 'project_calendar_note_assignees',
    'project_calendar_note_events', 'project_installation_crews',
    'project_installation_crew_installers', 'project_installation_crew_helpers',
    'project_tracking',
    'service_assignees', 'service_team_members', 'service_stage_history',
    'service_attachments', 'service_task_comments', 'service_default_task_info',
    'measurement_attachments', 'measurement_comments'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated can view %I" ON public.%I FOR SELECT TO authenticated USING (TRUE)',
      t, t
    );
  END LOOP;
END;
$$;
-- ============================================================
-- Migration 013: Utility Functions & Triggers
-- ============================================================

-- ============================================================
-- FUNCTION: auto-track project stage changes
-- Inserts a row in project_stage_history when current_stage_id changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_project_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
    INSERT INTO public.project_stage_history (project_id, stage_id, user_id)
    VALUES (NEW.id, NEW.current_stage_id, NEW.user_reporter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_stage_changed
  AFTER UPDATE OF current_stage_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.track_project_stage_change();

-- ============================================================
-- FUNCTION: auto-track service stage changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_service_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
    INSERT INTO public.service_stage_history (service_id, stage_id, user_id)
    VALUES (NEW.id, NEW.current_stage_id, NEW.user_reporter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_service_stage_changed
  AFTER UPDATE OF current_stage_id ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.track_service_stage_change();

-- ============================================================
-- FUNCTION: get_elapsed_ms(timer_id)
-- Returns current elapsed ms for a timer (including live time if running)
-- Mirrors TaskTimer.get_current_elapsed_ms() in Python
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_elapsed_ms(p_timer_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
BEGIN
  SELECT * INTO v_timer FROM public.task_timers WHERE id = p_timer_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_timer.is_running AND v_timer.start_time IS NOT NULL THEN
    RETURN v_timer.elapsed_ms +
      EXTRACT(EPOCH FROM (NOW() - v_timer.start_time)) * 1000;
  ELSE
    RETURN v_timer.elapsed_ms;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: start_timer(timer_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_timer(p_timer_id UUID)
RETURNS public.task_timers AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
BEGIN
  UPDATE public.task_timers
  SET is_running = TRUE,
      start_time = NOW(),
      updated_at = NOW()
  WHERE id = p_timer_id AND is_running = FALSE
  RETURNING * INTO v_timer;

  RETURN v_timer;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: pause_timer(timer_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.pause_timer(p_timer_id UUID)
RETURNS public.task_timers AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
  v_extra_ms BIGINT;
BEGIN
  SELECT * INTO v_timer FROM public.task_timers WHERE id = p_timer_id;

  IF v_timer.is_running AND v_timer.start_time IS NOT NULL THEN
    v_extra_ms := EXTRACT(EPOCH FROM (NOW() - v_timer.start_time)) * 1000;

    UPDATE public.task_timers
    SET is_running = FALSE,
        elapsed_ms = elapsed_ms + v_extra_ms,
        start_time = NULL,
        updated_at = NOW()
    WHERE id = p_timer_id
    RETURNING * INTO v_timer;
  END IF;

  RETURN v_timer;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: reset_timer(timer_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_timer(p_timer_id UUID)
RETURNS public.task_timers AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
BEGIN
  UPDATE public.task_timers
  SET is_running = FALSE,
      elapsed_ms = 0,
      start_time = NULL,
      updated_at = NOW()
  WHERE id = p_timer_id
  RETURNING * INTO v_timer;

  RETURN v_timer;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: create_project_notification(module, info, info_id, type, user_ids)
-- Helper to insert notification + notification_user rows in one call
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_project_notification(
  p_module   TEXT,
  p_info     TEXT,
  p_info_id  TEXT,
  p_type     TEXT,
  p_user_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_user_id         UUID;
  v_username        TEXT;
BEGIN
  INSERT INTO public.project_notifications (module, info, info_id, type)
  VALUES (p_module, p_info, p_info_id, p_type)
  RETURNING id INTO v_notification_id;

  FOREACH v_user_id IN ARRAY p_user_ids LOOP
    SELECT username INTO v_username FROM public.users WHERE id = v_user_id;
    IF FOUND THEN
      INSERT INTO public.project_notification_users (notification_id, user_id, username)
      VALUES (v_notification_id, v_user_id, v_username)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: get_project_stats(project_id)
-- Returns aggregated stats for a project
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_project_stats(p_project_id UUID)
RETURNS TABLE (
  total_tasks     BIGINT,
  active_tasks    BIGINT,
  total_materials BIGINT,
  total_comments  BIGINT,
  team_size       BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = p_project_id) AS total_tasks,
    (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = p_project_id AND is_active = TRUE) AS active_tasks,
    (SELECT COUNT(*) FROM public.project_materials WHERE project_id = p_project_id AND is_active = TRUE) AS total_materials,
    (SELECT COUNT(*) FROM public.project_task_comments WHERE project_id = p_project_id AND is_active = TRUE) AS total_comments,
    (SELECT COUNT(*) FROM public.project_users WHERE project_id = p_project_id AND is_active = TRUE) AS team_size;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- VIEW: project_summary (non-materialized, safe for RLS)
-- ============================================================
CREATE OR REPLACE VIEW public.project_summary AS
SELECT
  p.id,
  p.name,
  p.number,
  p.address,
  p.phone,
  p.start_date,
  p.end_date,
  p.is_active,
  p.is_part_days,
  p.inspection_date,
  ps.name AS stage_name,
  um.first_name || ' ' || um.last_name AS manager_name,
  ur.first_name || ' ' || ur.last_name AS reporter_name,
  (SELECT COUNT(*) FROM public.project_tasks pt WHERE pt.project_id = p.id AND pt.is_active = TRUE) AS active_task_count,
  (SELECT COUNT(*) FROM public.project_users pu WHERE pu.project_id = p.id AND pu.is_active = TRUE) AS team_size,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.project_stages ps ON p.current_stage_id = ps.id
LEFT JOIN public.users um ON p.user_manager_id = um.id
LEFT JOIN public.users ur ON p.user_reporter_id = ur.id;

-- ============================================================
-- VIEW: service_summary
-- ============================================================
CREATE OR REPLACE VIEW public.service_summary AS
SELECT
  s.id,
  s.name,
  s.number,
  s.address,
  s.service_type,
  s.start_date,
  s.end_date,
  s.is_active,
  s.is_closed,
  s.paid,
  ss.name AS stage_name,
  um.first_name || ' ' || um.last_name AS manager_name,
  ur.first_name || ' ' || ur.last_name AS reporter_name,
  s.created_at,
  s.updated_at
FROM public.services s
LEFT JOIN public.service_stages ss ON s.current_stage_id = ss.id
LEFT JOIN public.users um ON s.user_manager_id = um.id
LEFT JOIN public.users ur ON s.user_reporter_id = ur.id;
