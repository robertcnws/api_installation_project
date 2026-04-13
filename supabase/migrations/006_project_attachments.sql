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
