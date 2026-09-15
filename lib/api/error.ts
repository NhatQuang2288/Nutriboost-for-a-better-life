import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function unauthorized(message = "Bạn cần đăng nhập để tiếp tục.") {
  return apiError("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Bạn không có quyền thực hiện thao tác này.") {
  return apiError("FORBIDDEN", message, 403);
}

export function notFound(message = "Không tìm thấy dữ liệu.") {
  return apiError("NOT_FOUND", message, 404);
}

export function validationError(error: ZodError) {
  const first = error.issues[0];
  return apiError(
    "VALIDATION_ERROR",
    first?.message ?? "Dữ liệu không hợp lệ.",
    422,
  );
}

export function serverError(message = "Đã xảy ra lỗi hệ thống, vui lòng thử lại.") {
  return apiError("INTERNAL_ERROR", message, 500);
}
