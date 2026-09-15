import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/schemas";
import { mapSupabaseAuthError } from "@/lib/auth/map-supabase-error";
import { apiError, validationError, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const mapped = mapSupabaseAuthError(error.message);
    return apiError(mapped.code, mapped.message, mapped.status);
  }
  if (!data.user) return serverError();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
    role: profile?.role ?? null,
    fullName: profile?.full_name ?? null,
  });
}
