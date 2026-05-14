import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CalendarPage() {
  const supabase = await createServerClient();

  const { data: notes } = await supabase
    .from("project_calendar_notes")
    .select(
      `
      *,
      user_reporter:users!project_calendar_notes_user_reporter_id_fkey(id, first_name, last_name)
    `
    )
    .eq("is_active", true)
    .order("start_date", { ascending: true });

  const upcoming = (notes ?? []).filter(
    (n) => n.start_date && new Date(n.start_date) >= new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Scheduled events and project dates</p>
      </div>

      <div className="grid gap-4">
        <h2 className="text-lg font-semibold">Upcoming Events ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming events.</p>
        ) : (
          upcoming.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{note.name}</CardTitle>
                  {note.duration && (
                    <Badge variant="outline">{note.duration}d</Badge>
                  )}
                </div>
                <CardDescription>
                  {note.start_date && new Date(note.start_date).toLocaleDateString()} —{" "}
                  {note.end_date && new Date(note.end_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              {note.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{note.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
