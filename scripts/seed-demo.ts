/**
 * Seeds demo data: 1 PT + 5 clients (thừa cân/béo phì, đúng đối tượng spec)
 * with 14 days of realistic meal_logs + progress_logs history, run against
 * the real Supabase project via the Admin API (not raw SQL — auth.users
 * needs GoTrue's own machinery to produce accounts that can actually log
 * in, which a plain SQL INSERT can't reliably guarantee across Supabase
 * versions). Idempotent: reruns wipe and recreate the same demo accounts.
 *
 * Usage: npx tsx scripts/seed-demo.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fromZonedTime } from "date-fns-tz";
import { calculateNutritionTargets } from "../lib/nutrition";
import type { ActivityLevel, Sex } from "../types/database";

const VN_TZ = "Asia/Ho_Chi_Minh";
const DEMO_PASSWORD = "DemoPass123!";
const PT_EMAIL = "demo.pt@nutriboost.test";
const DAYS_OF_HISTORY = 14;

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Persona {
  email: string;
  fullName: string;
  age: number;
  heightCm: number;
  startWeightKg: number; // cân nặng 14 ngày trước (điểm đầu lịch sử progress_logs)
  totalLossKg: number; // đã giảm được bao nhiêu trong 14 ngày qua (thực tế, chậm)
  sex: Sex;
  activityLevel: ActivityLevel;
  targetWeightKg: number;
  targetDate: string;
  skipMealLogDays: number; // số ngày gần nhất KHÔNG log bữa ăn (demo cảnh báo "chưa log")
}

const PERSONAS: Persona[] = [
  {
    email: "demo.client1@nutriboost.test",
    fullName: "Nguyễn Thị Hoa",
    age: 34,
    heightCm: 160,
    startWeightKg: 79.6,
    totalLossKg: 1.1,
    sex: "female",
    activityLevel: "light",
    targetWeightKg: 62,
    targetDate: "2027-03-01",
    skipMealLogDays: 0,
  },
  {
    email: "demo.client2@nutriboost.test",
    fullName: "Trần Văn Long",
    age: 41,
    heightCm: 172,
    startWeightKg: 97.2,
    totalLossKg: 1.4,
    sex: "male",
    activityLevel: "sedentary",
    targetWeightKg: 78,
    targetDate: "2027-04-01",
    skipMealLogDays: 0,
  },
  {
    email: "demo.client3@nutriboost.test",
    fullName: "Lê Thị Mai",
    age: 27,
    heightCm: 155,
    startWeightKg: 69.0,
    totalLossKg: 0.8,
    sex: "female",
    activityLevel: "moderate",
    targetWeightKg: 55,
    targetDate: "2027-02-01",
    skipMealLogDays: 0,
  },
  {
    email: "demo.client4@nutriboost.test",
    fullName: "Phạm Văn Đức",
    age: 50,
    heightCm: 168,
    startWeightKg: 89.5,
    totalLossKg: 1.1,
    sex: "male",
    activityLevel: "sedentary",
    targetWeightKg: 72,
    targetDate: "2027-05-01",
    skipMealLogDays: 0,
  },
  {
    email: "demo.client5@nutriboost.test",
    fullName: "Vũ Thị Ngọc",
    age: 45,
    heightCm: 158,
    startWeightKg: 75.3,
    totalLossKg: 0.7,
    sex: "female",
    activityLevel: "light",
    targetWeightKg: 60,
    targetDate: "2027-03-15",
    // Khách "cần chú ý": không log 3 ngày gần nhất -> lên đầu danh sách + chấm đỏ.
    skipMealLogDays: 3,
  },
];

const MEAL_FOOD_POOL = {
  breakfast: ["Phở bò", "Bánh mì thịt", "Xôi mặn", "Bánh cuốn", "Cháo gà", "Sữa đậu nành"],
  lunch: ["Cơm tấm sườn nướng", "Cơm gà xối mỡ", "Bún chả", "Canh chua cá", "Thịt kho tàu", "Rau muống xào tỏi"],
  dinner: ["Cá kho tộ", "Cơm trắng", "Canh rau ngót thịt băm", "Thịt bò xào", "Đậu hũ sốt cà", "Gà kho gừng"],
  snack: ["Sữa chua", "Chuối", "Cà phê sữa", "Trà đào"],
} as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function vnTimeUtc(dayOffset: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  const dateStr = d.toISOString().slice(0, 10);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return fromZonedTime(`${dateStr}T${hh}:${mm}:00`, VN_TZ).toISOString();
}

async function main() {
  console.log("== Dọn demo cũ (nếu có) ==");
  const { data: existingPt } = await admin
    .from("profiles")
    .select("id")
    .eq("email", PT_EMAIL)
    .maybeSingle();
  if (existingPt) {
    const { data: oldClients } = await admin.from("clients").select("id, profile_id").eq("pt_id", existingPt.id);
    for (const c of oldClients ?? []) {
      if (c.profile_id) await admin.auth.admin.deleteUser(c.profile_id);
    }
    await admin.from("clients").delete().eq("pt_id", existingPt.id);
    await admin.from("subscriptions").delete().eq("pt_id", existingPt.id);
    await admin.auth.admin.deleteUser(existingPt.id);
  }

  console.log("== Tạo PT demo ==");
  const { data: ptUser, error: ptError } = await admin.auth.admin.createUser({
    email: PT_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role: "pt", full_name: "Huấn Luyện Viên Demo" },
  });
  if (ptError || !ptUser.user) throw new Error(`Tạo PT thất bại: ${ptError?.message}`);
  const ptId = ptUser.user.id;

  await admin.from("subscriptions").insert({ pt_id: ptId, tier: "plus", max_clients: 5 });

  console.log("== Tra cứu food id cho từng bữa ==");
  const allFoodNames = Object.values(MEAL_FOOD_POOL).flat();
  const { data: foods, error: foodsError } = await admin
    .from("foods")
    .select("id, name_vi")
    .in("name_vi", allFoodNames);
  if (foodsError || !foods || foods.length === 0) {
    throw new Error("Không tìm thấy food — hãy chạy `node scripts/seed-foods.mjs` trước.");
  }
  const foodIdByName = new Map(foods.map((f) => [f.name_vi, f.id]));

  for (const persona of PERSONAS) {
    console.log(`== Tạo khách hàng demo: ${persona.fullName} ==`);

    const currentWeightKg = Math.round((persona.startWeightKg - persona.totalLossKg) * 10) / 10;

    const { data: client, error: clientError } = await admin
      .from("clients")
      .insert({
        pt_id: ptId,
        full_name: persona.fullName,
        age: persona.age,
        height_cm: persona.heightCm,
        weight_kg: currentWeightKg,
        sex: persona.sex,
        activity_level: persona.activityLevel,
        goal_type: "lose_weight",
        target_weight_kg: persona.targetWeightKg,
        target_date: persona.targetDate,
        status: "active",
      })
      .select()
      .single();
    if (clientError || !client) throw new Error(`Tạo client thất bại: ${clientError?.message}`);

    const result = calculateNutritionTargets({
      weightKg: currentWeightKg,
      heightCm: persona.heightCm,
      age: persona.age,
      sex: persona.sex,
      activityLevel: persona.activityLevel,
      targetWeightKg: persona.targetWeightKg,
      targetDate: persona.targetDate,
    });

    await admin.from("nutrition_targets").insert({
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

    const { data: clientUser, error: clientUserError } = await admin.auth.admin.createUser({
      email: persona.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "client", full_name: persona.fullName },
    });
    if (clientUserError || !clientUser.user) {
      throw new Error(`Tạo tài khoản khách thất bại: ${clientUserError?.message}`);
    }
    await admin.from("clients").update({ profile_id: clientUser.user.id }).eq("id", client.id);

    // 14 ngày lịch sử: cân nặng giảm dần đều từ startWeightKg (13 ngày trước)
    // tới currentWeightKg (hôm nay); bữa ăn thật từ foods đã seed (bỏ qua N
    // ngày gần nhất với persona cần demo cảnh báo "chưa log").
    for (let dayOffset = DAYS_OF_HISTORY - 1; dayOffset >= 0; dayOffset--) {
      const progressWeight =
        Math.round(
          (persona.startWeightKg -
            (persona.totalLossKg * (DAYS_OF_HISTORY - 1 - dayOffset)) / (DAYS_OF_HISTORY - 1)) *
            10,
        ) / 10;

      if (dayOffset % 2 === 0) {
        await admin.from("progress_logs").insert({
          client_id: client.id,
          weight_kg: progressWeight,
          logged_at: vnTimeUtc(dayOffset, 7, 0),
        });
      }

      if (dayOffset < persona.skipMealLogDays) continue; // khách chưa log những ngày gần đây

      const meals: { type: "breakfast" | "lunch" | "dinner" | "snack"; hour: number; minute: number }[] = [
        { type: "breakfast", hour: 7, minute: 15 },
        { type: "lunch", hour: 12, minute: 0 },
        { type: "dinner", hour: 19, minute: 0 },
      ];
      if (Math.random() < 0.4) meals.push({ type: "snack", hour: 15, minute: 30 });

      for (const meal of meals) {
        const foodName = pick(MEAL_FOOD_POOL[meal.type]);
        const foodId = foodIdByName.get(foodName);
        if (!foodId) continue;
        await admin.from("meal_logs").insert({
          client_id: client.id,
          meal_type: meal.type,
          food_id: foodId,
          quantity: Math.random() < 0.25 ? 1.5 : 1,
          source: "client",
          logged_at: vnTimeUtc(dayOffset, meal.hour, meal.minute),
        });
      }
    }
  }

  console.log("\n== Hoàn tất ==");
  console.log(`PT:     ${PT_EMAIL} / ${DEMO_PASSWORD}`);
  for (const p of PERSONAS) console.log(`Client: ${p.email} / ${DEMO_PASSWORD}  (${p.fullName})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
