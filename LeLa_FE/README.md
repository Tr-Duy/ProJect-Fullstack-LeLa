# LeLa Frontend (LeLa-FE)

## 📌 Giới thiệu dự án
LeLa-FE là ứng dụng Web cho nền tảng học ngôn ngữ LeLa. Frontend cung cấp hai không gian trải nghiệm hoàn toàn riêng biệt (Dual Theme Architecture): một giao diện tươi trẻ, sáng tạo dành cho Người học (Learner) và một giao diện tối giản, chuyên nghiệp dành cho Quản trị viên (Admin).

## 🛠️ Công nghệ sử dụng
Dự án được phát triển bằng các công nghệ Web hiện đại nhất:
- **Core**: React 19.2 + TypeScript (Build tool: Vite 8.1)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4, Ant Design (antd) 6.5
- **Animation & Motion**: Framer Motion v12
- **Data Fetching & State**: TanStack React Query v5, Axios
- **Form & Validation**: React Hook Form, Zod
- **Data Visualization & UI**: Recharts (Biểu đồ), dnd-kit (Kéo thả), Lucide React (Icons)

---

## 🎨 Dual Theme Architecture (Quy tắc thiết kế cốt lõi)

Dự án áp dụng **hai hệ thống thiết kế độc lập** phụ thuộc vào route context. Điều này là **bắt buộc** và không được phép trộn lẫn.

### 1. Admin Routes (`/admin/*`)
- **Layout**: `AdminLayout`
- **Design System**: **Vercel Geist** (Tối giản, chuyên nghiệp).
- **Đặc điểm**:
  - Viền mỏng (1px), đổ bóng nhẹ nhàng (subtle shadows).
  - Bảng màu Grayscale (Xám) làm chủ đạo. Chữ chính: `#171717`. Accent color: `#006bff` (Geist Blue). Nền: `#fafafa`.
  - Border-radius nhỏ (`6-12px`).
  - **Tuyệt đối KHÔNG**: dùng viền đen dày, không dùng bóng đổ đen đặc (solid drop shadows).

### 2. Learner Routes (`/`, `/learn/*`, `/study/*`, v.v.)
- **Layout**: `MainLayout`
- **Design System**: **Soft Brutalism / Neo-Pop** (Hiện đại, ấn tượng, phá cách).
- **Đặc điểm**:
  - **Màu thương hiệu**: Coral Red `#F05A4A`, Teal Blue `#2A8B9D`, Off-White `#F4F3EE`, Dark Navy `#1D2A3A`.
  - **Borders & Shadows**: Viền dày (`3px solid #000`), bóng đổ đen đặc (`6px 6px 0px 0px #000`).
  - **Hình khối**: Card bo góc lớn (`rounded-3xl`), nút bấm hình viên thuốc (`rounded-full`).
  - **Animation**: Sử dụng spring-physics micro-animations (nhảy, nảy) cho các tương tác click/hover.
  - **Tích hợp**: Ghi đè Ant Design bằng `ConfigProvider` với token của neo-brutalism. Sử dụng các class tiện ích như `brutal-shadow`, `brutal-border`, `brutal-card`, `brutal-pill`.

---

## 🏗️ Tính năng & Modules chính

1. **Hệ thống Ôn tập thẻ bài (Flashcard & SRS)**
   - Hiển thị mặt trước/sau của thẻ bài kết hợp hiệu ứng lật (Framer Motion).
   - Tương tác đánh giá độ khó (Again, Hard, Good, Easy) gửi API về hệ thống thuật toán SM-2.
2. **Khám phá Bộ thẻ (Explore Decks)**
   - Thanh tìm kiếm "Split-Pill" độc đáo.
   - Giao diện lưới (Grid) hiển thị bộ thẻ theo danh mục, các bộ thẻ nổi bật (Featured).
3. **Hệ thống Trắc nghiệm (Quiz)**
   - Giao diện làm bài thi tương tác cao.
   - Trang kết quả (`QuizAttemptResultPage`) hiển thị chi tiết điểm số, đúng/sai từng câu và giải thích chi tiết.
4. **Bảng xếp hạng (Leaderboard) & Gamification**
   - Bục vinh quang (Podium) Top 3 được thiết kế theo phong cách Soft Brutalism.
   - Hiển thị hình đại diện ngẫu nhiên (DiceBear) mượt mà với fallback.
5. **Dashboard Quản trị viên (Admin)**
   - Quản lý Sales, Leads, Đơn hàng, Thống kê, thao tác hàng loạt (Bulk actions).
   - Màn hình sử dụng hệ thống Vercel Geist giúp dữ liệu hiển thị rõ ràng, khoa học.

---

## ⚡ Quản lý State & Dữ liệu
- **Dữ liệu tĩnh & CRUD**: Sử dụng **TanStack React Query**. Khi có thay đổi (Create/Update/Delete), gọi `queryClient.invalidateQueries` để tự động cập nhật UI thay vì polling liên tục.
- **Form Handling**: Sử dụng **React Hook Form** kết hợp **Zod** schema validation để quản lý các form đăng ký, tạo quiz, edit profile đảm bảo tính chính xác của dữ liệu đầu vào trước khi submit.

---

## 🚀 Hướng dẫn cài đặt và chạy dự án

### 1. Cài đặt Dependencies
Dự án sử dụng npm, chạy lệnh sau tại thư mục gốc của dự án (LeLa-FE):
```bash
npm install
```

### 2. Cấu hình Môi trường
Tạo file `.env` ở thư mục gốc:
```env
VITE_API_URL=http://localhost:8080/api
```

### 3. Khởi chạy Môi trường Phát triển (Development)
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:5173`.

### 4. Build Production
```bash
npm run build
```
Kết quả build sẽ nằm trong thư mục `dist/`.
