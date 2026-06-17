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
