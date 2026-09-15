import type { Sex } from "@/types/database";
import { round1, type NutritionWarning } from "./types";

const DEFICIT_FACTOR = 0.8; // daily_calo = TDEE - 20% TDEE
const SAFETY_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };

export interface DailyCaloriesResult {
  dailyCalo: number;
  warnings: NutritionWarning[];
}

/**
 * daily_calo = TDEE * 0.8, clamped to the never-go-below safety floor
 * (1500 kcal male / 1200 kcal female). Clamping raises a warning for the PT.
 */
export function calculateDailyCalories(
  tdee: number,
  sex: Sex,
): DailyCaloriesResult {
  const raw = tdee * DEFICIT_FACTOR;
  const floor = SAFETY_FLOOR[sex];

  if (raw < floor) {
    return {
      dailyCalo: round1(floor),
      warnings: [
        {
          code: "SAFETY_FLOOR_CLAMPED",
          message: `Lượng calo tính toán thấp hơn mức an toàn tối thiểu (${floor} kcal), đã điều chỉnh về mức an toàn.`,
        },
      ],
    };
  }

  return { dailyCalo: round1(raw), warnings: [] };
}

/**
 * Flags a weight-loss goal steeper than the recommended 0.5%-1%/week.
 * Does not block saving — only surfaces a warning (spec section 10).
 */
export function assessWeightLossRate(
  currentWeightKg: number,
  targetWeightKg: number,
  targetDate: string,
  now: Date = new Date(),
): NutritionWarning[] {
  const target = new Date(targetDate);
  const weeks = Math.max(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7),
    1 / 7,
  );
  const totalLossKg = currentWeightKg - targetWeightKg;
  if (totalLossKg <= 0) return [];

  const weeklyLossPercent = (totalLossKg / weeks / currentWeightKg) * 100;
  if (weeklyLossPercent > 1) {
    return [
      {
        code: "WEIGHT_LOSS_TOO_FAST",
        message: `Tốc độ giảm cân mục tiêu (~${weeklyLossPercent.toFixed(1)}%/tuần) nhanh hơn mức khuyến nghị (0.5%-1%/tuần).`,
      },
    ];
  }
  return [];
}
