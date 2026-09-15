import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { todayInVietnam, vietnamDayRangeUtc } from "@/lib/datetime/vn";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: subscription }, { data: clients }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase.from("subscriptions").select("tier, max_clients").eq("pt_id", user!.id).single(),
    supabase.from("clients").select("id, status, weight_kg").eq("pt_id", user!.id),
  ]);

  const allClients = clients ?? [];
  const activeClients = allClients.filter((c) => c.status === "active");
  const achievedCount = allClients.filter((c) => c.status === "achieved").length;

  let notLoggedTodayCount = 0;
  let totalLostKg = 0;

  if (allClients.length > 0) {
    const clientIds = allClients.map((c) => c.id);
    const { startUtc, endUtc } = vietnamDayRangeUtc(todayInVietnam());

    const [{ data: firstProgress }, { data: todayLogs }] = await Promise.all([
      supabase
        .from("progress_logs")
        .select("client_id, weight_kg, logged_at")
        .in("client_id", clientIds)
        .order("logged_at", { ascending: true }),
      supabase
        .from("meal_logs")
        .select("client_id")
        .in("client_id", activeClients.map((c) => c.id))
        .gte("logged_at", startUtc.toISOString())
        .lte("logged_at", endUtc.toISOString()),
    ]);

    const initialWeightByClient = new Map<string, number>();
    for (const log of firstProgress ?? []) {
      if (!initialWeightByClient.has(log.client_id)) {
        initialWeightByClient.set(log.client_id, log.weight_kg);
      }
    }

    const loggedTodaySet = new Set((todayLogs ?? []).map((l) => l.client_id));
    notLoggedTodayCount = activeClients.filter((c) => !loggedTodaySet.has(c.id)).length;

    totalLostKg = allClients.reduce((sum, c) => {
      const initial = initialWeightByClient.get(c.id) ?? c.weight_kg;
      return sum + (initial - c.weight_kg);
    }, 0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Xin chào, {profile?.full_name ?? "PT"}</h1>
        <p className="text-sm text-muted-foreground">
          Đây là tổng quan hoạt động huấn luyện của bạn hôm nay.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Số khách đang kèm"
          value={`${activeClients.length}/${subscription?.max_clients ?? "-"}`}
          hint={`Gói ${subscription?.tier ?? "plus"}`}
        />
        <SummaryCard
          label="Chưa log hôm nay"
          value={`${notLoggedTodayCount}`}
          hint="khách cần nhắc nhở"
          alert={notLoggedTodayCount > 0}
        />
        <SummaryCard
          label="Tổng cân đã giảm"
          value={`${totalLostKg.toFixed(1)} kg`}
          hint="toàn bộ khách hàng"
        />
        <SummaryCard label="Đã đạt mục tiêu" value={`${achievedCount}`} hint="khách hàng" />
      </div>

      {allClients.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chưa có khách hàng nào.{" "}
          <Link href="/clients/new" className="text-primary underline underline-offset-4">
            Thêm khách hàng đầu tiên
          </Link>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`font-mono text-3xl font-semibold ${alert ? "text-destructive" : ""}`}>
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
