# Nutriboost-for-a-better-life
<div align="center">

<!-- TODO: chèn logo NutriBoost -->
<!-- <img src="docs/assets/logo.png" width="160" alt="NutriBoost logo"> -->

# NutriBoost

**Phần mềm quản lý dinh dưỡng & tập luyện dùng AI, giúp PT/Coach kèm nhiều khách hơn mà không tốn thêm giờ soạn thực đơn.**

<!-- TODO: bật lại các badge khi đã có CI / release / license -->
<!-- ![build](https://img.shields.io/badge/build-passing-brightgreen) -->
<!-- ![version](https://img.shields.io/badge/version-0.1.0-blue) -->
<!-- ![license](https://img.shields.io/badge/license-TODO-lightgrey) -->

[Demo](#7-demo--ảnh-chụp-màn-hình) · [Cài đặt](#11-cài-đặt--chạy-local) · [API](#15-api) · [Roadmap](#20-roadmap)

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
15. [Testing](#17-testing)
16. [Deploy](#18-deploy)

**Khác**

17. [Quy ước làm việc nhóm](#19-quy-ước-làm-việc-nhóm)
18. [Roadmap](#20-roadmap)
19. [Đóng góp](#21-đóng-góp)
20. [Thành viên nhóm](#22-thành-viên-nhóm)
21. [License & Liên hệ](#23-license--liên-hệ)

---

# PHẦN A — Giới thiệu dự án

## 3. Bối cảnh & Vấn đề

- PT soạn thực đơn **thủ công cho từng khách**, lặp lại mỗi tuần: **45–90 phút/khách** (so với 5–10 phút nếu dùng phần mềm).
- Với 10 khách, một PT mất **10–15 giờ/tuần** chỉ để soạn thực đơn; công việc hành chính chiếm **~30% thời gian làm việc**.
- Giới hạn thời gian khiến một PT full-time chỉ kèm nổi **15–25 khách/tuần** — hết chỗ là hết doanh thu.
- Tới **80% PT bỏ nghề trong 2 năm** vì kiệt sức *(chuẩn quốc tế, TrueCoach 2025 — nhóm đang đo lại trên PT Việt Nam)*.

> <!-- TODO: chèn link nguồn cho từng số liệu -->

## 4. Giải pháp

| Vấn đề | NutriBoost giải quyết thế nào |
|---|---|
| Soạn thực đơn tốn thời gian | AI sinh thực đơn cá nhân hóa theo cân nặng, mục tiêu, khẩu vị từng khách |
| Không nắm được tình hình nhiều khách | Một màn hình duy nhất: lịch tập + dinh dưỡng + tiến độ của toàn bộ khách đang kèm |
| Khách bỏ ngang giữa hai buổi tập | Nhắc nhở tự động chạy nền, PT không cần nhắn tay |

**Chỉ số mục tiêu:** giảm thời gian soạn 1 thực đơn từ **~60 phút xuống ~10 phút** (PT chỉ duyệt lại đề xuất của AI).

## 5. Ai dùng sản phẩm này

| Nhóm | Vai trò | Nhu cầu chính |
|---|---|---|
| PT / Personal Trainer | Người dùng chính, trả phí | Quản lý nhiều khách cùng lúc, tiết kiệm thời gian soạn giáo án/thực đơn |
| Coach online | Người dùng chính, trả phí | Kèm 30–50+ khách, cần tự động hóa cao |
| Nutrition Expert | Người dùng chính, trả phí | Theo dõi chỉ số dinh dưỡng, tư vấn dựa trên dữ liệu |
| Chuỗi phòng tập | Khách hàng B2B tiềm năng | Trang bị công cụ cho đội PT, quản lý tập trung |

> **Lưu ý khi thiết kế:** khách của PT (người thừa cân/béo phì, fitness enthusiast) là **người thụ hưởng gián tiếp**, không phải người trả tiền. Phân quyền và luồng onboarding phải tách bạch hai vai này.

## 6. Tính năng theo Release

### Release 1 — Core health tracking (MVP)

- [ ] Đăng ký / đăng nhập
- [ ] Hồ sơ cơ bản: tuổi, chiều cao, cân nặng, giới tính
- [ ] Đặt mục tiêu giảm cân
- [ ] Tính BMI / hạn mức calo hàng ngày
- [ ] Ghi log bữa ăn thủ công
- [ ] Theo dõi calo & dinh dưỡng cơ bản
- [ ] Daily summary
- [ ] Theo dõi tiến độ cơ bản (cân nặng/calo)

### Release 2 — Personalized healthy lifestyle

- [ ] Gợi ý thực đơn cá nhân hóa
- [ ] Meal plan theo ngày
- [ ] Ghi nhận buổi tập
- [ ] Gợi ý bài tập phù hợp
- [ ] Theo dõi tiến độ tập luyện
- [ ] Đặt nhắc nhở ăn uống/tập luyện
- [ ] Thông báo & tin nhắn động viên tự động

### Release 3 — AI-powered coaching

- [ ] Trợ lý AI dinh dưỡng dạng chat
- [ ] Hỏi–đáp về dinh dưỡng/thực đơn
- [ ] AI phân tích dữ liệu & đề xuất cá nhân hóa
- [ ] Đề xuất thích ứng theo thời gian thực
- [ ] Báo cáo & insight dài hạn

<!-- TODO: điền ngày Release 1 chạy trên khách hàng thật đầu tiên + tên phòng tập thử nghiệm -->

## 7. Demo & Ảnh chụp màn hình

<!-- TODO: thay bằng ảnh/GIF thật trong docs/assets/ -->

| | |
|---|---|
| ![Dashboard](docs/assets/screenshot-dashboard.png)<br>*Màn hình tổng quan khách hàng* | ![Meal plan](docs/assets/screenshot-mealplan.png)<br>*Thực đơn AI sinh theo ngày* |

- **Demo live:** <!-- TODO: URL -->
- **Tài khoản dùng thử:** <!-- TODO: email / mật khẩu demo -->

## 8. Mô hình kinh doanh

Thuê bao theo **số khách đang kèm**:

| Gói | Giá/tháng | Số khách tối đa | Điểm khác biệt |
|---|---|---|---|
| Plus | 750.000đ | 5 | Thực đơn cá nhân hóa, quản lý lịch tập, nhắc nhở tự động, AI cơ bản |
| Premium | 1.125.000đ | 10 | Toàn bộ Plus + quản lý khách lớn hơn + AI & theo dõi nâng cao |
| Diamond | 1.800.000đ | 20 | Toàn bộ Premium + tối ưu quy trình chăm sóc quy mô lớn |

> ⚙️ **Ràng buộc kỹ thuật:** giới hạn 5/10/20 khách là ranh giới nâng gói — logic phân quyền theo số lượng client phải được enforce ở tầng backend ngay từ Release 1, không chỉ ẩn nút ở frontend.

Chi tiết thị trường, unit economics, đối thủ: xem [`docs/business-context.md`](docs/business-context.md) <!-- TODO: link tài liệu ngữ cảnh dự án -->

---

# PHẦN B — Hướng dẫn kỹ thuật

## 9. Tech stack

| Tầng | Công nghệ | Phiên bản |
|---|---|---|
| Frontend | <!-- TODO: React / Next.js / Flutter ... --> | |
| Backend | <!-- TODO: Node.js / NestJS / Django ... --> | |
| Database | <!-- TODO: PostgreSQL / MongoDB ... --> | |
| AI | <!-- TODO: nhà cung cấp + model --> | |
| Hạ tầng | <!-- TODO: Docker / Vercel / AWS ... --> | |

## 10. Yêu cầu hệ thống

- <!-- TODO: Node >= x.x --> 
- <!-- TODO: Package manager (npm / pnpm / yarn) -->
- <!-- TODO: Database local hoặc Docker Desktop -->
- API key của nhà cung cấp AI (xem [Biến môi trường](#12-biến-môi-trường))

## 11. Cài đặt & chạy local

```bash
# 1. Clone repo
git clone https://github.com/<org>/nutriboost.git
cd nutriboost
```

```bash
# 2. Cài dependency
<!-- TODO --> npm install
```

```bash
# 3. Tạo file biến môi trường
cp .env.example .env
# mở .env và điền các giá trị bắt buộc
```

```bash
# 4. Khởi tạo database
<!-- TODO --> npm run db:migrate
```

```bash
# 5. Nạp dữ liệu mẫu (PT demo + 3 khách mẫu)
<!-- TODO --> npm run db:seed
```

```bash
# 6. Chạy dev server
<!-- TODO --> npm run dev
```

Ứng dụng chạy tại **http://localhost:3000** <!-- TODO: cập nhật cổng thật -->

## 12. Biến môi trường

| Tên biến | Bắt buộc | Mô tả | Ví dụ |
|---|:---:|---|---|
| `DATABASE_URL` | ✅ | Chuỗi kết nối database | `postgresql://user:pass@localhost:5432/nutriboost` |
| `JWT_SECRET` | ✅ | Khóa ký token đăng nhập | `<chuỗi ngẫu nhiên >= 32 ký tự>` |
| `AI_API_KEY` | ✅ | API key nhà cung cấp AI | `sk-...` |
| `AI_MODEL_LIGHT` | ✅ | Model nhẹ cho chat thường xuyên | <!-- TODO --> |
| `AI_MODEL_FULL` | ✅ | Model đầy đủ cho sinh thực đơn | <!-- TODO --> |
| `APP_URL` | ✅ | URL gốc của ứng dụng | `http://localhost:3000` |
| <!-- TODO --> | | | |

> ⚠️ **Không commit key thật.** Chỉ `.env.example` được đưa lên repo; `.env` phải nằm trong `.gitignore`.

## 13. Cấu trúc thư mục

```
nutriboost/
├── src/
│   ├── <!-- TODO -->        # 
│   ├── <!-- TODO -->        # 
│   └── <!-- TODO -->        # 
├── prisma/ | migrations/    # schema & migration database
├── tests/                   # unit & integration test
├── docs/                    # tài liệu dự án, ERD, ảnh chụp màn hình
├── .env.example             # mẫu biến môi trường
└── README.md
```

## 14. Data model

Entity chính và quan hệ:

```
User (PT/Coach)
 └── 1–n Client (khách của PT)
        ├── 1–n MealPlan      # thực đơn theo ngày/tuần
        ├── 1–n Exercise      # buổi tập đã ghi nhận
        └── 1–n ProgressLog   # cân nặng, calo, chỉ số theo thời gian
User
 ├── 1–1 Subscription        # Plus / Premium / Diamond → giới hạn số Client
 └── 1–n AIChatSession       # phiên chat với trợ lý AI
```

<!-- TODO: link sơ đồ ERD đầy đủ, ví dụ docs/erd.png -->

## 15. API

| Method | Endpoint | Auth | Mô tả |
|---|---|:---:|---|
| POST | `/auth/register` | — | Đăng ký tài khoản PT |
| POST | `/auth/login` | — | Đăng nhập, trả JWT |
| GET | `/clients` | ✅ | Danh sách khách của PT hiện tại |
| POST | `/clients` | ✅ | Thêm khách (kiểm tra giới hạn gói) |
| POST | `/clients/:id/meal-plans` | ✅ | Sinh thực đơn bằng AI |
| GET | `/clients/:id/progress` | ✅ | Tiến độ của một khách |
| <!-- TODO --> | | | |

📘 Tài liệu đầy đủ: <!-- TODO: link Swagger / Postman collection -->

## 16. Kiến trúc AI

| Tác vụ | Model | Lý do |
|---|---|---|
| Chat trợ lý (tần suất cao) | Model nhẹ (hạng Flash-Lite) | ~600đ/khách/tháng, đủ chất lượng cho hỏi–đáp ngắn |
| Sinh thực đơn cá nhân hóa | Model đầy đủ (hạng Flash) | Cần suy luận nhiều bước, chạy 4 lần/khách/tháng |

- **Ngân sách token giả định:** ~83.000 token vào + ~37.000 token ra / khách / tháng.
- **Ràng buộc chi phí:** giữ chi phí AI ≤ 13% doanh thu/khách để biên lợi nhuận gộp ≥ 85%.
- **Tối ưu:** batch request (−50%), cache prompt hệ thống (−90% phần prompt lặp).
- **Quản lý prompt:** <!-- TODO: nêu thư mục chứa prompt template và cách version hóa -->

## 17. Testing

```bash
<!-- TODO --> npm test              # chạy toàn bộ test
<!-- TODO --> npm run test:watch    # chế độ watch
<!-- TODO --> npm run test:coverage # báo cáo coverage
```

- Quy ước đặt tên: `<tên-module>.test.ts` đặt cạnh file được test *(hoặc trong `tests/`)*.
- Bắt buộc có test cho: logic giới hạn số khách theo gói, tính BMI/calo, phân quyền PT–Client.

## 18. Deploy

| Môi trường | URL | Branch | Ghi chú |
|---|---|---|---|
| Development | http://localhost:3000 | bất kỳ | chạy local |
| Staging | <!-- TODO --> | `develop` | dữ liệu giả |
| Production | <!-- TODO --> | `main` | dữ liệu thật |

- **CI/CD:** <!-- TODO: GitHub Actions / workflow nào chạy khi nào -->
- **Rollback:** <!-- TODO: cách quay về bản trước -->

---

## 19. Quy ước làm việc nhóm

**Đặt tên branch**

```
feature/<mô-tả-ngắn>    # tính năng mới
fix/<mô-tả-ngắn>        # sửa lỗi
docs/<mô-tả-ngắn>       # tài liệu
```

**Commit message** — theo Conventional Commits:

```
feat(meal-plan): sinh thực đơn 7 ngày từ hồ sơ khách
fix(auth): sửa lỗi token hết hạn không refresh
docs(readme): bổ sung hướng dẫn cài đặt
```

**Pull request**

- Mỗi PR giải quyết đúng một việc, mô tả rõ thay đổi và cách kiểm thử.
- Cần **<!-- TODO: 1 hay 2 --> người review** approve trước khi merge.
- CI phải xanh; không merge trực tiếp vào `main`.

**Code style:** <!-- TODO: ESLint + Prettier / Black ... --> chạy `npm run lint` trước khi commit.

## 20. Roadmap

| Giai đoạn | Mục tiêu |
|---|---|
| Q4/2026 | 20 PT dùng thử miễn phí, đo thời gian tiết kiệm thực tế trên từng người |
| Q1/2027 | 25 PT trả phí, hoàn tất Release 2 |
| Q2–Q3/2027 | 80 PT trả phí, mở bán Plus & Premium |
| Q4/2027 | 150 PT trả phí, MRR ~145 triệu đ, ra Release 3 |
| Cuối vòng 18 tháng | 300 PT trả phí, MRR ~290 triệu đ, ký hợp đồng với 2 chuỗi phòng tập |

## 21. Đóng góp

1. Fork repo và tạo branch theo quy ước ở [mục 19](#19-quy-ước-làm-việc-nhóm).
2. Chạy test và lint trước khi mở PR.
3. Mô tả rõ thay đổi trong PR, gắn issue liên quan nếu có.

<!-- TODO: tách ra CONTRIBUTING.md nếu phần này dài thêm -->

## 22. Thành viên nhóm

| Tên | Vai trò | GitHub | Liên hệ |
|---|---|---|---|
| <!-- TODO -->| <!-- TODO --> | [@username](https://github.com/username) | |
| | | | |
| | | | |
| | | | |

## 23. License & Liên hệ

**License:** <!-- TODO: MIT / Apache-2.0 / proprietary -->

**Liên hệ:** <!-- TODO: email nhóm --> · <!-- TODO: fanpage / website -->

---

<div align="center">
<sub>NutriBoost — for a better life</sub>
</div>
