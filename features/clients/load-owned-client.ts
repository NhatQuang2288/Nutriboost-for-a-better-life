import { forbidden, notFound } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";

/** Loads a client row and verifies the caller (a PT) owns it. */
export async function loadOwnedClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  clientId: string,
) {
  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
  if (!client) return { client: null, error: notFound("Không tìm thấy khách hàng.") };
  if (client.pt_id !== userId) return { client: null, error: forbidden() };
  return { client, error: null };
}
