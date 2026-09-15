import { NextRequest, NextResponse } from "next/server";
import { unauthorized, forbidden, notFound, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/invites/code";

const INVITE_TTL_DAYS = 7;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  // RLS already scopes this to the caller's own client, but we still check
  // explicitly to return a clean 404/403 instead of relying on RLS silence.
  const { data: client } = await supabase
    .from("clients")
    .select("id, pt_id, profile_id, full_name")
    .eq("id", clientId)
    .single();

  if (!client) return notFound("Không tìm thấy khách hàng.");
  if (client.pt_id !== user.id) return forbidden();
  if (client.profile_id) {
    return forbidden("Khách hàng này đã có tài khoản, không thể tạo mã mời mới.");
  }

  const { data: existing } = await supabase
    .from("client_invites")
    .select("code, expires_at, used_at")
    .eq("client_id", clientId)
    .maybeSingle();

  const stillValid =
    existing && !existing.used_at && new Date(existing.expires_at).getTime() > Date.now();

  if (stillValid) {
    return NextResponse.json({ code: existing.code, expiresAt: existing.expires_at });
  }

  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = existing
    ? await supabase
        .from("client_invites")
        .update({ code, expires_at: expiresAt, used_at: null })
        .eq("client_id", clientId)
    : await supabase.from("client_invites").insert({ client_id: clientId, code, expires_at: expiresAt });

  if (error) return serverError("Không thể tạo mã mời, vui lòng thử lại.");

  return NextResponse.json({ code, expiresAt }, { status: 201 });
}
