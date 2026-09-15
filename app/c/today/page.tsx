import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalorieRing } from "@/components/charts/calorie-ring";
import { todayInVietnam, vietnamDayRangeUtc } from "@/lib/datetime/vn";

function macroPercent(consumed: number, limit: number) {
  return limit > 0 ? Math.min(100, Math.round((consumed / limit) * 100)) : 0;
}

function MacroBar({ label, consumed, limit }: { label: string; consumed: number; limit: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">
          {Math.round(consumed)} / {Math.round(limit)} g
        </span>
      </div>
      <Progress value={macroPercent(consumed, limit)} />
    </div>
  );
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: client }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase.from("clients").select("id").eq("profile_id", user!.id).single(),
  ]);

  const { data: target } = await supabase
    .from("nutrition_targets")
    .select("*")
    .eq("client_id", client!.id)
    .maybeSingle();

  const { startUtc, endUtc } = vietnamDayRangeUtc(todayInVietnam());
  const { data: logs } = await supabase
    .from("meal_logs")
    .select("quantity, food:foods(calo_per_unit, protein_g, carb_g, fat_g)")
    .eq("client_id", client!.id)
    .gte("logged_at", startUtc.toISOString())
    .lte("logged_at", endUtc.toISOString());

  const totals = (logs ?? []).reduce(
    (acc, l) => {
      if (!l.food) return acc;
      acc.calo += l.food.calo_per_unit * l.quantity;
      acc.protein += l.food.protein_g * l.quantity;
      acc.carb += l.food.carb_g * l.quantity;
      acc.fat += l.food.fat_g * l.quantity;
      return acc;
    },
    { calo: 0, protein: 0, carb: 0, fat: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chào {profile?.full_name ?? "bạn"}</h1>
          <p className="text-sm text-muted-foreground">Hôm nay bạn thế nào?</p>
        </div>
        <LogoutButton />
      </div>

      {target ? (
        <>
          <div className="flex justify-center py-2">
            <CalorieRing consumed={totals.calo} limit={target.daily_calo} />
          </div>

          <div className="space-y-3">
            <MacroBar label="Protein" consumed={totals.protein} limit={target.protein_g} />
            <MacroBar label="Carb" consumed={totals.carb} limit={target.carb_g} />
            <MacroBar label="Fat" consumed={totals.fat} limit={target.fat_g} />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa có chỉ tiêu dinh dưỡng, vui lòng liên hệ PT của bạn.
        </p>
      )}

      <Button asChild size="lg" className="h-14 w-full text-base">
        <Link href="/c/log">Ghi bữa ăn</Link>
      </Button>

      <p className="text-xs text-muted-foreground">
        Thông tin trong ứng dụng không thay thế tư vấn y tế.
      </p>
    </div>
  );
}
