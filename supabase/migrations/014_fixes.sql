-- ============================================================
-- Migration 014: Fix missing columns and schema gaps
-- Identified by full model-by-model comparison
-- ============================================================

-- ============================================================
-- users: add last_login (LoginUser.last_login)
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- ============================================================
-- services: add client (Service.client — DynamicField)
-- ============================================================
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS client JSONB;

-- ============================================================
-- project_attachments: add attachment_type (ProjectAttachment.attachment_type)
-- Values seen in data: 'issued', 'repair'
-- ============================================================
ALTER TABLE public.project_attachments
  ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- ============================================================
-- zoho_sales_orders: add zoho_org_id and customer fields
-- Present in embedded sales order objects in project/service docs
-- ============================================================
ALTER TABLE public.zoho_sales_orders
  ADD COLUMN IF NOT EXISTS zoho_org_id TEXT,
  ADD COLUMN IF NOT EXISTS customer    JSONB;

-- ============================================================
-- project_stage_history: add initial_stage_id
-- MongoDB project.project_history has both initial + final stages
-- ============================================================
ALTER TABLE public.project_stage_history
  ADD COLUMN IF NOT EXISTS initial_stage_id UUID REFERENCES public.project_stages (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_stage_history_initial
  ON public.project_stage_history (initial_stage_id);

-- ============================================================
-- service_stage_history: add initial_stage_id
-- MongoDB service.service_history has both initial + final stages
-- ============================================================
ALTER TABLE public.service_stage_history
  ADD COLUMN IF NOT EXISTS initial_stage_id UUID REFERENCES public.service_stages (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_service_stage_history_initial
  ON public.service_stage_history (initial_stage_id);

-- ============================================================
-- measurement_comments: add measurement_default_task (JSONB)
-- No measurement_default_tasks table exists; store raw ref
-- ============================================================
ALTER TABLE public.measurement_comments
  ADD COLUMN IF NOT EXISTS measurement_default_task JSONB;
