/**
 * Supabase Database Types
 * Generated from the SQL schema. Run `supabase gen types typescript` to regenerate.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          is_staff: boolean;
          is_active: boolean;
          phone_number: string | null;
          country: string | null;
          state: string | null;
          city: string | null;
          address: string | null;
          zip_code: string | null;
          gender: string | null;
          avatar_url: string | null;
          user_role_id: string | null;
          installer_info: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      user_roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_roles"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
      };
      project_stages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          order: number | null;
          other_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_stages"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_stages"]["Insert"]>;
      };
      project_task_stages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_task_stages"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_task_stages"]["Insert"]>;
      };
      project_roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_roles"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_roles"]["Insert"]>;
      };
      project_permissions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_permissions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_permissions"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          name: string;
          number: string;
          description: string | null;
          sales_order_id: string | null;
          reference_number: string | null;
          user_reporter_id: string | null;
          user_manager_id: string | null;
          user_installer_id: string | null;
          current_stage_id: string | null;
          start_date: string | null;
          end_date: string | null;
          duration: number | null;
          address: string | null;
          phone: string | null;
          is_active: boolean;
          has_permission: boolean;
          all_products_marked: boolean;
          all_windows_marked: boolean;
          all_screw_marked: boolean;
          all_trash_marked: boolean;
          feedback: string | null;
          work_scope: string | null;
          project_materials_other_notes: string | null;
          inspection_date: string | null;
          inspection_end_date: string | null;
          inspection_duration: number | null;
          inspection_is_part_days: boolean;
          finish_permission_date: string | null;
          finish_permission_end_date: string | null;
          finish_permission_duration: number | null;
          finish_permission_is_part_days: boolean;
          is_part_days: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      project_users: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          role_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_users"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_users"]["Insert"]>;
      };
      project_tasks: {
        Row: {
          id: string;
          name: string;
          number: string;
          description: string | null;
          project_id: string;
          user_reporter_id: string | null;
          current_stage_id: string | null;
          start_date: string | null;
          end_date: string | null;
          priority: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_tasks"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_tasks"]["Insert"]>;
      };
      project_attachments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          file_url: string | null;
          project_id: string | null;
          user_upload_id: string | null;
          current_stage_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_attachments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_attachments"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          number: string;
          name: string;
          version: number | null;
          sales_order_id: string | null;
          reference_number: string | null;
          phone: string | null;
          user_reporter_id: string | null;
          user_manager_id: string | null;
          current_stage_id: string | null;
          start_date: string | null;
          end_date: string | null;
          duration: number | null;
          address: string | null;
          is_active: boolean;
          service_type: string | null;
          service_notes: string | null;
          has_to_pay: boolean;
          paid: boolean;
          by_factory: boolean;
          repaired: boolean;
          is_part_days: boolean;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["services"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      service_stages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["service_stages"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["service_stages"]["Insert"]>;
      };
      measurements: {
        Row: {
          id: string;
          number: string;
          sales_order_id: string | null;
          user_reporter_id: string;
          user_manager_id: string | null;
          phone: string | null;
          address: string | null;
          color: Json | null;
          marks: Json | null;
          is_active: boolean;
          first_date: string | null;
          check_date: string | null;
          first_assignee_id: string | null;
          check_assignee_id: string | null;
          general_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["measurements"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["measurements"]["Insert"]>;
      };
      project_calendar_notes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          duration: number | null;
          user_manager_id: string | null;
          user_installer_id: string | null;
          user_reporter_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_calendar_notes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_calendar_notes"]["Insert"]>;
      };
      project_profit_reports: {
        Row: {
          id: string;
          project_id: string;
          project_info: Json;
          project_amount: number | null;
          installation_amount: number | null;
          installation_cost_subcontractor: number | null;
          installation_cost_onhouse: number | null;
          installation_profit_subcontractor: number | null;
          installation_profit_onhouse: number | null;
          notes: string | null;
          has_been_edited: boolean;
          working_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_profit_reports"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["project_profit_reports"]["Insert"]>;
      };
      task_timers: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string | null;
          entity_id: string;
          entity_info: Json | null;
          elapsed_ms: number;
          start_time: string | null;
          is_running: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["task_timers"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["task_timers"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
