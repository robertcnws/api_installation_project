import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ReportsPage() {
  const supabase = await createServerClient();

  const { data: reports } = await supabase
    .from("project_profit_reports")
    .select("*")
    .order("created_at", { ascending: false });

  const totalProfit = (reports ?? []).reduce(
    (sum, r) => sum + (r.installation_profit_onhouse ?? 0) + (r.installation_profit_subcontractor ?? 0),
    0
  );

  const totalAmount = (reports ?? []).reduce((sum, r) => sum + (r.project_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Financial and project reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Project Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(reports ?? []).length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
