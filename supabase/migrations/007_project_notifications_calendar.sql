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
