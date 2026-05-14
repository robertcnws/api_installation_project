-- ============================================================
-- Migration 013: Utility Functions & Triggers
-- ============================================================

-- ============================================================
-- FUNCTION: auto-track project stage changes
-- Inserts a row in project_stage_history when current_stage_id changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_project_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
    INSERT INTO public.project_stage_history (project_id, stage_id, user_id)
    VALUES (NEW.id, NEW.current_stage_id, NEW.user_reporter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_stage_changed
  AFTER UPDATE OF current_stage_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.track_project_stage_change();

-- ============================================================
-- FUNCTION: auto-track service stage changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_service_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
    INSERT INTO public.service_stage_history (service_id, stage_id, user_id)
    VALUES (NEW.id, NEW.current_stage_id, NEW.user_reporter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_service_stage_changed
  AFTER UPDATE OF current_stage_id ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.track_service_stage_change();

-- ============================================================
-- FUNCTION: get_elapsed_ms(timer_id)
-- Returns current elapsed ms for a timer (including live time if running)
-- Mirrors TaskTimer.get_current_elapsed_ms() in Python
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_elapsed_ms(p_timer_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
BEGIN
  SELECT * INTO v_timer FROM public.task_timers WHERE id = p_timer_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_timer.is_running AND v_timer.start_time IS NOT NULL THEN
    RETURN v_timer.elapsed_ms +
      EXTRACT(EPOCH FROM (NOW() - v_timer.start_time)) * 1000;
  ELSE
    RETURN v_timer.elapsed_ms;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: start_timer(timer_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_timer(p_timer_id UUID)
RETURNS public.task_timers AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
BEGIN
  UPDATE public.task_timers
  SET is_running = TRUE,
      start_time = NOW(),
      updated_at = NOW()
  WHERE id = p_timer_id AND is_running = FALSE
  RETURNING * INTO v_timer;

  RETURN v_timer;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: pause_timer(timer_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.pause_timer(p_timer_id UUID)
RETURNS public.task_timers AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
  v_extra_ms BIGINT;
BEGIN
  SELECT * INTO v_timer FROM public.task_timers WHERE id = p_timer_id;

  IF v_timer.is_running AND v_timer.start_time IS NOT NULL THEN
    v_extra_ms := EXTRACT(EPOCH FROM (NOW() - v_timer.start_time)) * 1000;

    UPDATE public.task_timers
    SET is_running = FALSE,
        elapsed_ms = elapsed_ms + v_extra_ms,
        start_time = NULL,
        updated_at = NOW()
    WHERE id = p_timer_id
    RETURNING * INTO v_timer;
  END IF;

  RETURN v_timer;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: reset_timer(timer_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_timer(p_timer_id UUID)
RETURNS public.task_timers AS $$
DECLARE
  v_timer public.task_timers%ROWTYPE;
BEGIN
  UPDATE public.task_timers
  SET is_running = FALSE,
      elapsed_ms = 0,
      start_time = NULL,
      updated_at = NOW()
  WHERE id = p_timer_id
  RETURNING * INTO v_timer;

  RETURN v_timer;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: create_project_notification(module, info, info_id, type, user_ids)
-- Helper to insert notification + notification_user rows in one call
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_project_notification(
  p_module   TEXT,
  p_info     TEXT,
  p_info_id  TEXT,
  p_type     TEXT,
  p_user_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_user_id         UUID;
  v_username        TEXT;
BEGIN
  INSERT INTO public.project_notifications (module, info, info_id, type)
  VALUES (p_module, p_info, p_info_id, p_type)
  RETURNING id INTO v_notification_id;

  FOREACH v_user_id IN ARRAY p_user_ids LOOP
    SELECT username INTO v_username FROM public.users WHERE id = v_user_id;
    IF FOUND THEN
      INSERT INTO public.project_notification_users (notification_id, user_id, username)
      VALUES (v_notification_id, v_user_id, v_username)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: get_project_stats(project_id)
-- Returns aggregated stats for a project
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_project_stats(p_project_id UUID)
RETURNS TABLE (
  total_tasks     BIGINT,
  active_tasks    BIGINT,
  total_materials BIGINT,
  total_comments  BIGINT,
  team_size       BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = p_project_id) AS total_tasks,
    (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = p_project_id AND is_active = TRUE) AS active_tasks,
    (SELECT COUNT(*) FROM public.project_materials WHERE project_id = p_project_id AND is_active = TRUE) AS total_materials,
    (SELECT COUNT(*) FROM public.project_task_comments WHERE project_id = p_project_id AND is_active = TRUE) AS total_comments,
    (SELECT COUNT(*) FROM public.project_users WHERE project_id = p_project_id AND is_active = TRUE) AS team_size;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- VIEW: project_summary (non-materialized, safe for RLS)
-- ============================================================
CREATE OR REPLACE VIEW public.project_summary AS
SELECT
  p.id,
  p.name,
  p.number,
  p.address,
  p.phone,
  p.start_date,
  p.end_date,
  p.is_active,
  p.is_part_days,
  p.inspection_date,
  ps.name AS stage_name,
  um.first_name || ' ' || um.last_name AS manager_name,
  ur.first_name || ' ' || ur.last_name AS reporter_name,
  (SELECT COUNT(*) FROM public.project_tasks pt WHERE pt.project_id = p.id AND pt.is_active = TRUE) AS active_task_count,
  (SELECT COUNT(*) FROM public.project_users pu WHERE pu.project_id = p.id AND pu.is_active = TRUE) AS team_size,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.project_stages ps ON p.current_stage_id = ps.id
LEFT JOIN public.users um ON p.user_manager_id = um.id
LEFT JOIN public.users ur ON p.user_reporter_id = ur.id;

-- ============================================================
-- VIEW: service_summary
-- ============================================================
CREATE OR REPLACE VIEW public.service_summary AS
SELECT
  s.id,
  s.name,
  s.number,
  s.address,
  s.service_type,
  s.start_date,
  s.end_date,
  s.is_active,
  s.is_closed,
  s.paid,
  ss.name AS stage_name,
  um.first_name || ' ' || um.last_name AS manager_name,
  ur.first_name || ' ' || ur.last_name AS reporter_name,
  s.created_at,
  s.updated_at
FROM public.services s
LEFT JOIN public.service_stages ss ON s.current_stage_id = ss.id
LEFT JOIN public.users um ON s.user_manager_id = um.id
LEFT JOIN public.users ur ON s.user_reporter_id = ur.id;
