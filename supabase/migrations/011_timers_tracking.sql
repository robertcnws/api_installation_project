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
