import { NextRequest, NextResponse } from "next/server";
import { createProgressLogSchema } from "@/features/tracking/schemas";
import { unauthorized, forbidden, validationError, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNutritionTargets } from "@/lib/nutrition";
import { todayInVietnam, vietnamDayRangeUtc } from "@/lib/datetime/vn";

async function resolveOwnClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "client") return { client: null, error: forbidden("Chỉ khách hàng mới ghi được cân nặng.") };

  const { data: client } = await supabase.from("clients").select("*").eq("profile_id", userId).single();
  if (!client) return { client: null, error: forbidden("Không tìm thấy hồ sơ khách hàng.") };

  return { client, error: null };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { client, error: ownerError } = await resolveOwnClient(supabase, user.id);
  if (ownerError) return ownerError;

  const parsed = createProgressLogSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const { data: log, error: insertError } = await supabase
    .from("progress_logs")
    .insert({ client_id: client!.id, weight_kg: input.weightKg, note: input.note })
    .select()
    .single();

  if (insertError || !log) return serverError("Không thể lưu cân nặng.");

  // A new weight reading updates the client's current weight and, per spec
  // section 11, must trigger a nutrition_targets recalculation. Neither
  // `clients` nor `nutrition_targets` has a client-writable RLS policy (only
  // the PT may write them) — this is a system-computed side effect of a
  // legitimate, already-authorized client action, so it goes through the
  // admin client rather than loosening RLS for direct client writes.
  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("clients")
    .update({ weight_kg: input.weightKg })
    .eq("id", client!.id);

  if (updateError) return serverError("Đã lưu cân nặng nhưng cập nhật hồ sơ thất bại.");

  const result = calculateNutritionTargets({
    weightKg: input.weightKg,
    heightCm: client!.height_cm,
    age: client!.age,
    sex: client!.sex,
    activityLevel: client!.activity_level,
    targetWeightKg: client!.target_weight_kg,
    targetDate: client!.target_date,
  });

  const { error: targetsError } = await admin.from("nutrition_targets").upsert({
    client_id: client!.id,
    bmi: result.bmi,
    bmi_category: result.bmiCategory,
    bmr: result.bmr,
    tdee: result.tdee,
    daily_calo: result.dailyCalo,
    protein_g: result.proteinG,
    carb_g: result.carbG,
    fat_g: result.fatG,
    water_ml: result.waterMl,
    calculated_at: new Date().toISOString(),
  });

  if (targetsError) {
    return serverError("Đã lưu cân nặng nhưng tính lại chỉ số dinh dưỡng thất bại.");
  }

  return NextResponse.json({ log, nutritionTargets: result, warnings: result.warnings }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { client, error: ownerError } = await resolveOwnClient(supabase, user.id);
  if (ownerError) return ownerError;

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days")) || 30));
  const endDate = todayInVietnam();
  const startDate = todayInVietnam(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  const { startUtc } = vietnamDayRangeUtc(startDate);
  const { endUtc } = vietnamDayRangeUtc(endDate);

  const { data: logs, error } = await supabase
    .from("progress_logs")
    .select("id, weight_kg, note, logged_at")
    .eq("client_id", client!.id)
    .gte("logged_at", startUtc.toISOString())
    .lte("logged_at", endUtc.toISOString())
    .order("logged_at", { ascending: true });

  if (error) return serverError("Không thể tải lịch sử cân nặng.");

  const { data: firstLog } = await supabase
    .from("progress_logs")
    .select("weight_kg")
    .eq("client_id", client!.id)
    .order("logged_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    logs: logs ?? [],
    currentWeightKg: client!.weight_kg,
    targetWeightKg: client!.target_weight_kg,
    initialWeightKg: firstLog?.weight_kg ?? client!.weight_kg,
  });
}
