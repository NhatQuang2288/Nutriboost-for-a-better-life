// Flow PT: Đăng nhập -> Thêm client -> Đặt mục tiêu -> Xem nutrition metrics
// (spec section 37). The PT account is pre-provisioned via the admin API
// (bypassing Supabase's real signUp email step, which is rate-limited on
// free-tier projects) — the flow under test starts at "Đăng nhập" per spec.
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

const PASSWORD = "PtFlowTest123!";
const email = `pt-flow-${Date.now()}@nutriboost.test`;
let ptId: string;

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "pt", full_name: "PT Flow Test" },
  });
  if (error || !data.user) throw new Error(`setup failed: ${error?.message}`);
  ptId = data.user.id;

  const { error: subError } = await admin
    .from("subscriptions")
    .insert({ pt_id: ptId, tier: "plus", max_clients: 5 });
  if (subError) throw new Error(`subscription setup failed: ${subError.message}`);
});

test.afterAll(async () => {
  await admin.from("clients").delete().eq("pt_id", ptId);
  await admin.from("subscriptions").delete().eq("pt_id", ptId);
  await admin.auth.admin.deleteUser(ptId);
});

test("PT đăng nhập, thêm khách hàng, đặt mục tiêu, và xem đúng chỉ số dinh dưỡng đã tính", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("PT Flow Test")).toBeVisible();

  await page.goto("/clients/new");
  await page.getByLabel("Họ và tên").fill("Nguyễn Văn E2E");
  await page.getByLabel("Tuổi").fill("35");
  await page.getByRole("combobox").nth(0).click(); // Giới tính
  await page.getByRole("option", { name: "Nam" }).click();
  await page.getByLabel("Chiều cao (cm)").fill("178");
  await page.getByLabel("Cân nặng (kg)").fill("95");
  await page.getByRole("combobox").nth(1).click(); // Mức vận động
  await page.getByRole("option", { name: /Vận động vừa/ }).click();
  await page.getByLabel("Cân nặng mục tiêu (kg)").fill("80");
  await page.locator("#targetDate").fill("2027-06-30");
  await page.getByRole("button", { name: "Thêm khách hàng" }).click();

  // Client created -> invite link screen shown.
  await expect(page.getByText("Đã tạo khách hàng")).toBeVisible();

  const { data: client } = await admin
    .from("clients")
    .select("id")
    .eq("pt_id", ptId)
    .eq("full_name", "Nguyễn Văn E2E")
    .single();
  expect(client).toBeTruthy();

  await page.goto(`/clients/${client!.id}`);
  await expect(page.getByRole("heading", { name: "Nguyễn Văn E2E" })).toBeVisible();

  // BMI = 95 / 1.78^2 = 29.986 -> 30.0 (Béo phì độ II theo chuẩn châu Á)
  // BMR = 10*95 + 6.25*178 - 5*35 + 5 = 1892.5 -> hiển thị làm tròn 1893 kcal
  await expect(page.getByText("30.0")).toBeVisible();
  await expect(page.getByText("Béo phì độ II")).toBeVisible();
  await expect(page.getByText("1893 kcal")).toBeVisible();
  await expect(page.getByText("80.0 kg").first()).toBeVisible(); // cân nặng mục tiêu
});
