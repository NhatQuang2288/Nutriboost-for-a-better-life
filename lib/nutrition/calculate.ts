import { calculateBMI, getBMICategory } from "./bmi";
import { calculateBMR } from "./bmr";
import { calculateTDEE } from "./tdee";
import { calculateDailyCalories, assessWeightLossRate } from "./calories";
import { calculateProtein, calculateFat, calculateCarb, calculateWater } from "./macros";
import type { NutritionProfileInput, NutritionTargetsResult } from "./types";

/**
 * Single entry point for deriving a client's full nutrition_targets row.
 * Pure function — no DB/network access — so callers (API route handlers)
 * own persisting the result and stamping calculated_at.
 */
export function calculateNutritionTargets(
  input: NutritionProfileInput,
): NutritionTargetsResult {
  const { weightKg, heightCm, age, sex, activityLevel, targetWeightKg, targetDate } = input;

  const bmi = calculateBMI(weightKg, heightCm);
  const bmiCategory = getBMICategory(bmi);
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const tdee = calculateTDEE(bmr, activityLevel);
  const { dailyCalo, warnings: calorieWarnings } = calculateDailyCalories(tdee, sex);

  const proteinG = calculateProtein(targetWeightKg);
  const fatG = calculateFat(dailyCalo, weightKg);
  const { carbG, warnings: carbWarnings } = calculateCarb(dailyCalo, proteinG, fatG);
  const waterMl = calculateWater(weightKg);

  const weightLossWarnings = assessWeightLossRate(weightKg, targetWeightKg, targetDate);

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    dailyCalo,
    proteinG,
    carbG,
    fatG,
    waterMl,
    warnings: [...calorieWarnings, ...carbWarnings, ...weightLossWarnings],
  };
}
