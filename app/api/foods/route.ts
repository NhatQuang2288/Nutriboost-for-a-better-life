import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT));

  const { data, error } = await supabase.rpc("search_foods", {
    search_query: q,
    page_limit: limit,
    page_offset: (page - 1) * limit,
  });

  if (error) return serverError("Không thể tìm kiếm món ăn.");

  const total = data?.[0]?.total_count ?? 0;
  const foods = (data ?? []).map(({ total_count, ...food }) => {
    void total_count;
    return food;
  });

  return NextResponse.json({
    foods,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
