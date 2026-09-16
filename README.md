<div align="center">

<!-- TODO(nhóm): chèn logo — lưu tại docs/assets/logo.png -->
<!-- <img src="docs/assets/logo.png" width="160" alt="NutriBoost logo"> -->

# NutriBoost

**Web app quản lý dinh dưỡng & tập luyện dùng AI — giúp PT/Coach kèm nhiều khách hơn mà không tốn thêm giờ soạn thực đơn.**

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000000)
![status](https://img.shields.io/badge/status-MVP%20đang%20phát%20triển-orange)

[Demo](#7-demo--ảnh-chụp-màn-hình) · [Cài đặt](#11-cài-đặt--chạy-local) · [API](#15-api) · [Deploy](#19-deploy) · [Roadmap](#21-roadmap)

</div>

---

## Mục lục

**Phần A — Giới thiệu dự án**

1. [Bối cảnh & Vấn đề](#3-bối-cảnh--vấn-đề)
2. [Giải pháp](#4-giải-pháp)
3. [Ai dùng sản phẩm này](#5-ai-dùng-sản-phẩm-này)
4. [Tính năng theo Release](#6-tính-năng-theo-release)
5. [Demo & Ảnh chụp màn hình](#7-demo--ảnh-chụp-màn-hình)
6. [Mô hình kinh doanh](#8-mô-hình-kinh-doanh)

**Phần B — Hướng dẫn kỹ thuật**

7. [Tech stack](#9-tech-stack)
8. [Yêu cầu hệ thống](#10-yêu-cầu-hệ-thống)
9. [Cài đặt & chạy local](#11-cài-đặt--chạy-local)
10. [Biến môi trường](#12-biến-môi-trường)
11. [Cấu trúc thư mục](#13-cấu-trúc-thư-mục)
12. [Data model](#14-data-model)
13. [API](#15-api)
14. [Kiến trúc AI](#16-kiến-trúc-ai)
15. [PWA & Nhắc nhở trên web](#17-pwa--nhắc-nhở-trên-web)
16. [Testing](#18-testing)
17. [Deploy](#19-deploy)

**Khác**

18. [Quy ước làm việc nhóm](#20-quy-ước-làm-việc-nhóm)
19. [Roadmap](#21-roadmap)
20. [Đóng góp](#22-đóng-góp)
21. [Thành viên nhóm](#23-thành-viên-nhóm)
22. [License & Liên hệ](#24-license--liên-hệ)

---

# PHẦN A — Giới thiệu dự án

## 3. Bối cảnh & Vấn đề

- PT soạn thực đơn **thủ công cho từng khách**, lặp lại mỗi tuần: **45–90 phút/khách** (so với 5–10 phút nếu dùng phần mềm).
- Với 10 khách, một PT mất **10–15 giờ/tuần** chỉ để soạn thực đơn; công việc hành chính chiếm **~30% thời gian làm việc**.
- Giới hạn thời gian khiến một PT full-time chỉ kèm nổi **15–25 khách/tuần** — hết chỗ là hết doanh thu. Coach online có thể kèm 30–50+ nếu được tự động hóa.
- Tới **80% PT bỏ nghề trong 2 năm** vì kiệt sức *(chuẩn quốc tế, TrueCoach 2025 — nhóm đang đo lại trên PT Việt Nam)*.
- Bối cảnh thị trường: ~25% người trưởng thành Việt Nam thừa cân/béo phì; chuỗi gym lớn thu hẹp từ 105 xuống 88 cơ sở trong chưa đầy một năm, đẩy PT sang tự kinh doanh và kèm online — đúng nhóm cần công cụ độc lập.


## 4. Giải pháp

| Vấn đề | NutriBoost giải quyết thế nào |
|---|---|
| Soạn thực đơn tốn thời gian | AI sinh thực đơn cá nhân hóa theo cân nặng, mục tiêu, khẩu vị từng khách — **chỉ dùng món trong cơ sở dữ liệu món Việt**, không bịa món |
| Không nắm được tình hình nhiều khách | Một màn hình duy nhất: dinh dưỡng + tiến độ + trạng thái hôm nay của toàn bộ khách đang kèm |
| Khách bỏ ngang giữa hai buổi tập | Nhắc nhở tự động chạy nền (email + web push), PT không cần nhắn tay |
| Đối thủ quốc tế tính giá USD | Tính bằng đồng, rẻ hơn Everfit ~50% ở cùng mức 5 khách, không cần thẻ quốc tế |

**Chỉ số mục tiêu:** giảm thời gian soạn 1 thực đơn từ **~60 phút xuống ~10 phút** (PT chỉ duyệt lại đề xuất của AI).

### Vì sao là web app, không phải app di động

| | Web app | App di động |
|---|---|---|
| Thời gian từ code đến tay PT | **30 giây** (Vercel deploy) | 1–4 tuần chờ duyệt store |
| Rào chắn phát hành | Không có | Google Play bắt tài khoản cá nhân mới **thử nghiệm đóng 14 ngày với ≥12 người** trước khi được phát hành |
| Sửa lỗi gấp | Deploy lại, người dùng F5 | Build lại, nộp lại, chờ duyệt lại |
| PT dùng trên máy tính | Đúng nhu cầu — PT soạn thực đơn khi ngồi máy | Màn hình nhỏ, gõ nhiều bất tiện |
| Khách dùng trên điện thoại | PWA "Thêm vào màn hình chính", chạy toàn màn hình | Trải nghiệm tốt hơn một chút |
| Đánh đổi | Web push trên iOS cần cài PWA trước; không truy cập được HealthKit | — |

Với MVP 4 tuần và mục tiêu Q4/2026 là **20 PT dùng thử miễn phí**, web thắng rõ rệt: chỉ cần gửi một đường link. App di động là việc của sau Release 2, khi đã có người dùng thật để chịu chi phí phát hành.

## 5. Ai dùng sản phẩm này

| Nhóm | Vai trò | Nhu cầu chính | Thiết bị chính |
|---|---|---|---|
| PT / Personal Trainer | Người dùng chính, trả phí | Quản lý nhiều khách cùng lúc, tiết kiệm thời gian soạn thực đơn | Máy tính |
| Coach online | Người dùng chính, trả phí | Kèm 30–50+ khách, cần tự động hóa cao | Máy tính |
| Nutrition Expert | Người dùng chính, trả phí | Theo dõi chỉ số dinh dưỡng, tư vấn dựa trên dữ liệu | Máy tính |
| Chuỗi phòng tập | Khách hàng B2B tiềm năng | Trang bị công cụ cho đội PT, quản lý tập trung | Máy tính |
| Khách của PT | Người thụ hưởng gián tiếp, **không trả tiền** | Xem thực đơn, log bữa ăn, theo dõi tiến độ | Điện thoại (PWA) |

> **Lưu ý khi thiết kế:** hai vai này dùng hai giao diện khác nhau trong cùng một codebase — PT ưu tiên desktop, khách ưu tiên mobile-first. Phân quyền và luồng onboarding phải tách bạch ngay từ Release 1.

## 6. Tính năng theo Release

### Release 1 — Core health tracking (MVP, 4 tuần)

- [ ] Đăng ký / đăng nhập PT
- [ ] Khách đăng nhập bằng mã mời do PT tạo
- [ ] Hồ sơ khách: tuổi, chiều cao, cân nặng, giới tính, mức vận động
- [ ] Đặt mục tiêu giảm cân
- [ ] Tính BMI / BMR / TDEE / hạn mức calo hàng ngày
- [ ] Dashboard PT: danh sách khách + trạng thái log hôm nay
- [ ] Ghi log bữa ăn thủ công (tìm món trong cơ sở dữ liệu)
- [ ] Theo dõi calo & macro cơ bản
- [ ] Daily summary
- [ ] Theo dõi tiến độ (biểu đồ cân nặng/calo 30 ngày)
- [ ] Cơ sở dữ liệu ~300 món Việt kèm calo và macro
- [ ] Giới hạn số khách theo gói (5/10/20) enforce ở tầng server

### Release 2 — Personalized healthy lifestyle

- [ ] AI sinh thực đơn 7 ngày cá nhân hóa
- [ ] PT duyệt / đổi món / sửa khẩu phần trước khi gửi khách
- [ ] Meal plan theo ngày phía khách + tick "đã ăn"
- [ ] Ghi nhận buổi tập
- [ ] Gợi ý bài tập phù hợp
- [ ] Theo dõi tiến độ tập luyện
- [ ] Nhắc nhở ăn uống/tập luyện (email + web push)
- [ ] Thông báo & tin nhắn động viên tự động

### Release 3 — AI-powered coaching

- [ ] Trợ lý AI dinh dưỡng dạng chat
- [ ] Hỏi–đáp về dinh dưỡng/thực đơn
- [ ] AI phân tích dữ liệu & đề xuất cá nhân hóa
- [ ] Đề xuất thích ứng theo thời gian thực
- [ ] Báo cáo & insight dài hạn

<!-- TODO(nhóm): điền ngày Release 1 chạy trên khách hàng thật đầu tiên + tên phòng tập thử nghiệm -->

## 7. Demo 

- **Demo live:** <!-- TODO(nhóm): https://nutriboost.vercel.app -->
- **Tài khoản PT dùng thử:** <!-- TODO(nhóm): email / mật khẩu demo -->
- **Tài khoản khách dùng thử:** <!-- TODO(nhóm): email / mật khẩu demo -->

## 8. Mô hình kinh doanh

Thuê bao theo **số khách đang kèm**:

| Gói | Giá/tháng | Số khách tối đa | Điểm khác biệt |
|---|---|---|---|
| Plus | 750.000đ | 5 | Thực đơn cá nhân hóa, quản lý lịch tập, nhắc nhở tự động, AI cơ bản |
| Premium | 1.125.000đ | 10 | Toàn bộ Plus + quản lý khách lớn hơn + AI & theo dõi nâng cao |
| Diamond | 1.800.000đ | 20 | Toàn bộ Premium + tối ưu quy trình chăm sóc quy mô lớn |

- Diamond = **90.000đ/khách/tháng**, tương đương 1–3% số tiền PT thu từ chính khách đó.
- ARPU pha trộn giả định (60% Plus / 30% Premium / 10% Diamond) ≈ **970.000đ/tháng**.
- Mục tiêu unit economics: churn < 5%/tháng · LTV/CAC ≥ 5:1 · hoàn vốn CAC < 4 tháng.

---

# PHẦN B — Hướng dẫn kỹ thuật

## 9. Tech stack

| Tầng | Công nghệ | Phiên bản | Vì sao chọn |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 15.x | Một codebase cho cả giao diện PT và khách; Server Component giữ khóa AI ở phía server |
| Ngôn ngữ | **TypeScript** | 5.x | Kiểu dữ liệu sinh thẳng từ schema Supabase, bắt lỗi trước khi chạy |
| UI | **React** | 19.x | — |
| CSS | **Tailwind CSS** + **shadcn/ui** | 4.x | AI sinh code Tailwind rất ổn định; shadcn/ui cho sẵn component chuẩn, sửa được tại chỗ |
| Database | **Supabase Postgres** | — | Postgres thật, kèm Row Level Security để chặn PT đọc khách của nhau |
| Auth | **Supabase Auth** (email + mật khẩu) | — | Không phải tự viết đăng nhập, không phải tự lưu mật khẩu |
| Truy vấn dữ liệu | **TanStack Query** | 5.x | Cache, revalidate, trạng thái loading/error có sẵn |
| Trạng thái client | **Zustand** | 5.x | Nhẹ, đủ cho phần trạng thái không thuộc server |
| Biểu đồ | **Recharts** | 2.x | Đủ cho biểu đồ cân nặng và calo |
| AI | **Google Gemini** — Flash (sinh thực đơn) + Flash-Lite (chat) | — | Khớp mô hình chi phí ở [mục 16](#16-kiến-trúc-ai) |
| Email | **Resend** | — | Nhắc nhở qua email, miễn phí ở quy mô MVP |
| Nhắc nhở định giờ | **Vercel Cron** | — | Không cần dựng server riêng |
| Kiểm thử | **Vitest** + **Playwright** | — | Vitest cho logic dinh dưỡng, Playwright cho luồng người dùng |
| Hạ tầng | **Vercel** | — | Mỗi Pull Request tự có một URL preview để review bằng mắt |

## 10. Yêu cầu hệ thống

- **Node.js ≥ 20 LTS** — kiểm tra bằng `node -v`
- **pnpm ≥ 9** — cài bằng `npm i -g pnpm`
- **Git** + tài khoản GitHub (khuyến nghị dùng **GitHub Desktop** nếu không quen dòng lệnh)
- **Tài khoản Supabase** (gói miễn phí đủ cho MVP)
- **API key Google Gemini** 
- **Tài khoản Vercel** (gói Hobby đủ cho MVP)
- Trình duyệt Chrome hoặc Edge bản mới để chạy và kiểm thử


## 11. Cài đặt & chạy local

```bash
# 1. Clone repo
git clone https://github.com/<org>/nutriboost.git
cd nutriboost
```

```bash
# 2. Cài dependency
pnpm install
```

```bash
# 3. Tạo file biến môi trường
cp .env.example .env.local
# mở .env.local và điền các giá trị bắt buộc (xem mục 12)
```

```bash
# 4. Đăng nhập Supabase CLI và liên kết dự án
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <project-ref-của-nhóm>
```

```bash
# 5. Chạy migration để tạo bảng
pnpm db:migrate
```

```bash
# 6. Nạp dữ liệu mẫu (1 PT demo + 5 khách + 14 ngày lịch sử + 300 món Việt)
pnpm db:seed
```

```bash
# 7. Chạy dev server
pnpm dev
```

Ứng dụng chạy tại **http://localhost:3000**

| Đường dẫn | Dành cho | Tài khoản seed |
|---|---|---|
| `/login` | PT đăng nhập | `pt.demo@nutriboost.vn` / `demo1234` |
| `/pt/dashboard` | Giao diện PT | — |
| `/c/today` | Giao diện khách | `khach.demo@nutriboost.vn` / `demo1234` |

**Các lệnh khác**

```bash
pnpm build          # build bản production
pnpm start          # chạy bản production đã build
pnpm lint           # kiểm tra ESLint
pnpm typecheck      # kiểm tra kiểu TypeScript
pnpm db:types       # sinh lại types/database.ts từ schema Supabase
pnpm db:reset       # xóa sạch và tạo lại database local
```

## 12. Biến môi trường

Chép từ `.env.example` sang `.env.local`. Biến có tiền tố `NEXT_PUBLIC_` sẽ **lộ ra trình duyệt** — không bao giờ đặt khóa bí mật ở đó.

| Tên biến | Bắt buộc | Lộ ra client | Mô tả | Ví dụ |
|---|:---:|:---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | URL dự án Supabase | `https://abcxyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Khóa công khai, bị RLS chặn nên an toàn | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ | Khóa toàn quyền, **chỉ dùng trong Route Handler và cron** | `eyJhbGci...` |
| `GEMINI_API_KEY` | ✅ | ❌ | API key Google Gemini | `AIza...` |
| `AI_MODEL_FULL` | ✅ | ❌ | Model sinh thực đơn | `gemini-flash-latest` |
| `AI_MODEL_LIGHT` | ✅ | ❌ | Model cho chat và tác vụ nhẹ | `gemini-flash-lite-latest` |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | URL gốc, dùng để tạo link mã mời | `http://localhost:3000` |
| `RESEND_API_KEY` | ✅ | ❌ | Gửi email nhắc nhở | `re_...` |
| `CRON_SECRET` | ✅ | ❌ | Chuỗi ngẫu nhiên, chặn người lạ gọi endpoint cron | `<32 ký tự ngẫu nhiên>` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ➖ | ✅ | Web push — khóa công khai | `B...` |
| `VAPID_PRIVATE_KEY` | ➖ | ❌ | Web push — khóa riêng | `...` |

✅ bắt buộc · ➖ chỉ cần khi bật web push (Release 2)

> ⚠️ **Không commit key thật.** Chỉ `.env.example` được đưa lên repo; `.env.local` phải nằm trong `.gitignore`. Khóa production khai báo trong **Vercel → Settings → Environment Variables**, không nằm trong code.

> 🔐 **Quy tắc vàng:** `SUPABASE_SERVICE_ROLE_KEY` bỏ qua toàn bộ RLS. Nếu nó lọt vào một file có `"use client"` ở đầu, bất kỳ ai mở DevTools cũng đọc được toàn bộ dữ liệu khách hàng. Trước khi merge, tìm nguyên văn chuỗi `SERVICE_ROLE` trong repo và chắc chắn nó chỉ xuất hiện trong `app/api/**` và `lib/supabase/admin.ts`.

## 13. Cấu trúc thư mục

nutriboost/
├── app/
│   ├── (auth)/                     # TV2 — đăng nhập, đăng ký, mã mời
│   │   ├── login/
│   │   ├── register/
│   │   └── join/[code]/
│   ├── (pt)/                       # TV4 — giao diện PT (desktop-first)
│   │   ├── dashboard/
│   │   ├── clients/[id]/
│   │   └── meal-plans/[id]/
│   ├── (client)/                   # TV5 — giao diện khách (mobile-first)
│   │   ├── today/
│   │   ├── log/
│   │   └── progress/
│   ├── api/
│   │   ├── ai/generate-meal-plan/  # TV3
│   │   ├── clients/                # TV2
│   │   └── cron/reminders/         # TV5
│   ├── layout.tsx                  # ⚠️ CHỈ TV1
│   └── globals.css                 # ⚠️ CHỈ TV1
├── components/
│   ├── ui/                         # TV5 — design system dùng chung
│   └── charts/                     # TV5
├── features/
│   ├── clients/                    # TV4
│   ├── meal-plan/
│   │   ├── logic/                  # TV3
│   │   └── ui-pt/                  # TV4
│   ├── tracking/                   # TV5
│   └── subscription/               # TV2
├── lib/
│   ├── supabase/                   # ⚠️ CHỈ TV1 (client.ts, server.ts, admin.ts)
│   ├── nutrition/                  # TV3 — BMI, BMR, TDEE, macro
│   └── ai/                         # TV3 — prompt template, parser, đo chi phí
├── supabase/
│   ├── migrations/                 # TV2 — schema & migration
│   └── seed.sql                    # TV5 — dữ liệu demo
├── data/foods/                     # TV2 — 300 món Việt (CSV nguồn)
├── types/database.ts               # ⚠️ CHỈ TV1 — sinh tự động bằng pnpm db:types
├── tests/
│   ├── unit/                       # Vitest
│   └── e2e/                        # Playwright
├── docs/                           # tài liệu, ERD, ảnh chụp màn hình
├── .env.example
├── CLAUDE.md                       # ⚠️ CHỈ TV1 — quy ước cho mọi phiên AI
└── README.md
```

> ⚠️ = file chung. Bốn thành viên còn lại **không bao giờ** sửa trực tiếp; cần thay đổi thì nhắn TV1.

## 14. Data model

Tên bảng và cột dưới đây là **hợp đồng dữ liệu** đã chốt — mọi phiên AI của mọi thành viên phải dùng đúng tên này. Quy ước: `snake_case` · mọi bảng có `id` kiểu `uuid` và `created_at` · thời gian lưu UTC, hiển thị giờ Việt Nam · tiền lưu bằng số nguyên đồng.

```
profiles (id, role, full_name, email, created_at)
   │ role = 'pt' | 'client'
   │
   ├─1─n clients (id, pt_id, profile_id, age, height_cm, weight_kg, sex,
   │              activity_level, goal_type, target_weight_kg, status)
   │        │
   │        ├─1─1 nutrition_targets (bmi, bmr, tdee, daily_calo,
   │        │                        protein_g, carb_g, fat_g, calculated_at)
   │        ├─1─n meal_plans (week_start, status, generated_by, token_cost)
   │        │        └─1─n meal_plan_items (day_index, meal_type, food_id, quantity)
   │        ├─1─n meal_logs (logged_at, meal_type, food_id, quantity, source)
   │        └─1─n progress_logs (logged_at, weight_kg, note)
   │
   └─1─1 subscriptions (tier, max_clients, started_at, status)
            tier = 'plus' (5) | 'premium' (10) | 'diamond' (20)

foods (id, name_vi, unit, calo_per_unit, protein_g, carb_g, fat_g, category, source)
   └── được tham chiếu bởi meal_plan_items.food_id và meal_logs.food_id
```

**Row Level Security — bắt buộc bật trên mọi bảng:**

| Bảng | Chính sách |
|---|---|
| `clients` | PT chỉ `SELECT/INSERT/UPDATE` được dòng có `pt_id = auth.uid()` |
| `meal_plans`, `meal_logs`, `progress_logs` | Chỉ truy cập qua `client_id` thuộc về PT đang đăng nhập, **hoặc** chính khách đó |
| `subscriptions` | PT chỉ đọc gói của chính mình, không được `UPDATE` (chỉ server đổi được) |
| `foods` | Đọc công khai với người đã đăng nhập, ghi chỉ bằng service role |

> **Cách kiểm thử RLS mà không cần đọc code:** tạo hai tài khoản PT, mỗi bên thêm một khách. Đăng nhập PT B — **không được** thấy khách của PT A. Đây là lỗi nghiêm trọng nhất có thể có trong sản phẩm này; test này phải chạy lại mỗi lần đổi schema.

<!-- TODO(nhóm): xuất ERD đầy đủ ra docs/erd.png -->

## 15. API

API là **Next.js Route Handlers** đặt trong `app/api/`. Xác thực bằng cookie phiên Supabase — không tự phát hành JWT, không tự lưu mật khẩu.

| Method | Endpoint | Auth | Mô tả |
|---|---|:---:|---|
| POST | `/api/clients` | PT | Thêm khách — **kiểm tra giới hạn gói trước khi ghi**, trả `403 PLAN_LIMIT_REACHED` khi đầy |
| GET | `/api/clients` | PT | Danh sách khách của PT hiện tại kèm trạng thái log hôm nay |
| PATCH | `/api/clients/[id]` | PT | Cập nhật hồ sơ, mục tiêu; tự tính lại `nutrition_targets` |
| POST | `/api/clients/[id]/invite` | PT | Tạo mã mời cho khách đăng nhập |
| POST | `/api/ai/generate-meal-plan` | PT | Sinh thực đơn 7 ngày bằng AI, lưu `draft` |
| PATCH | `/api/meal-plans/[id]` | PT | Duyệt / đổi món / sửa khẩu phần |
| GET | `/api/clients/[id]/progress` | PT, khách | Tiến độ cân nặng và calo theo khoảng ngày |
| POST | `/api/meal-logs` | Khách | Ghi một bữa đã ăn |
| POST | `/api/progress-logs` | Khách | Ghi cân nặng |
| POST | `/api/cron/reminders` | `CRON_SECRET` | Vercel Cron gọi mỗi giờ, gửi nhắc nhở đến hạn |

**Quy ước chung**

- Đăng ký, đăng nhập, đặt lại mật khẩu do **Supabase Auth** xử lý ở client — không có endpoint riêng.
- Lỗi trả về dạng `{ error: { code, message } }`; `code` viết `SCREAMING_SNAKE_CASE` để frontend hiển thị được thông báo tiếng Việt tương ứng.
- Mọi endpoint ghi dữ liệu đều **kiểm tra quyền lại ở server**, kể cả khi RLS đã chặn. Hai lớp, không phải một.

**Ví dụ — sinh thực đơn**

```http
POST /api/ai/generate-meal-plan
Content-Type: application/json

{ "client_id": "uuid", "week_start": "2026-09-21" }
```

```json
{
  "meal_plan_id": "uuid",
  "status": "draft",
  "days": [
    {
      "day_index": 0,
      "total_calo": 1820,
      "meals": [
        { "meal_type": "breakfast", "food_id": "uuid", "name_vi": "Phở bò tái", "quantity": 1, "calo": 430 }
      ]
    }
  ],
  "token_cost": { "input": 2140, "output": 3260, "vnd": 1180 }
}
```

<!-- TODO(nhóm): xuất OpenAPI ra docs/openapi.yaml khi API ổn định -->

## 16. Kiến trúc AI

| Tác vụ | Model | Tần suất | Lý do |
|---|---|---|---|
| Sinh thực đơn cá nhân hóa | `AI_MODEL_FULL` (hạng Flash) | ~4 lần/khách/tháng | Cần suy luận nhiều bước, ràng buộc calo và không lặp món |
| Chat trợ lý (Release 3) | `AI_MODEL_LIGHT` (hạng Flash-Lite) | ~50 lượt/khách/tháng | Hỏi–đáp ngắn, không cần model đắt |

**Ngân sách và ràng buộc chi phí**

- Giả định: ~83.000 token vào + ~37.000 token ra / khách / tháng.
- Chi phí ước tính: **~12.000đ/khách/tháng** ở cấu hình đắt nhất, **~600đ** ở cấu hình nhẹ.
- Ở gói Diamond (90.000đ/khách), chi phí AI chiếm ≤ 13% → **biên lợi nhuận gộp ≥ 85%**.
- Tối ưu: batch request (−50%), cache prompt hệ thống (−90% phần prompt lặp lại).

**Quy tắc kỹ thuật bắt buộc**

1. **Khóa AI chỉ tồn tại phía server.** Mọi lời gọi đi qua `app/api/ai/**`. Không bao giờ gọi Gemini từ Client Component.
2. **AI không được bịa món.** Prompt nhận vào danh sách `foods` lấy từ database và ràng buộc *"chỉ chọn trong danh sách này"*. Kết quả trả về được đối chiếu lại với bảng `foods`; món lạ bị loại.
3. **Luôn kiểm tra định dạng đầu ra.** Ép lược đồ JSON, thử lại tối đa 2 lần, sau đó trả lỗi rõ ràng cho PT thay vì hiện thực đơn hỏng.
4. **Ghi lại chi phí mỗi lần gọi** vào `meal_plans.token_cost`. Đây là số liệu đi thẳng vào slide unit economics khi gọi vốn.
5. **Ngưỡng chấp nhận:** chạy 20 lần với 20 hồ sơ khác nhau, **tỷ lệ lỗi phải dưới 20%** (sai định dạng, bịa món, hoặc lệch calo quá 5%). Chưa đạt thì không merge.

Prompt template đặt trong `lib/ai/prompts/`, mỗi lần sửa tăng số phiên bản trong tên file (`meal-plan.v3.ts`) để so sánh được chất lượng giữa các bản.

## 17. PWA & Nhắc nhở trên web

Khách dùng NutriBoost trên điện thoại qua trình duyệt. Để trải nghiệm gần với app:

- **Manifest + service worker** cho phép "Thêm vào màn hình chính", chạy toàn màn hình, có icon riêng.
- **Web Push** hoạt động trên Android Chrome ngay; **trên iOS Safari chỉ hoạt động sau khi người dùng đã cài PWA vào màn hình chính** (từ iOS 16.4). Vì vậy luồng onboarding của khách phải có một bước hướng dẫn "Thêm vào màn hình chính" — đừng bỏ qua, nếu không nửa số khách sẽ không nhận được nhắc nhở nào.
- **Email là kênh dự phòng bắt buộc.** Khách chưa cài PWA vẫn phải nhận được nhắc nhở qua email (Resend).
- **Vercel Cron** gọi `/api/cron/reminders` mỗi giờ; endpoint tự lọc ra khách đến giờ nhắc và khách chưa log trong ngày.

```json
// vercel.json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }
```

> Cron của Vercel chạy theo giờ UTC. Giờ nhắc của khách lưu theo giờ Việt Nam và phải quy đổi trong code — đây là chỗ rất dễ sai và rất khó phát hiện, nên có test riêng cho nó.

## 18. Testing

```bash
pnpm test              # Vitest — chạy toàn bộ unit test
pnpm test:watch        # chế độ watch khi đang sửa
pnpm test:coverage     # báo cáo coverage
pnpm test:e2e          # Playwright — chạy luồng người dùng thật
pnpm test:e2e:ui       # Playwright có giao diện, xem từng bước
```

**Bắt buộc phải có test cho bốn thứ sau** — đây là những chỗ sai mà không ai phát hiện bằng mắt:

| Hạng mục | Vì sao bắt buộc |
|---|---|
| Công thức BMI / BMR / TDEE / hạn mức calo | Sai số học sẽ cho ra con số trông hợp lý mà sai; phải đối chiếu tay ít nhất 10 ca |
| Giới hạn số khách theo gói | Lỗ hổng ở đây làm mất doanh thu trực tiếp |
| Phân quyền PT ↔ khách (RLS) | Lỗi nghiêm trọng nhất có thể có; phải test bằng hai tài khoản thật |
| Quy đổi múi giờ cho nhắc nhở | Sai lệch 7 tiếng, rất khó phát hiện bằng mắt |

- Quy ước đặt tên: `<tên-module>.test.ts` đặt cạnh file được test.
- Playwright chạy tối thiểu hai kịch bản: **luồng PT** (đăng nhập → thêm khách → sinh thực đơn → duyệt) và **luồng khách** (đăng nhập bằng mã mời → xem thực đơn → log bữa → xem tiến độ).

## 19. Deploy

| Môi trường | URL | Nguồn | Database | Ghi chú |
|---|---|---|---|---|
| Development | `http://localhost:3000` | máy cá nhân | Supabase dev | Mỗi người một nhánh |
| Preview | Vercel tự sinh URL cho **mỗi Pull Request** | nhánh của PR | Supabase dev | Review bằng cách bấm link, không cần đọc code |
| Production | <!-- TODO(nhóm): https://app.nutriboost.vn --> | `main` | Supabase prod | Dữ liệu thật |

**Quy trình deploy**

1. Nộp Pull Request → Vercel tự build và trả về một **URL preview**.
2. TV1 mở URL đó, bấm thử màn hình mới, xem `Files changed` để chắc không có file ngoài vùng sở hữu.
3. Merge vào `main` → Vercel tự deploy production trong khoảng 60 giây.

> 💡 **URL preview mỗi PR là tính năng quan trọng nhất của việc chọn web.** Nhóm không biết đọc code vẫn review được: mở link, bấm thử, thấy đúng thì merge. Với app di động thì không có thứ tương đương.

**Rollback**

- Vercel → tab **Deployments** → chọn bản trước → **Promote to Production**. Mất khoảng 30 giây, không cần build lại.
- Nếu lỗi do migration database: chạy `pnpm db:migrate:down` **trước** khi promote, vì code cũ không đọc được schema mới.

**Trước lần deploy production đầu tiên**

- [ ] Biến môi trường production đã khai đầy đủ trên Vercel
- [ ] RLS đã bật trên **mọi** bảng, đã test bằng hai tài khoản PT
- [ ] `SUPABASE_SERVICE_ROLE_KEY` không xuất hiện trong bất kỳ file client nào
- [ ] Đã bật sao lưu tự động trên Supabase
- [ ] Có trang chính sách quyền riêng tư truy cập công khai (bắt buộc với app xử lý dữ liệu sức khỏe)
- [ ] Có dòng miễn trừ *"thông tin trong app không thay thế tư vấn y tế"*

---

## 20. Quy ước làm việc nhóm

**Đặt tên branch** — có mã WBS để truy ngược được về backlog:

```
tv4/3.1-danh-sach-khach     # tính năng mới
fix/4.5-json-sai-dinh-dang  # sửa lỗi
docs/readme-web             # tài liệu
```

**Commit message** — Conventional Commits:

```
feat(meal-plan): sinh thực đơn 7 ngày từ hồ sơ khách
fix(auth): sửa lỗi phiên hết hạn không tự làm mới
docs(readme): bổ sung hướng dẫn deploy Vercel
```

**Pull request**

- Mỗi PR giải quyết đúng một đầu việc, **không quá 400 dòng thay đổi**. AI rất thích sinh PR 2.000 dòng — chia nhỏ trước khi nộp.
- Chỉ **TV1 review và merge**. Không merge trực tiếp vào `main`.
- CI (`lint` + `typecheck` + `test`) phải xanh.
- Cửa sổ nộp là **16:15 mỗi ngày**; nhánh sống quá 24 giờ gần như chắc chắn xung đột.

**Code style:** ESLint + Prettier, chạy `pnpm lint` trước khi commit. Cấu hình nằm ở gốc repo, không ai sửa ngoài TV1.

**Definition of Done** — một đầu việc chỉ xong khi đủ cả bảy:

1. Chạy được trên **URL preview**, không phải chỉ trên máy người viết
2. Không còn `TODO`, dữ liệu giả cứng hay hàm rỗng do AI để lại
3. Đã thử với dữ liệu xấu: trường trống, số âm, mất mạng
4. Có trạng thái đang tải và trạng thái lỗi trên giao diện
5. Đã xem trên cả Chrome desktop và Safari điện thoại
6. Người viết **giải thích được** phần code AI sinh ra
7. TV1 đã duyệt và merge

## 21. Roadmap

| Giai đoạn | Mục tiêu |
|---|---|
| Q4/2026 | 20 PT dùng thử miễn phí, đo thời gian tiết kiệm thực tế trên từng người |
| Q1/2027 | 25 PT trả phí, hoàn tất Release 2 |
| Q2–Q3/2027 | 80 PT trả phí, mở bán Plus & Premium |
| Q4/2027 | 150 PT trả phí, MRR ~145 triệu đ, ra Release 3 |
| Cuối vòng 18 tháng | 300 PT trả phí, MRR ~290 triệu đ, ký hợp đồng với 2 chuỗi phòng tập |

**Nợ kỹ thuật đã biết, sẽ trả sau MVP**

- [ ] Thanh toán thật (hiện đang đổi gói thủ công trong database)
- [ ] Xóa tài khoản và xuất dữ liệu cá nhân — cần cho tuân thủ quyền riêng tư
- [ ] Mở rộng cơ sở dữ liệu món Việt từ 300 lên 3.000+, kèm ảnh món
- [ ] Đóng gói app di động (Capacitor hoặc React Native) sau khi có người dùng thật

## 22. Đóng góp

1. Lấy bản mới nhất: GitHub Desktop → **Fetch origin** → **Pull**.
2. Tạo branch theo quy ước ở [mục 20](#20-quy-ước-làm-việc-nhóm).
3. Chạy `pnpm lint && pnpm typecheck && pnpm test` trước khi mở PR.
4. Mở PR, chờ Vercel build xong, **tự mở URL preview bấm thử trước** rồi mới gắn TV1 review.
5. Mô tả trong PR: làm gì, xem ở màn hình nào, đã thử những trường hợp nào.

<!-- TODO(nhóm): tách ra CONTRIBUTING.md nếu phần này dài thêm -->

## 23. Thành viên nhóm

| Tên | Vai trò | Vùng sở hữu | GitHub | Liên hệ |
|---|---|---|---|---|
| Lê Nguyễn Nhật Quang | **TV1** — Tech Lead / Tích hợp | File chung, review, merge, deploy | [@NhatQuang2288](https://github.com/username) | lenhatquang080420@gmail.com |
| Nguyễn Minh Quân | **TV2** — Dữ liệu & Tài khoản | `supabase/`, `app/(auth)/`, `features/subscription/`, `data/foods/` | | hi.minhquan2k6@gmail.com |
| Nguyễn Thị Tường Vy| **TV3** — Dinh dưỡng & AI | `lib/nutrition/`, `lib/ai/`, `app/api/ai/` | | nguyenthituongvy18052006@gmail.com |
| Trần Văn Nhân| **TV4** — Giao diện PT | `app/(pt)/`, `features/clients/`, `features/meal-plan/ui-pt/` | | vannhanff@gmail.com |
| Tăng Thành Tài | **TV5** — Giao diện khách, Design, QA | `app/(client)/`, `components/ui/`, `features/tracking/` | | tangthanhtai722006@gmail.com |

## 24. License & Liên hệ

**License:** Proprietary — bản quyền thuộc nhóm NutriBoost. Không sao chép, phân phối hoặc sử dụng lại mã nguồn khi chưa có văn bản đồng ý. <!-- TODO(nhóm): xác nhận lại trước khi công khai repo -->

**Liên hệ:** nutriboostteam22@gmail.com 

---

<div align="center">
<sub>NutriBoost — for a better life</sub>
</div>
