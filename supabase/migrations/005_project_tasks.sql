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
