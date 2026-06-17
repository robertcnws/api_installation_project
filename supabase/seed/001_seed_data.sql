-- ============================================================
-- Seed Data: Initial lookup table values
-- Run after all migrations
-- ============================================================

-- ============================================================
-- Project Stages (typical installation workflow)
-- ============================================================
INSERT INTO public.project_stages (name, "order", other_name, is_active) VALUES
  ('Lead',                1,  NULL,           TRUE),
  ('Quote Sent',          2,  NULL,           TRUE),
  ('Quote Approved',      3,  NULL,           TRUE),
  ('Scheduled',           4,  NULL,           TRUE),
  ('Measurement',         5,  'Measure',      TRUE),
  ('In Production',       6,  NULL,           TRUE),
  ('Ready to Install',    7,  'RTI',          TRUE),
  ('Installation',        8,  'Install',      TRUE),
  ('Punch List',          9,  NULL,           TRUE),
  ('Inspection',          10, NULL,           TRUE),
  ('Complete',            11, 'Done',         TRUE),
  ('On Hold',             12, NULL,           TRUE),
  ('Cancelled',           13, NULL,           TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Project Task Stages
-- ============================================================
INSERT INTO public.project_task_stages (name, "order", is_active) VALUES
  ('To Do',        1, TRUE),
  ('In Progress',  2, TRUE),
  ('Blocked',      3, TRUE),
  ('Review',       4, TRUE),
  ('Done',         5, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Service Stages
-- ============================================================
INSERT INTO public.service_stages (name, "order", is_active) VALUES
  ('New',           1, TRUE),
  ('Assigned',      2, TRUE),
  ('In Progress',   3, TRUE),
  ('Waiting Parts', 4, TRUE),
  ('Completed',     5, TRUE),
  ('Closed',        6, TRUE),
  ('Cancelled',     7, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Project Roles
-- ============================================================
INSERT INTO public.project_roles (name, is_active) VALUES
  ('Manager',       TRUE),
  ('Installer',     TRUE),
  ('Helper',        TRUE),
  ('Subcontractor', TRUE),
  ('Inspector',     TRUE),
  ('Admin',         TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- User Roles
-- ============================================================
INSERT INTO public.user_roles (name, description, is_active) VALUES
  ('Admin',       'Full system access',                           TRUE),
  ('Manager',     'Can manage projects and services',             TRUE),
  ('Installer',   'Can view and update assigned projects',        TRUE),
  ('Viewer',      'Read-only access',                             TRUE),
  ('Salesperson', 'Can view projects linked to their sales orders', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Project Permissions
-- ============================================================
INSERT INTO public.project_permissions (name, description, is_active) VALUES
  ('view_project',          'View project details',            TRUE),
  ('edit_project',          'Edit project information',        TRUE),
  ('manage_tasks',          'Create and update tasks',         TRUE),
  ('manage_team',           'Add/remove team members',         TRUE),
  ('upload_attachments',    'Upload files and attachments',    TRUE),
  ('view_financials',       'View profit reports',             TRUE),
  ('manage_work_orders',    'Create and update work orders',   TRUE),
  ('close_project',         'Mark project as complete',        TRUE)
ON CONFLICT DO NOTHING;
