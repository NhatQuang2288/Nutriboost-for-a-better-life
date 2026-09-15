import type { ActivityLevel, Sex } from "@/types/database";

export interface NutritionProfileInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  targetWeightKg: number;
  targetDate: string; // ISO date (yyyy-MM-dd)
}

export interface NutritionWarning {
  code: "SAFETY_FLOOR_CLAMPED" | "WEIGHT_LOSS_TOO_FAST" | "INVALID_CARB_PROFILE";
  message: string;
}

export interface NutritionTargetsResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  dailyCalo: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  waterMl: number;
  warnings: NutritionWarning[];
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
