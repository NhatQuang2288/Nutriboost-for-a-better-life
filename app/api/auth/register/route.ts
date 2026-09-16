import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/schemas";
import { mapSupabaseAuthError } from "@/lib/auth/map-supabase-error";
import { apiError, validationError, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Explicit: this route touches SUPABASE_SERVICE_ROLE_KEY and must never be
// bundled for the Edge runtime (which middleware.ts uses).
export const runtime = "nodejs";

const DEFAULT_TIER_MAX_CLIENTS = 5; // tier "plus"

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "pt", full_name: fullName } },
  });

  if (error) {
    const mapped = mapSupabaseAuthError(error.message);
    return apiError(mapped.code, mapped.message, mapped.status);
  }

  if (!data.user) return serverError();

  // Every new PT starts on the "plus" tier (Release 1 has no real billing —
  // tier changes happen manually in the database, see spec section 9).
  // Uses the admin client because `subscriptions` has no client-writable
  // RLS policy; this is a system-provisioning step, not a user action.
  const admin = createAdminClient();
  const { error: subError } = await admin.from("subscriptions").insert({
    pt_id: data.user.id,
    tier: "plus",
    max_clients: DEFAULT_TIER_MAX_CLIENTS,
  });

  if (subError) {
    return serverError("Tạo tài khoản thành công nhưng khởi tạo gói dịch vụ thất bại.");
  }

  return NextResponse.json(
    {
      user: { id: data.user.id, email: data.user.email },
      needsEmailConfirmation: !data.session,
    },
    { status: 201 },
  );
}
