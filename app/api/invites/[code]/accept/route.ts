import { NextRequest, NextResponse } from "next/server";
import { acceptInviteSchema } from "@/lib/auth/schemas";
import { mapSupabaseAuthError } from "@/lib/auth/map-supabase-error";
import { apiError, notFound, validationError, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Explicit: this route touches SUPABASE_SERVICE_ROLE_KEY and must never be
// bundled for the Edge runtime (which middleware.ts uses).
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const parsed = acceptInviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { email, password } = parsed.data;

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("client_invites")
    .select("client_id, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();

  if (!invite) return notFound("Mã mời không tồn tại.");
  if (invite.used_at) return apiError("INVITE_ALREADY_USED", "Mã mời này đã được sử dụng.", 410);
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return apiError("INVITE_EXPIRED", "Mã mời đã hết hạn, vui lòng liên hệ PT để được cấp mã mới.", 410);
  }

  const { data: client } = await admin
    .from("clients")
    .select("full_name, profile_id")
    .eq("id", invite.client_id)
    .single();

  if (!client) return notFound("Không tìm thấy khách hàng cho mã mời này.");
  if (client.profile_id) {
    return apiError("INVITE_ALREADY_USED", "Mã mời này đã được sử dụng.", 410);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "client", full_name: client.full_name },
  });

  if (createError || !created.user) {
    const mapped = mapSupabaseAuthError(createError?.message ?? "");
    return apiError(mapped.code, mapped.message, mapped.status);
  }

  const { error: linkError } = await admin
    .from("clients")
    .update({ profile_id: created.user.id })
    .eq("id", invite.client_id);

  if (linkError) return serverError("Tạo tài khoản thành công nhưng liên kết khách hàng thất bại.");

  await admin
    .from("client_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("client_id", invite.client_id);

  // Sign the new client in immediately so they land straight on /c/today.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return NextResponse.json({ success: true, autoSignedIn: false });
  }

  return NextResponse.json({ success: true, autoSignedIn: true });
}
