import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const [{ count: projectsCount }, { count: servicesCount }, { count: measurementsCount }] =
    await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("services").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("measurements").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);

  const stats = [
    { title: "Active Projects", value: projectsCount ?? 0, description: "Currently in progress" },
    { title: "Active Services", value: servicesCount ?? 0, description: "Open service tickets" },
    { title: "Measurements", value: measurementsCount ?? 0, description: "Total measurements" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your installation projects</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
