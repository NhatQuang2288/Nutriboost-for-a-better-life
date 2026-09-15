interface MappedAuthError {
  code: string;
  message: string;
  status: number;
}

const KNOWN_ERRORS: Array<{ match: string; result: MappedAuthError }> = [
  {
    match: "User already registered",
    result: {
      code: "EMAIL_ALREADY_EXISTS",
      message: "Email này đã được đăng ký.",
      status: 409,
    },
  },
  {
    match: "Invalid login credentials",
    result: {
      code: "INVALID_CREDENTIALS",
      message: "Email hoặc mật khẩu không đúng.",
      status: 401,
    },
  },
  {
    match: "Email not confirmed",
    result: {
      code: "EMAIL_NOT_CONFIRMED",
      message: "Vui lòng xác nhận email trước khi đăng nhập.",
      status: 401,
    },
  },
  {
    match: "Password should be at least",
    result: {
      code: "WEAK_PASSWORD",
      message: "Mật khẩu quá yếu, vui lòng chọn mật khẩu khác.",
      status: 422,
    },
  },
  {
    match: "is invalid",
    result: {
      code: "INVALID_EMAIL",
      message: "Địa chỉ email không hợp lệ.",
      status: 422,
    },
  },
  {
    match: "email rate limit exceeded",
    result: {
      code: "EMAIL_RATE_LIMIT",
      message: "Hệ thống gửi email tạm thời quá tải, vui lòng thử lại sau ít phút.",
      status: 429,
    },
  },
];

export function mapSupabaseAuthError(rawMessage: string): MappedAuthError {
  const known = KNOWN_ERRORS.find((entry) => rawMessage.includes(entry.match));
  if (known) return known.result;

  return {
    code: "AUTH_ERROR",
    message: "Đã xảy ra lỗi xác thực, vui lòng thử lại.",
    status: 400,
  };
}
