import { NextRequest, NextResponse } from "next/server";
import { createMealLogSchema } from "@/features/tracking/schemas";
import { unauthorized, forbidden, validationError, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { todayInVietnam, vietnamDayRangeUtc } from "@/lib/datetime/vn";

async function resolveOwnClientId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "client") return { clientId: null, error: forbidden("Chỉ khách hàng mới ghi được nhật ký bữa ăn.") };

  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", userId).single();
  if (!client) return { clientId: null, error: forbidden("Không tìm thấy hồ sơ khách hàng.") };

  return { clientId: client.id, error: null };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { clientId, error: ownerError } = await resolveOwnClientId(supabase, user.id);
  if (ownerError) return ownerError;

  const parsed = createMealLogSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const { data: log, error: insertError } = await supabase
    .from("meal_logs")
    .insert({
      client_id: clientId!,
      meal_type: input.mealType,
      food_id: input.foodId,
      quantity: input.quantity,
      source: "client",
    })
    .select("*, food:foods(name_vi, unit, calo_per_unit, protein_g, carb_g, fat_g)")
    .single();

  if (insertError || !log) return serverError("Không thể lưu nhật ký bữa ăn.");

  return NextResponse.json({ log }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { clientId, error: ownerError } = await resolveOwnClientId(supabase, user.id);
  if (ownerError) return ownerError;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayInVietnam();
  const { startUtc, endUtc } = vietnamDayRangeUtc(date);

  const { data: logs, error } = await supabase
    .from("meal_logs")
    .select("*, food:foods(name_vi, unit, calo_per_unit, protein_g, carb_g, fat_g)")
    .eq("client_id", clientId!)
    .gte("logged_at", startUtc.toISOString())
    .lte("logged_at", endUtc.toISOString())
    .order("logged_at", { ascending: false });

  if (error) return serverError("Không thể tải nhật ký bữa ăn.");

  const totals = (logs ?? []).reduce(
    (acc, l) => {
      const food = l.food;
      if (!food) return acc;
      acc.calo += food.calo_per_unit * l.quantity;
      acc.protein += food.protein_g * l.quantity;
      acc.carb += food.carb_g * l.quantity;
      acc.fat += food.fat_g * l.quantity;
      return acc;
    },
    { calo: 0, protein: 0, carb: 0, fat: 0 },
  );

  return NextResponse.json({ date, logs: logs ?? [], totals });
}
