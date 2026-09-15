# NutriBoost

Professional Client Management & Nutrition Platform dành cho PT / Coach / Nutrition Expert quản lý khách hàng thừa cân/béo phì.

## Stack

Next.js 15 (App Router) · TypeScript 5 · React 19 · Tailwind CSS 4 · shadcn/ui · Supabase (Postgres + Auth + RLS) · TanStack Query 5 · Zustand 5 · Recharts 2 · Vitest · Playwright.

## Bắt đầu

1. Tạo project trên [supabase.com](https://supabase.com), copy `Project URL`, `anon key`, `service_role key`.
2. Sao chép `.env.local.example` thành `.env.local` và điền 3 giá trị trên.
3. Cài dependencies và chạy migrations:

```bash
npm install
npx supabase link --project-ref <project-ref>
npx supabase db push
```

4. Seed dữ liệu (300 món ăn, rồi demo data):

```bash
npm run seed:foods
npm run seed:demo
```

5. Chạy dev server:

```bash
npm run dev
```

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm run test` | Unit test + RLS integration test (Vitest) |
| `npm run test:e2e` | E2E test: flow PT, flow Client, subscription limit (Playwright) |
| `npm run seed:foods` | Nạp 300 món ăn từ `data/foods/foods.csv` |
| `npm run seed:demo` | Tạo 1 PT + 5 khách demo (đăng nhập được) kèm 14 ngày lịch sử — xem tài khoản in ra ở cuối log |

## Cấu trúc thư mục

Xem [CLAUDE.md](./CLAUDE.md) để biết chi tiết kiến trúc, quy ước, và các ràng buộc nghiệp vụ (công thức dinh dưỡng, RLS, giới hạn subscription...).
