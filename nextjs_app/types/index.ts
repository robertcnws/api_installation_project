import type { Database } from "./database";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type User = Tables<"users">;
export type UserRole = Tables<"user_roles">;
export type Project = Tables<"projects">;
export type ProjectStage = Tables<"project_stages">;
export type ProjectTaskStage = Tables<"project_task_stages">;
export type ProjectRole = Tables<"project_roles">;
export type ProjectPermission = Tables<"project_permissions">;
export type ProjectUser = Tables<"project_users">;
export type ProjectTask = Tables<"project_tasks">;
export type ProjectAttachment = Tables<"project_attachments">;
export type Service = Tables<"services">;
export type ServiceStage = Tables<"service_stages">;
export type Measurement = Tables<"measurements">;
export type ProjectCalendarNote = Tables<"project_calendar_notes">;
export type ProjectProfitReport = Tables<"project_profit_reports">;
export type TaskTimer = Tables<"task_timers">;

// Enriched types for joined queries
export type ProjectWithRelations = Project & {
  current_stage: Pick<ProjectStage, "id" | "name"> | null;
  user_reporter: Pick<User, "id" | "first_name" | "last_name" | "avatar_url"> | null;
  user_manager: Pick<User, "id" | "first_name" | "last_name" | "avatar_url"> | null;
  user_installer: Pick<User, "id" | "first_name" | "last_name"> | null;
};

export type ServiceWithRelations = Service & {
  current_stage: Pick<ServiceStage, "id" | "name"> | null;
  user_reporter: Pick<User, "id" | "first_name" | "last_name" | "avatar_url"> | null;
  user_manager: Pick<User, "id" | "first_name" | "last_name" | "avatar_url"> | null;
};

export type MeasurementWithRelations = Measurement & {
  user_reporter: Pick<User, "id" | "first_name" | "last_name" | "avatar_url"> | null;
  user_manager: Pick<User, "id" | "first_name" | "last_name" | "avatar_url"> | null;
};
