import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/auth/schemas";
import { validationError, unauthorized, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Requires the recovery session set by app/auth/confirm/route.ts —
  // without a valid session this is not "forgot password", just unauthorized.
  if (!user) return unauthorized("Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return serverError("Không thể đặt lại mật khẩu, vui lòng thử lại.");

  return NextResponse.json({ success: true });
}
