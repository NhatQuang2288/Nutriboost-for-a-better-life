import type { ActivityLevel } from "@/types/database";
import { round1 } from "./types";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return round1(bmr * ACTIVITY_FACTORS[activityLevel]);
}
