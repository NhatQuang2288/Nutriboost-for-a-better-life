import { NextRequest, NextResponse } from "next/server";
import { createClientSchema } from "@/features/clients/schemas";
import { apiError, unauthorized, forbidden, validationError, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { calculateNutritionTargets } from "@/lib/nutrition";
import { daysSinceInVietnam, isTodayInVietnam } from "@/lib/datetime/vn";

const NEEDS_ATTENTION_THRESHOLD_DAYS = 2;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "pt") return forbidden();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("pt_id", user.id);

  if (!clients || clients.length === 0) return NextResponse.json({ clients: [] });

  const clientIds = clients.map((c) => c.id);

  const [{ data: targets }, { data: mealLogs }, { data: progressLogs }] = await Promise.all([
    supabase.from("nutrition_targets").select("*").in("client_id", clientIds),
    supabase
      .from("meal_logs")
      .select("client_id, logged_at")
      .in("client_id", clientIds)
      .order("logged_at", { ascending: false }),
    supabase
      .from("progress_logs")
      .select("client_id, weight_kg, logged_at")
      .in("client_id", clientIds)
      .order("logged_at", { ascending: true }),
  ]);

  const targetsByClient = new Map((targets ?? []).map((t) => [t.client_id, t]));

  const lastLogByClient = new Map<string, string>();
  for (const log of mealLogs ?? []) {
    if (!lastLogByClient.has(log.client_id)) lastLogByClient.set(log.client_id, log.logged_at);
  }

  const firstWeightByClient = new Map<string, number>();
  for (const log of progressLogs ?? []) {
    if (!firstWeightByClient.has(log.client_id)) firstWeightByClient.set(log.client_id, log.weight_kg);
  }

  const result = clients
    .map((client) => {
      const target = targetsByClient.get(client.id);
      const lastLogAt = lastLogByClient.get(client.id) ?? null;
      const initialWeightKg = firstWeightByClient.get(client.id) ?? client.weight_kg;
      const totalToLose = initialWeightKg - client.target_weight_kg;
      const lostKg = initialWeightKg - client.weight_kg;
      const progressPercent =
        totalToLose <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((lostKg / totalToLose) * 100)));

      return {
        id: client.id,
        fullName: client.full_name,
        age: client.age,
        sex: client.sex,
        weightKg: client.weight_kg,
        bmi: target?.bmi ?? null,
        bmiCategory: target?.bmi_category ?? null,
        targetWeightKg: client.target_weight_kg,
        progressPercent,
        status: client.status,
        lastLogAt,
        loggedToday: lastLogAt ? isTodayInVietnam(lastLogAt) : false,
        needsAttention:
          client.status === "active" &&
          (!lastLogAt || daysSinceInVietnam(lastLogAt) >= NEEDS_ATTENTION_THRESHOLD_DAYS),
      };
    })
    .sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      return a.fullName.localeCompare(b.fullName, "vi");
    });

  return NextResponse.json({ clients: result });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "pt") return forbidden("Chỉ PT mới có thể thêm khách hàng.");

  const parsed = createClientSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  // Server-side enforcement (RLS alone is not enough per spec section 9):
  // only "active" clients count against the tier limit.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("max_clients")
    .eq("pt_id", user.id)
    .single();

  if (!subscription) return serverError("Không tìm thấy gói dịch vụ của bạn.");

  const { count: activeCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("pt_id", user.id)
    .eq("status", "active");

  if ((activeCount ?? 0) >= subscription.max_clients) {
    return apiError(
      "PLAN_LIMIT_REACHED",
      `Bạn đã đạt giới hạn ${subscription.max_clients} khách hàng của gói hiện tại.`,
      403,
    );
  }

  const { data: client, error: insertError } = await supabase
    .from("clients")
    .insert({
      pt_id: user.id,
      full_name: input.fullName,
      age: input.age,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      sex: input.sex,
      activity_level: input.activityLevel,
      goal_type: input.goalType,
      target_weight_kg: input.targetWeightKg,
      target_date: input.targetDate,
    })
    .select()
    .single();

  if (insertError || !client) return serverError("Không thể tạo khách hàng, vui lòng thử lại.");

  const result = calculateNutritionTargets({
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age: input.age,
    sex: input.sex,
    activityLevel: input.activityLevel,
    targetWeightKg: input.targetWeightKg,
    targetDate: input.targetDate,
  });

  const { error: targetsError } = await supabase.from("nutrition_targets").insert({
    client_id: client.id,
    bmi: result.bmi,
    bmi_category: result.bmiCategory,
    bmr: result.bmr,
    tdee: result.tdee,
    daily_calo: result.dailyCalo,
    protein_g: result.proteinG,
    carb_g: result.carbG,
    fat_g: result.fatG,
    water_ml: result.waterMl,
  });

  if (targetsError) {
    return serverError("Đã tạo khách hàng nhưng tính chỉ số dinh dưỡng thất bại.");
  }

  return NextResponse.json(
    { client, nutritionTargets: result, warnings: result.warnings },
    { status: 201 },
  );
}
