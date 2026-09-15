import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];
const PT_PREFIXES = ["/dashboard", "/clients", "/meal-plans", "/foods", "/settings"];
const CLIENT_PREFIX = "/c";

function homeFor(role: "pt" | "client" | null): string {
  return role === "client" ? "/c/today" : "/dashboard";
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, role } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPtArea = PT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isClientArea = pathname === CLIENT_PREFIX || pathname.startsWith(`${CLIENT_PREFIX}/`);
  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && (isPtArea || isClientArea)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isGuestOnly) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  if (user && isPtArea && role !== "pt") {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  if (user && isClientArea && role !== "client") {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
