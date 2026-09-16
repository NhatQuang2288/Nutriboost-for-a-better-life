import { NextRequest, NextResponse } from "next/server";
import { updateClientSchema } from "@/features/clients/schemas";
import { calculateWeightProgress } from "@/features/clients/progress";
import { loadOwnedClient } from "@/features/clients/load-owned-client";
import { unauthorized, validationError, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNutritionTargets } from "@/lib/nutrition";

// Explicit: this route touches SUPABASE_SERVICE_ROLE_KEY and must never be
// bundled for the Edge runtime (which middleware.ts uses).
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
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

  const [{ data: target }, { data: firstProgress }, { data: recentMealLogs }] = await Promise.all([
    supabase.from("nutrition_targets").select("*").eq("client_id", id).maybeSingle(),
    supabase
      .from("progress_logs")
      .select("weight_kg")
      .eq("client_id", id)
      .order("logged_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("meal_logs")
      .select("*, food:foods(name_vi, unit, calo_per_unit)")
      .eq("client_id", id)
      .order("logged_at", { ascending: false })
      .limit(10),
  ]);

  const initialWeightKg = firstProgress?.weight_kg ?? client!.weight_kg;
  const progress = calculateWeightProgress(initialWeightKg, client!.weight_kg, client!.target_weight_kg);

  const { warnings } = calculateNutritionTargets({
    weightKg: client!.weight_kg,
    heightCm: client!.height_cm,
    age: client!.age,
    sex: client!.sex,
    activityLevel: client!.activity_level,
    targetWeightKg: client!.target_weight_kg,
    targetDate: client!.target_date,
  });

  return NextResponse.json({
    client,
    nutritionTargets: target,
    initialWeightKg,
    progress,
    warnings,
    recentMealLogs: recentMealLogs ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { client: existing, error } = await loadOwnedClient(supabase, user.id, id);
  if (error) return error;

  const parsed = updateClientSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const merged = {
    full_name: input.fullName ?? existing!.full_name,
    age: input.age ?? existing!.age,
    height_cm: input.heightCm ?? existing!.height_cm,
    weight_kg: input.weightKg ?? existing!.weight_kg,
    sex: input.sex ?? existing!.sex,
    activity_level: input.activityLevel ?? existing!.activity_level,
    goal_type: input.goalType ?? existing!.goal_type,
    target_weight_kg: input.targetWeightKg ?? existing!.target_weight_kg,
    target_date: input.targetDate ?? existing!.target_date,
  };

  const { data: updated, error: updateError } = await supabase
    .from("clients")
    .update(merged)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) return serverError("Không thể cập nhật khách hàng.");

  const result = calculateNutritionTargets({
    weightKg: merged.weight_kg,
    heightCm: merged.height_cm,
    age: merged.age,
    sex: merged.sex,
    activityLevel: merged.activity_level,
    targetWeightKg: merged.target_weight_kg,
    targetDate: merged.target_date,
  });

  const { error: targetsError } = await supabase.from("nutrition_targets").upsert({
    client_id: id,
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
    return serverError("Đã cập nhật khách hàng nhưng tính lại chỉ số dinh dưỡng thất bại.");
  }

  return NextResponse.json({ client: updated, nutritionTargets: result, warnings: result.warnings });
}

export async function DELETE(
  _request: NextRequest,
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

  // Child rows (nutrition_targets, meal_logs, progress_logs, meal_plans, ...)
  // cascade via ON DELETE CASCADE foreign keys — see migration 000002.
  const { error: deleteError } = await supabase.from("clients").delete().eq("id", id);
  if (deleteError) return serverError("Không thể xoá khách hàng.");

  // The client's auth account (if they had joined) isn't touched by the DB
  // cascade — it lives in auth.users, so remove it explicitly via the admin API.
  if (client!.profile_id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(client!.profile_id);
  }

  return NextResponse.json({ success: true });
}
