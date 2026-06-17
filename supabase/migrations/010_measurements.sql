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
