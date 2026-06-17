"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProjectWithRelations } from "@/types";

const PROJECT_QUERY_KEY = "projects";

export function useProjects() {
  const supabase = createClient();

  return useQuery<ProjectWithRelations[]>({
    queryKey: [PROJECT_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          current_stage:project_stages(id, name),
          user_reporter:users!projects_user_reporter_id_fkey(id, first_name, last_name, avatar_url),
          user_manager:users!projects_user_manager_id_fkey(id, first_name, last_name, avatar_url)
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as ProjectWithRelations[]) ?? [];
    },
  });
}

export function useProject(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: [PROJECT_QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          current_stage:project_stages(id, name),
          user_reporter:users!projects_user_reporter_id_fkey(id, first_name, last_name, avatar_url),
          user_manager:users!projects_user_manager_id_fkey(id, first_name, last_name, avatar_url),
          user_installer:users!projects_user_installer_id_fkey(id, first_name, last_name),
          project_tasks(*, current_stage:project_task_stages(id, name)),
          project_attachments(*),
          project_users(*, user:users(id, first_name, last_name), role:project_roles(id, name))
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECT_QUERY_KEY] });
    },
  });
}
