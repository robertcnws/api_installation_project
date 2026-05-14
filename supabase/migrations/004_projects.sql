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
