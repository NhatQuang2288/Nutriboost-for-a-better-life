import { NextRequest, NextResponse } from "next/server";
import { apiError, notFound } from "@/lib/api/error";
import { createAdminClient } from "@/lib/supabase/admin";

// Explicit: this route touches SUPABASE_SERVICE_ROLE_KEY and must never be
// bundled for the Edge runtime (which middleware.ts uses).
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
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
    .select("full_name, pt_id")
    .eq("id", invite.client_id)
    .single();

  if (!client) return notFound("Không tìm thấy khách hàng cho mã mời này.");

  const { data: pt } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", client.pt_id)
    .single();

  return NextResponse.json({
    fullName: client.full_name,
    ptFullName: pt?.full_name ?? "PT",
  });
}
