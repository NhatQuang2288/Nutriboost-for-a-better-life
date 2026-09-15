// Integration test against the real Supabase project (not mocked): proves
// Row Level Security itself blocks cross-tenant access at the database
// layer, independent of any authorization check our own API code does.
// Needs NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
// SUPABASE_SERVICE_ROLE_KEY from .env.local (loaded by vitest.config.mts).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RUN_ID = Date.now();
const PASSWORD = "RlsTest123!";

interface Tenant {
  userId: string;
  email: string;
  clientId: string;
  session: SupabaseClient;
}

async function createPtWithClient(label: string): Promise<Tenant> {
  const email = `rls-${label}-${RUN_ID}@nutriboost.test`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "pt", full_name: `RLS Test PT ${label}` },
  });
  if (createError || !created.user) throw new Error(`setup failed: ${createError?.message}`);

  const { error: subError } = await admin
    .from("subscriptions")
    .insert({ pt_id: created.user.id, tier: "plus", max_clients: 5 });
  if (subError) throw new Error(`subscription setup failed: ${subError.message}`);

  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({
      pt_id: created.user.id,
      full_name: `Client of ${label}`,
      age: 30,
      height_cm: 165,
      weight_kg: 70,
      sex: "female",
      activity_level: "moderate",
      target_weight_kg: 60,
      target_date: "2027-01-01",
    })
    .select()
    .single();
  if (clientError || !client) throw new Error(`client setup failed: ${clientError?.message}`);

  // persistSession: false keeps each client's session in memory only — two
  // clients sharing the same jsdom localStorage would otherwise collide on
  // the same "sb-<project>-auth-token" key and silently overwrite each
  // other's session (that's what the "Multiple GoTrueClient instances"
  // warning is about).
  const session = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await session.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw new Error(`sign-in failed: ${signInError.message}`);

  return { userId: created.user.id, email, clientId: client.id, session };
}

async function cleanupTenant(tenant: Tenant) {
  await admin.from("clients").delete().eq("id", tenant.clientId);
  await admin.from("subscriptions").delete().eq("pt_id", tenant.userId);
  await admin.auth.admin.deleteUser(tenant.userId);
}

describe("Row Level Security: PT A không được thấy khách hàng của PT B", () => {
  let ptA: Tenant;
  let ptB: Tenant;

  beforeAll(async () => {
    [ptA, ptB] = await Promise.all([createPtWithClient("a"), createPtWithClient("b")]);
  }, 30000);

  afterAll(async () => {
    await Promise.all([cleanupTenant(ptA), cleanupTenant(ptB)]);
  }, 30000);

  it("PT B chỉ thấy client của chính mình khi SELECT toàn bộ bảng clients", async () => {
    const { data, error } = await ptB.session.from("clients").select("id, pt_id");
    expect(error).toBeNull();
    const ids = (data ?? []).map((c) => c.id);
    expect(ids).toContain(ptB.clientId);
    expect(ids).not.toContain(ptA.clientId);
  });

  it("PT B truy vấn trực tiếp client của PT A bằng id -> trả về rỗng, không lỗi, không lộ dữ liệu", async () => {
    const { data, error } = await ptB.session.from("clients").select("*").eq("id", ptA.clientId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("PT A chỉ thấy client của chính mình (đối xứng, không chỉ 1 chiều)", async () => {
    const { data } = await ptA.session.from("clients").select("id");
    const ids = (data ?? []).map((c) => c.id);
    expect(ids).toContain(ptA.clientId);
    expect(ids).not.toContain(ptB.clientId);
  });

  it("PT B không thể UPDATE client của PT A (RLS chặn ở tầng ghi, không chỉ đọc)", async () => {
    const { data, error } = await ptB.session
      .from("clients")
      .update({ weight_kg: 65 })
      .eq("id", ptA.clientId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]); // 0 dòng bị ảnh hưởng, thay vì đổi được dữ liệu của người khác

    const { data: unchanged } = await admin
      .from("clients")
      .select("weight_kg")
      .eq("id", ptA.clientId)
      .single();
    expect(unchanged?.weight_kg).toBe(70);
  });
});
