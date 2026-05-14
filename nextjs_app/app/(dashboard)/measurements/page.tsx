import { createServerClient } from "@/lib/supabase/server";
import { MeasurementList } from "@/components/measurements/measurement-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MeasurementsPage() {
  const supabase = await createServerClient();

  const { data: measurements } = await supabase
    .from("measurements")
    .select(
      `
      *,
      user_reporter:users!measurements_user_reporter_id_fkey(id, first_name, last_name, avatar_url),
      user_manager:users!measurements_user_manager_id_fkey(id, first_name, last_name, avatar_url)
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Measurements</h1>
          <p className="text-muted-foreground">Track site measurements and inspections</p>
        </div>
        <Button asChild>
          <Link href="/measurements/new">New Measurement</Link>
        </Button>
      </div>

      <MeasurementList measurements={measurements ?? []} />
    </div>
  );
}
