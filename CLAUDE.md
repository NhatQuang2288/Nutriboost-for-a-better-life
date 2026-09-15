# NutriBoost

SaaS cho PT/Coach/Nutrition Expert quản lý khách hàng thừa cân/béo phì. PT là người trả phí và dùng chính; Client (khách hàng) chỉ tham gia qua mã mời do PT tạo, không tự đăng ký.

## Stack (không được tự ý đổi)

Next.js 15.x (App Router) · TypeScript 5.x · React 19.x · Tailwind CSS 4.x · shadcn/ui · Supabase (Postgres + Auth + RLS) · TanStack Query 5.x · Zustand 5.x · Recharts 2.x · Vitest · Playwright · Vercel.

API luôn đi qua Next.js Route Handlers trong `app/api/**`. Không bao giờ query Supabase trực tiếp từ Client Component.

## Bảo mật — ưu tiên số 1

- RLS bật trên **toàn bộ** bảng (`supabase/migrations/20260915000004_rls_policies.sql`). PT chỉ thấy `clients.pt_id = auth.uid()`; client chỉ thấy dữ liệu của chính mình qua `clients.profile_id = auth.uid()`.
- Mọi API ghi dữ liệu phải tự kiểm tra quyền ở server (không chỉ dựa vào RLS): `Request → Route Handler → server authorization check → Supabase (RLS) → DB`.
- `SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng trong `app/api/**` và `lib/supabase/admin.ts` (`lib/supabase/admin.ts` import `server-only` để chặn lọt vào bundle client). Không bao giờ xuất hiện trong file `"use client"`.
- Giới hạn subscription (5/10/20 khách theo tier) phải được enforce ở server, trả `403 PLAN_LIMIT_REACHED` khi vượt — không chỉ disable nút ở frontend.

## Database

Schema nằm trong `supabase/migrations/`, chia theo thứ tự: enums → tables → helper functions/triggers → RLS policies → food search (unaccent + trigram) → `search_foods()` (hàm SQL tìm kiếm + phân trang 1 round-trip, dùng bởi `GET /api/foods`). File migration là nguồn sự thật — không sửa tên 10 bảng đã định nghĩa trong spec (`profiles`, `clients`, `nutrition_targets`, `meal_plans`, `meal_plan_items`, `meal_logs`, `progress_logs`, `subscriptions`, `foods`).

**Ngoại lệ đã thêm** (xem `supabase/migrations/20260915000006_simplify_invites.sql`): PT tạo `clients` với đầy đủ hồ sơ ngay từ đầu (`POST /api/clients`, kiểm tra hạn mức subscription tại thời điểm này) — `profile_id` để NULL cho tới khi khách join. `client_invites` chỉ còn là token (`client_id`, `code`, `expires_at`, `used_at`), không còn chứa hồ sơ nháp. `clients` có thêm cột `full_name` (không có trong 9 cột spec liệt kê) vì danh sách khách hàng cần hiển thị tên cho khách chưa join — lúc đó chưa có `profiles` row để lấy tên.

`types/database.ts` được viết tay khớp với migrations. Khi có Supabase project thật, có thể regenerate bằng `npx supabase gen types typescript` nhưng **migrations luôn là nguồn sự thật**, phải đối chiếu lại nếu lệch.

## Công thức dinh dưỡng (`lib/nutrition/`)

Pure functions, không gọi DB/API/UI. Xem `lib/nutrition/*.ts` cho công thức chính xác (BMI theo chuẩn châu Á IDI & WPRO, BMR Mifflin-St Jeor, TDEE theo activity factor, daily_calo = TDEE×0.8 với safety floor 1200 nữ/1500 nam, protein = 1.8×target_weight, fat = max(25%calo/9, 0.8×current_weight), carb clamp về 0 nếu âm, water = 35×current_weight). Mọi tính toán lại (recalculation) khi profile/weight/activity/goal đổi phải qua API — **frontend không tự tính, chỉ hiển thị kết quả từ server**.

Test: `tests/unit/nutrition.test.ts` (Vitest), bắt buộc ≥10 case bao gồm edge case tuổi 15/70, BMI 17/42, nữ thấp bé, nam cao lớn.

## Testing

- `npm run test` (Vitest): pure logic (`nutrition`, `clients-progress`, `timezone`) **và** `tests/unit/rls.test.ts` — test RLS thật trên Supabase project (không mock), tự tạo/xoá 2 PT + 2 client tạm để xác nhận PT B không đọc/ghi được dữ liệu của PT A. Cần `.env.local` (đã được `vitest.config.mts` tự load qua `loadEnv`).
- `npm run test:e2e` (Playwright, cần `npm run build` xong hoặc để Playwright tự chạy `npm run dev` qua `webServer`): `tests/e2e/pt-flow.spec.ts` + `client-flow.spec.ts` (2 luồng bắt buộc theo spec) và `tests/e2e/subscription.spec.ts` (test biên 5/10/20 khách → 403 `PLAN_LIMIT_REACHED`, chạy `serial` vì tạo nhiều dữ liệu tạm qua admin API).
- Mọi test tự dọn dữ liệu tạm (PT/client/subscription tạo qua `service_role`) trong `afterAll`, kể cả khi test fail giữa chừng.

## Ngôn ngữ & format

UI tiếng Việt có dấu; biến/hàm/tên bảng/cột tiếng Anh. Cân nặng 1 chữ số thập phân, calories số nguyên (làm tròn ở tầng hiển thị), ngày `dd/MM/yyyy`, tiền `750.000đ`. DB lưu UTC, hiển thị theo giờ Việt Nam. Font chữ: Be Vietnam Pro; số liệu: IBM Plex Mono (`app/layout.tsx`).

## Phạm vi Release 1

KHÔNG triển khai: AI sinh thực đơn/chatbot, email/push reminder, ghi buổi tập, messaging PT-client, export PDF, thanh toán online, ảnh món ăn. Bảng `meal_plans`/`meal_plan_items` đã có schema (kèm `generated_by`, `token_cost`) nhưng chưa có logic — chừa chỗ cho AI ở Release 2-3, không tự ý implement.

## Cấu trúc thư mục

```
app/(auth)/        Đăng ký, đăng nhập, join bằng invite code
app/(pt)/          Dashboard, quản lý khách hàng, meal plans (PT)
app/(client)/      Today, log meal, progress (client, mobile-first)
app/api/           Route Handlers — nơi duy nhất được dùng service role key
components/ui/     shadcn/ui primitives
components/charts/ Recharts wrappers
features/          Logic + UI theo domain (clients, meal-plan, tracking, subscription)
lib/supabase/      client.ts (browser) · server.ts (Server Component/RSC) · admin.ts (service role, server-only) · middleware.ts
lib/nutrition/     Pure functions tính BMI/BMR/TDEE/macro
supabase/          migrations/, seed.sql
data/foods/        CSV nguồn cho food database (seed vào Supabase, không hardcode trong TS)
types/database.ts  Types khớp migrations
tests/unit/        Vitest — nutrition, subscription limit, timezone
tests/e2e/         Playwright — flow PT và flow Client
```

## Quy tắc code

Không tạo TODO, function rỗng, hay "implement later". Không hardcode food database hoặc demo data trong component — mọi dữ liệu đi qua API → Database. Mọi màn hình cần đủ 4 state: loading/error/empty/success.
