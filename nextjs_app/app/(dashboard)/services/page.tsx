import { createServerClient } from "@/lib/supabase/server";
import { ServiceList } from "@/components/services/service-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ServicesPage() {
  const supabase = await createServerClient();

  const { data: services } = await supabase
    .from("services")
    .select(
      `
      *,
      current_stage:service_stages(id, name),
      user_reporter:users!services_user_reporter_id_fkey(id, first_name, last_name, avatar_url),
      user_manager:users!services_user_manager_id_fkey(id, first_name, last_name, avatar_url)
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage service tickets and repairs</p>
        </div>
        <Button asChild>
          <Link href="/services/new">New Service</Link>
        </Button>
      </div>

      <ServiceList services={services ?? []} />
    </div>
  );
}
