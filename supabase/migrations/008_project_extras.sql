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
