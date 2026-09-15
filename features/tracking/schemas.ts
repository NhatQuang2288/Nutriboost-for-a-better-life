import { z } from "zod";

export const mealTypeEnum = z.enum(["breakfast", "lunch", "dinner", "snack"], {
  error: "Vui lòng chọn loại bữa ăn.",
});

export const createMealLogSchema = z.object({
  mealType: mealTypeEnum,
  foodId: z.string().uuid("Món ăn không hợp lệ."),
  quantity: z
    .number({ error: "Vui lòng nhập khẩu phần." })
    .positive("Khẩu phần phải lớn hơn 0.")
    .max(50, "Khẩu phần không hợp lệ."),
});

export type CreateMealLogInput = z.infer<typeof createMealLogSchema>;

export const createProgressLogSchema = z.object({
  weightKg: z
    .number({ error: "Vui lòng nhập cân nặng." })
    .min(20, "Cân nặng phải từ 20kg đến 400kg.")
    .max(400, "Cân nặng phải từ 20kg đến 400kg."),
  note: z.string().trim().max(200, "Ghi chú quá dài.").optional(),
});

export type CreateProgressLogInput = z.infer<typeof createProgressLogSchema>;
