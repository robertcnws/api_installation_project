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
