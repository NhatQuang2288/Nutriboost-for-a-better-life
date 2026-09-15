import type { Sex } from "@/types/database";
import { round1 } from "./types";

/** Mifflin-St Jeor equation. */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return round1(sex === "male" ? base + 5 : base - 161);
}
