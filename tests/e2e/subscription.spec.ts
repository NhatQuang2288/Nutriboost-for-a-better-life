// Hits the real running server (see webServer in playwright.config.ts) to
// prove POST /api/clients enforces the tier limit itself — RLS has no
// notion of "5 vs 10 vs 20 clients", so this can only be tested at the API
// layer, unlike tests/unit/rls.test.ts which tests the database layer.
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "SubTest123!";

function fillerClientPayload(pt_id: string, n: number) {
  return {
    pt_id,
    full_name: `Filler Client ${n}`,
    age: 30,
    height_cm: 165,
    weight_kg: 70,
    sex: "female" as const,
    activity_level: "moderate" as const,
    goal_type: "lose_weight" as const,
    target_weight_kg: 60,
    target_date: "2027-01-01",
    status: "active" as const,
  };
}

const TIERS: { tier: "plus" | "premium" | "diamond"; max: number }[] = [
  { tier: "plus", max: 5 },
  { tier: "premium", max: 10 },
  { tier: "diamond", max: 20 },
];

// Serial: each case hammers the Supabase admin API (createUser + bulk
// insert up to 20 rows) — running them in parallel workers causes spurious
// gateway timeouts unrelated to the app itself.
test.describe.configure({ mode: "serial" });

for (const { tier, max } of TIERS) {
  test(`gói ${tier} (${max} khách): đủ ${max}/${max} active -> request thêm khách kế tiếp trả 403 PLAN_LIMIT_REACHED`, async ({
    request,
  }) => {
    const email = `sub-${tier}-${Date.now()}@nutriboost.test`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: "pt", full_name: `Subscription Test PT ${tier}` },
    });
    expect(createError).toBeNull();
    const ptId = created!.user!.id;

    try {
      const { error: subError } = await admin
        .from("subscriptions")
        .insert({ pt_id: ptId, tier, max_clients: max });
      expect(subError).toBeNull();

      // Fill the tier to exactly its limit directly via admin (fast — the
      // thing under test is the boundary-crossing request, not each insert).
      const fillerPayloads = Array.from({ length: max }, (_, i) => fillerClientPayload(ptId, i));
      const { error: fillError } = await admin.from("clients").insert(fillerPayloads);
      expect(fillError).toBeNull();

      const loginRes = await request.post("/api/auth/login", {
        data: { email, password: PASSWORD },
      });
      expect(loginRes.status()).toBe(200);

      const { count } = await admin
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("pt_id", ptId)
        .eq("status", "active");
      expect(count).toBe(max); // sanity check: tier is genuinely full before the real assertion

      const res = await request.post("/api/clients", {
        data: {
          fullName: "Người vượt hạn mức",
          age: 28,
          heightCm: 170,
          weightKg: 65,
          sex: "female",
          activityLevel: "moderate",
          goalType: "lose_weight",
          targetWeightKg: 58,
          targetDate: "2027-01-01",
        },
      });

      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("PLAN_LIMIT_REACHED");

      // The rejected request must not have been persisted despite the 403.
      const { count: afterCount } = await admin
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("pt_id", ptId);
      expect(afterCount).toBe(max);
    } finally {
      await admin.from("clients").delete().eq("pt_id", ptId);
      await admin.from("subscriptions").delete().eq("pt_id", ptId);
      await admin.auth.admin.deleteUser(ptId);
    }
  });
}
