import { round1 } from "./types";

/** BMI = weight_kg / height_m^2, rounded to 1 decimal place. */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return round1(weightKg / (heightM * heightM));
}

/**
 * Asian BMI standard (IDI & WPRO) — deliberately stricter than the WHO
 * global standard. Must always be labeled "Theo chuẩn châu Á" in the UI.
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Thiếu cân";
  if (bmi < 23.0) return "Bình thường";
  if (bmi < 25.0) return "Thừa cân";
  if (bmi < 30.0) return "Béo phì độ I";
  return "Béo phì độ II";
}
