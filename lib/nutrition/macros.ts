import { round1, type NutritionWarning } from "./types";

/** protein_g = 1.8 x target_weight_kg */
export function calculateProtein(targetWeightKg: number): number {
  return round1(1.8 * targetWeightKg);
}

/** fat_g = max(25% of daily_calo / 9, 0.8 x current_weight_kg) */
export function calculateFat(
  dailyCalo: number,
  currentWeightKg: number,
): number {
  const fromCalories = (0.25 * dailyCalo) / 9;
  const minFromWeight = 0.8 * currentWeightKg;
  return round1(Math.max(fromCalories, minFromWeight));
}

export interface CarbResult {
  carbG: number;
  warnings: NutritionWarning[];
}

/**
 * carb_g = (daily_calo - protein_g*4 - fat_g*9) / 4, clamped at 0 when the
 * protein + fat requirement alone already exceeds the calorie budget — that
 * combination means the underlying profile is inconsistent (spec section 10).
 */
export function calculateCarb(
  dailyCalo: number,
  proteinG: number,
  fatG: number,
): CarbResult {
  const raw = (dailyCalo - proteinG * 4 - fatG * 9) / 4;
  if (raw < 0) {
    return {
      carbG: 0,
      warnings: [
        {
          code: "INVALID_CARB_PROFILE",
          message:
            "Hồ sơ không hợp lệ: nhu cầu protein và chất béo đã vượt quá lượng calo mục tiêu.",
        },
      ],
    };
  }
  return { carbG: round1(raw), warnings: [] };
}

/** water_ml = 35 x current_weight_kg */
export function calculateWater(currentWeightKg: number): number {
  return round1(35 * currentWeightKg);
}
