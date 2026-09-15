import { NextRequest, NextResponse } from "next/server";
import { loadOwnedClient } from "@/features/clients/load-owned-client";
import { unauthorized } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { lastNDaysInVietnam, vietnamDateKey, vietnamDayRangeUtc, todayInVietnam } from "@/lib/datetime/vn";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { client, error } = await loadOwnedClient(supabase, user.id, id);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days")) || 30));
  const dateKeys = lastNDaysInVietnam(days);
  const startDate = dateKeys[0];
  const endDate = todayInVietnam();
  const { startUtc } = vietnamDayRangeUtc(startDate);
  const { endUtc } = vietnamDayRangeUtc(endDate);

  const [{ data: target }, { data: weightLogs }, { data: mealLogs }] = await Promise.all([
    supabase.from("nutrition_targets").select("daily_calo").eq("client_id", id).maybeSingle(),
    supabase
      .from("progress_logs")
      .select("weight_kg, logged_at")
      .eq("client_id", id)
      .gte("logged_at", startUtc.toISOString())
      .lte("logged_at", endUtc.toISOString())
      .order("logged_at", { ascending: true }),
    supabase
      .from("meal_logs")
      .select("quantity, logged_at, food:foods(calo_per_unit)")
      .eq("client_id", id)
      .gte("logged_at", startUtc.toISOString())
      .lte("logged_at", endUtc.toISOString()),
  ]);

  const weightByDate = new Map<string, number>();
  for (const log of weightLogs ?? []) {
    weightByDate.set(vietnamDateKey(log.logged_at), log.weight_kg);
  }

  const calorieByDate = new Map<string, number>();
  for (const log of mealLogs ?? []) {
    if (!log.food) continue;
    const key = vietnamDateKey(log.logged_at);
    calorieByDate.set(key, (calorieByDate.get(key) ?? 0) + log.food.calo_per_unit * log.quantity);
  }

  const dailyCalo = target?.daily_calo ?? 0;
  const weightSeries = dateKeys.map((date) => ({ date, weightKg: weightByDate.get(date) ?? null }));
  const calorieSeries = dateKeys.map((date) => ({
    date,
    consumed: Math.round(calorieByDate.get(date) ?? 0),
    limit: Math.round(dailyCalo),
  }));

  return NextResponse.json({
    startDate,
    endDate,
    currentWeightKg: client!.weight_kg,
    targetWeightKg: client!.target_weight_kg,
    weightSeries,
    calorieSeries,
  });
}
