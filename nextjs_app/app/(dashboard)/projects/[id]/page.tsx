import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      `
      *,
      current_stage:project_stages(id, name),
      user_reporter:users!projects_user_reporter_id_fkey(id, first_name, last_name, email),
      user_manager:users!projects_user_manager_id_fkey(id, first_name, last_name, email),
      user_installer:users!projects_user_installer_id_fkey(id, first_name, last_name, email),
      project_tasks(*, current_stage:project_task_stages(id, name)),
      project_attachments(*),
      project_users(*, user:users(id, first_name, last_name), role:project_roles(id, name))
    `
    )
    .eq("id", id)
    .single();

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline">#{project.number}</Badge>
            {project.current_stage && (
              <Badge>{(project.current_stage as { name: string }).name}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{project.address}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{project.phone ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Reference</p>
              <p className="font-medium">{project.reference_number ?? "—"}</p>
            </div>
          </div>

          {project.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p>{project.description}</p>
            </div>
          )}
          {project.work_scope && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Work Scope</p>
              <p>{project.work_scope}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="space-y-2">
            {((project.project_tasks as unknown[]) ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No tasks yet.</p>
            ) : (
              (project.project_tasks as Array<{
                id: string;
                name: string;
                number: string;
                priority: string;
                current_stage: { name: string } | null;
              }>).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground">#{task.number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.priority && <Badge variant="outline">{task.priority}</Badge>}
                    {task.current_stage && <Badge>{task.current_stage.name}</Badge>}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <div className="space-y-2">
            {((project.project_users as unknown[]) ?? []).map(
              (pu: {
                id: string;
                user: { first_name: string; last_name: string; email: string };
                role: { name: string } | null;
              }) => (
                <div key={pu.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium">
                      {pu.user.first_name} {pu.user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{pu.user.email}</p>
                  </div>
                  {pu.role && <Badge variant="outline">{pu.role.name}</Badge>}
                </div>
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="mt-4">
          <p className="text-muted-foreground text-sm">
            {((project.project_attachments as unknown[]) ?? []).length} attachment(s)
          </p>
        </TabsContent>

        <TabsContent value="work-orders" className="mt-4">
          <p className="text-muted-foreground text-sm">Work orders for this project.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
