import { createServerClient } from "@/lib/supabase/server";
import { ProjectList } from "@/components/projects/project-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProjectsPage() {
  const supabase = await createServerClient();

  const { data: projects } = await supabase
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage all installation projects</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      </div>

      <ProjectList projects={projects ?? []} />
    </div>
  );
}
