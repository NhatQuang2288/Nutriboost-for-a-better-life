import { z } from "zod";

export const createClientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ tên.")
    .max(100, "Họ tên quá dài."),
  age: z
    .number({ error: "Vui lòng nhập tuổi." })
    .int("Tuổi phải là số nguyên.")
    .min(10, "Tuổi phải từ 10 đến 100.")
    .max(100, "Tuổi phải từ 10 đến 100."),
  heightCm: z
    .number({ error: "Vui lòng nhập chiều cao." })
    .min(100, "Chiều cao phải từ 100cm đến 250cm.")
    .max(250, "Chiều cao phải từ 100cm đến 250cm."),
  weightKg: z
    .number({ error: "Vui lòng nhập cân nặng." })
    .min(20, "Cân nặng phải từ 20kg đến 400kg.")
    .max(400, "Cân nặng phải từ 20kg đến 400kg."),
  sex: z.enum(["male", "female"], { error: "Vui lòng chọn giới tính." }),
  activityLevel: z.enum(
    ["sedentary", "light", "moderate", "active", "very_active"],
    { error: "Vui lòng chọn mức vận động." },
  ),
  goalType: z.literal("lose_weight").default("lose_weight"),
  targetWeightKg: z
    .number({ error: "Vui lòng nhập cân nặng mục tiêu." })
    .min(20, "Cân nặng mục tiêu phải từ 20kg đến 400kg.")
    .max(400, "Cân nặng mục tiêu phải từ 20kg đến 400kg."),
  targetDate: z
    .string()
    .min(1, "Vui lòng chọn ngày mục tiêu.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Ngày mục tiêu không hợp lệ.")
    .refine((v) => new Date(v).getTime() > Date.now(), "Ngày mục tiêu phải ở tương lai."),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
