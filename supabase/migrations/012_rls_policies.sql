-- ============================================================
-- Migration 012: Row Level Security Policies
-- Enables RLS and defines access rules per table
-- ============================================================

-- ============================================================
-- HELPER: returns the current user's id from auth.users
-- ============================================================
-- (built-in: auth.uid())

-- ============================================================
-- HELPER: returns true if the current user is staff
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_staff FROM public.users WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.users                              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revoked_tokens                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_stages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_roles                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_permissions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_guide_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_material_guide_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_stages                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_issues                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_customers                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_sales_orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stage_history              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_user_permissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_guide_products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_task_info          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_default_task_assignees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_assignees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_attachments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_history               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_comment_attachments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notification_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_calendar_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_calendar_note_assignees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_calendar_note_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_installation_crews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_installation_crew_installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_installation_crew_helpers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_profit_reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reminders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tracking                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_default_tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_assignees                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_team_members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_stage_history              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_attachments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_task_comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_default_task_info          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_attachments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_timers                        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY: users — can read all active users; update own record
-- ============================================================
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Staff can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

-- ============================================================
-- POLICY: reference / lookup tables — readable by all authenticated
-- ============================================================
-- Apply SELECT-only policy to lookup tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_roles', 'project_stages', 'project_task_stages', 'project_roles',
    'project_permissions', 'service_stages', 'service_issues',
    'project_default_guide_products', 'project_default_materials',
    'project_default_material_guide_products', 'project_default_tasks',
    'service_default_tasks'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated can view %I" ON public.%I FOR SELECT TO authenticated USING (TRUE)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Staff can manage %I" ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- POLICY: projects — accessible to project members + staff
-- ============================================================
CREATE POLICY "Users can view projects they belong to"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
    OR user_installer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_users pu
      WHERE pu.project_id = id AND pu.user_id = auth.uid() AND pu.is_active = TRUE
    )
  );

CREATE POLICY "Staff and managers can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid());

CREATE POLICY "Staff and managers can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
  )
  WITH CHECK (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
  );

-- ============================================================
-- POLICY: services — similar to projects
-- ============================================================
CREATE POLICY "Users can view services they belong to"
  ON public.services FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.service_assignees sa
      WHERE sa.service_id = id AND sa.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff and reporters can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid());

CREATE POLICY "Staff and managers can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid())
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid());

-- ============================================================
-- POLICY: measurements — reporter + manager + staff
-- ============================================================
CREATE POLICY "Users can view own measurements"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR user_reporter_id = auth.uid()
    OR user_manager_id = auth.uid()
    OR first_assignee_id = auth.uid()
    OR check_assignee_id = auth.uid()
  );

CREATE POLICY "Authenticated users can insert measurements"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (user_reporter_id = auth.uid() OR public.is_staff());

CREATE POLICY "Reporters and managers can update measurements"
  ON public.measurements FOR UPDATE
  TO authenticated
  USING (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid())
  WITH CHECK (public.is_staff() OR user_reporter_id = auth.uid() OR user_manager_id = auth.uid());

-- ============================================================
-- POLICY: task_timers — own timers only
-- ============================================================
CREATE POLICY "Users can view own timers"
  ON public.task_timers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Users can manage own timers"
  ON public.task_timers FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- POLICY: notifications — users see their own
-- ============================================================
CREATE POLICY "Users see their own notification items"
  ON public.project_notification_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Staff see all notifications"
  ON public.project_notifications FOR SELECT
  TO authenticated
  USING (TRUE);

-- ============================================================
-- POLICY: Zoho data — read-only for all authenticated
-- ============================================================
CREATE POLICY "Authenticated can view zoho customers"
  ON public.zoho_customers FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Staff can manage zoho customers"
  ON public.zoho_customers FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "Authenticated can view zoho sales orders"
  ON public.zoho_sales_orders FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Staff can manage zoho sales orders"
  ON public.zoho_sales_orders FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============================================================
-- POLICY: reminders — own only
-- ============================================================
CREATE POLICY "Users manage own reminders"
  ON public.project_reminders FOR ALL
  TO authenticated
  USING (user_reporter_id = auth.uid() OR public.is_staff())
  WITH CHECK (user_reporter_id = auth.uid() OR public.is_staff());

-- ============================================================
-- POLICY: profit reports — staff only
-- ============================================================
CREATE POLICY "Staff manage profit reports"
  ON public.project_profit_reports FOR ALL
  TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============================================================
-- Broad SELECT policy for child tables (project members see related rows)
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'project_stage_history', 'project_users', 'project_user_permissions',
    'project_materials', 'project_guide_products', 'project_default_task_info',
    'project_default_task_assignees', 'work_orders',
    'project_tasks', 'project_task_assignees', 'project_task_attachments',
    'project_task_history', 'project_task_comments', 'project_task_comment_attachments',
    'project_attachments', 'project_calendar_notes', 'project_calendar_note_assignees',
    'project_calendar_note_events', 'project_installation_crews',
    'project_installation_crew_installers', 'project_installation_crew_helpers',
    'project_tracking',
    'service_assignees', 'service_team_members', 'service_stage_history',
    'service_attachments', 'service_task_comments', 'service_default_task_info',
    'measurement_attachments', 'measurement_comments'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated can view %I" ON public.%I FOR SELECT TO authenticated USING (TRUE)',
      t, t
    );
  END LOOP;
END;
$$;
