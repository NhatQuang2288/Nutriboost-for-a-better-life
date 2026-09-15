import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { validationError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { email } = parsed.data;
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  // Always respond success even if the email doesn't exist, so the endpoint
  // can't be used to enumerate registered PT accounts.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  return NextResponse.json({ success: true });
}
