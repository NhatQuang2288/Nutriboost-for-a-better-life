import { describe, expect, it } from "vitest";
import { calculateWeightProgress } from "@/features/clients/progress";

describe("calculateWeightProgress", () => {
  it("tính đúng % hoàn thành giữa cân nặng ban đầu và mục tiêu", () => {
    const result = calculateWeightProgress(90, 84, 75);
    expect(result.lostKg).toBe(6);
    expect(result.remainingKg).toBe(9);
    expect(result.progressPercent).toBe(40); // 6 / (90-75) = 40%
  });

  it("khách mới thêm, chưa log cân nặng nào -> ban đầu = hiện tại -> 0%", () => {
    const result = calculateWeightProgress(70, 70, 60);
    expect(result.progressPercent).toBe(0);
  });

  it("đã đạt hoặc vượt mục tiêu -> không vượt quá 100%", () => {
    const result = calculateWeightProgress(90, 70, 75);
    expect(result.progressPercent).toBe(100);
  });
});
