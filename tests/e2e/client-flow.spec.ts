// Flow Client: Join bằng invite code -> Đăng nhập -> Xem Today -> Log meal ->
// Ghi cân nặng -> Xem Progress (spec section 37). Uses the real
// POST /api/clients + POST /api/clients/[id]/invite endpoints to generate a
// genuine invite code, then drives the actual join/log/progress UI.
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

const PT_PASSWORD = "ClientFlowPt123!";
const CLIENT_PASSWORD = "ClientFlowUser123!";
const ptEmail = `client-flow-pt-${Date.now()}@nutriboost.test`;
const clientEmail = `client-flow-user-${Date.now()}@nutriboost.test`;

let ptId: string;
let clientId: string;
let inviteCode: string;
let clientProfileId: string | null = null;

test.beforeAll(async ({ request }) => {
  const { data: pt, error } = await admin.auth.admin.createUser({
    email: ptEmail,
    password: PT_PASSWORD,
    email_confirm: true,
    user_metadata: { role: "pt", full_name: "Client Flow PT" },
  });
  if (error || !pt.user) throw new Error(`PT setup failed: ${error?.message}`);
  ptId = pt.user.id;

  const { error: subError } = await admin
    .from("subscriptions")
    .insert({ pt_id: ptId, tier: "plus", max_clients: 5 });
  if (subError) throw new Error(`subscription setup failed: ${subError.message}`);

  const loginRes = await request.post("/api/auth/login", {
    data: { email: ptEmail, password: PT_PASSWORD },
  });
  if (!loginRes.ok()) throw new Error(`PT login failed: ${await loginRes.text()}`);

  const createRes = await request.post("/api/clients", {
    data: {
      fullName: "Khách Hàng Flow Test",
      age: 27,
      heightCm: 158,
      weightKg: 72,
      sex: "female",
      activityLevel: "light",
      goalType: "lose_weight",
      targetWeightKg: 58,
      targetDate: "2027-06-30",
    },
  });
  if (!createRes.ok()) throw new Error(`create client failed: ${await createRes.text()}`);
  const { client } = await createRes.json();
  clientId = client.id;

  const inviteRes = await request.post(`/api/clients/${clientId}/invite`);
  if (!inviteRes.ok()) throw new Error(`create invite failed: ${await inviteRes.text()}`);
  const inviteBody = await inviteRes.json();
  inviteCode = inviteBody.code;
});

test.afterAll(async () => {
  const { data: client } = await admin.from("clients").select("profile_id").eq("id", clientId).maybeSingle();
  clientProfileId = client?.profile_id ?? null;

  await admin.from("clients").delete().eq("id", clientId);
  await admin.from("subscriptions").delete().eq("pt_id", ptId);
  await admin.auth.admin.deleteUser(ptId);
  if (clientProfileId) await admin.auth.admin.deleteUser(clientProfileId);
});

test("Client join bằng mã mời, xem Today, ghi bữa ăn, ghi cân nặng, xem Progress", async ({ page }) => {
  await page.goto(`/join/${inviteCode}`);
  await expect(page.getByText("Khách Hàng Flow Test")).toBeVisible();

  await page.getByLabel("Email").fill(clientEmail);
  await page.getByLabel("Mật khẩu").fill(CLIENT_PASSWORD);
  await page.getByRole("button", { name: "Tham gia" }).click();

  await expect(page).toHaveURL(/\/c\/today/);
  await expect(page.getByText("Khách Hàng Flow Test")).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: "Ghi bữa ăn" }).click();
  await expect(page).toHaveURL(/\/c\/log/);

  await page.getByRole("button", { name: "Trưa" }).click();
  await page.getByPlaceholder("Tìm món ăn...").fill("pho bo");
  await expect(page.getByText("Phở bò", { exact: true })).toBeVisible();
  await page.getByText("Phở bò", { exact: true }).click();
  await page.getByRole("button", { name: "Lưu" }).click();

  await expect(page).toHaveURL(/\/c\/today/);
  await expect(page.getByText("450", { exact: true })).toBeVisible(); // Phở bò = 450 kcal, khẩu phần mặc định x1

  await page.getByRole("navigation").getByRole("link", { name: "Tiến độ" }).click();
  await expect(page).toHaveURL(/\/c\/progress/);
  await page.getByLabel("Cân nặng hôm nay (kg)").fill("71.2");
  const [postRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/progress-logs") && r.request().method() === "POST"),
    page.getByRole("button", { name: "Ghi cân nặng" }).click(),
  ]);
  expect(postRes.status()).toBe(201);
  const [getRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/progress-logs") && r.request().method() === "GET"),
    expect(page.getByText("Đã ghi cân nặng")).toBeVisible(),
  ]);
  const getBody = await getRes.json();
  expect(getBody.currentWeightKg).toBe(71.2);
  await expect(page.getByText("71.2 kg")).toBeVisible();
  await expect(page.getByText("Biểu đồ cân nặng 30 ngày")).toBeVisible();
});
