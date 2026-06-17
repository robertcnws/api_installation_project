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
