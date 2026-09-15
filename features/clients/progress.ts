export interface WeightProgress {
  lostKg: number;
  remainingKg: number;
  progressPercent: number;
}

/**
 * Progress toward a weight-loss goal. `initialWeightKg` is the first known
 * weight for the client (their earliest progress_logs entry, or their
 * weight_kg at creation if they haven't logged one yet).
 */
export function calculateWeightProgress(
  initialWeightKg: number,
  currentWeightKg: number,
  targetWeightKg: number,
): WeightProgress {
  const lostKg = Math.round((initialWeightKg - currentWeightKg) * 10) / 10;
  const remainingKg = Math.round((currentWeightKg - targetWeightKg) * 10) / 10;
  const totalToLose = initialWeightKg - targetWeightKg;

  const progressPercent =
    totalToLose <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((lostKg / totalToLose) * 100)));

  return { lostKg, remainingKg, progressPercent };
}
