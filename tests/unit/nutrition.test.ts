import { describe, expect, it } from "vitest";
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateCarb,
  assessWeightLossRate,
  calculateNutritionTargets,
} from "@/lib/nutrition";

describe("calculateBMI", () => {
  it("tính đúng BMI và làm tròn 1 chữ số thập phân", () => {
    expect(calculateBMI(60, 160)).toBeCloseTo(23.4, 1);
  });
});

describe("getBMICategory (chuẩn châu Á IDI & WPRO)", () => {
  it("BMI 17 -> Thiếu cân", () => {
    expect(getBMICategory(17)).toBe("Thiếu cân");
  });

  it("BMI 42 -> Béo phì độ II", () => {
    expect(getBMICategory(42)).toBe("Béo phì độ II");
  });

  it("biên dưới 18.5 -> Bình thường", () => {
    expect(getBMICategory(18.5)).toBe("Bình thường");
  });

  it("biên dưới 25.0 -> Béo phì độ I", () => {
    expect(getBMICategory(25.0)).toBe("Béo phì độ I");
  });
});

describe("calculateBMR (Mifflin-St Jeor)", () => {
  it("nam, tuổi 15 (edge case tuổi vị thành niên)", () => {
    expect(calculateBMR(55, 170, 15, "male")).toBeCloseTo(1542.5, 1);
  });

  it("nữ, tuổi 70 (edge case người lớn tuổi)", () => {
    expect(calculateBMR(65, 155, 70, "female")).toBeCloseTo(1107.8, 1);
  });
});

describe("calculateTDEE", () => {
  it("nhân đúng hệ số hoạt động cho từng mức", () => {
    const bmr = 1500;
    expect(calculateTDEE(bmr, "sedentary")).toBeCloseTo(1800, 1);
    expect(calculateTDEE(bmr, "light")).toBeCloseTo(2062.5, 1);
    expect(calculateTDEE(bmr, "moderate")).toBeCloseTo(2325, 1);
    expect(calculateTDEE(bmr, "active")).toBeCloseTo(2587.5, 1);
    expect(calculateTDEE(bmr, "very_active")).toBeCloseTo(2850, 1);
  });
});

describe("calculateDailyCalories", () => {
  it("nam, TDEE bình thường -> không bị clamp", () => {
    const result = calculateDailyCalories(2390.9, "male");
    expect(result.dailyCalo).toBeCloseTo(1912.7, 1);
    expect(result.warnings).toHaveLength(0);
  });

  it("nữ, TDEE thấp -> clamp về safety floor 1200 kcal và cảnh báo", () => {
    const result = calculateDailyCalories(1218.4, "female");
    expect(result.dailyCalo).toBe(1200);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe("SAFETY_FLOOR_CLAMPED");
  });
});

describe("calculateCarb", () => {
  it("protein + fat vượt quá calo mục tiêu -> clamp về 0 và cảnh báo hồ sơ không hợp lệ", () => {
    const result = calculateCarb(1200, 270, 33.6);
    expect(result.carbG).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe("INVALID_CARB_PROFILE");
  });
});

describe("assessWeightLossRate", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("tốc độ trong khuyến nghị (<=1%/tuần) -> không cảnh báo", () => {
    const targetDate = new Date(now.getTime() + 70 * 24 * 60 * 60 * 1000); // 10 tuần
    const warnings = assessWeightLossRate(80, 75, targetDate.toISOString(), now);
    expect(warnings).toHaveLength(0);
  });

  it("tốc độ quá nhanh (>1%/tuần) -> có cảnh báo", () => {
    const targetDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 tuần
    const warnings = assessWeightLossRate(80, 70, targetDate.toISOString(), now);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe("WEIGHT_LOSS_TOO_FAST");
  });
});

describe("calculateNutritionTargets (tích hợp toàn bộ công thức)", () => {
  // 20 tuần kể từ hiện tại, tránh cảnh báo tốc độ giảm cân quá nhanh
  const farFutureDate = new Date(Date.now() + 140 * 24 * 60 * 60 * 1000);

  it("nữ thấp bé -> daily_calo bị clamp về safety floor", () => {
    const result = calculateNutritionTargets({
      weightKg: 42,
      heightCm: 145,
      age: 30,
      sex: "female",
      activityLevel: "sedentary",
      targetWeightKg: 40,
      targetDate: farFutureDate.toISOString(),
    });

    expect(result.bmi).toBeCloseTo(20.0, 1);
    expect(result.dailyCalo).toBe(1200);
    expect(result.proteinG).toBeCloseTo(72, 1);
    expect(result.fatG).toBeCloseTo(33.6, 1);
    expect(result.carbG).toBeCloseTo(152.4, 1);
    expect(result.waterMl).toBeCloseTo(1470, 1);
    expect(result.warnings.map((w) => w.code)).toContain("SAFETY_FLOOR_CLAMPED");
  });

  it("nam cao lớn -> không có cảnh báo nào", () => {
    const result = calculateNutritionTargets({
      weightKg: 100,
      heightCm: 195,
      age: 28,
      sex: "male",
      activityLevel: "very_active",
      targetWeightKg: 90,
      targetDate: farFutureDate.toISOString(),
    });

    expect(result.bmi).toBeCloseTo(26.3, 1);
    expect(result.dailyCalo).toBeCloseTo(3167.4, 1);
    expect(result.proteinG).toBeCloseTo(162, 1);
    expect(result.waterMl).toBeCloseTo(3500, 1);
    expect(result.warnings).toHaveLength(0);
  });
});
