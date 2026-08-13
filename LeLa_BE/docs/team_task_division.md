# Kế hoạch chia Task Fullstack cho 4 thành viên

Nhóm đã quyết định chia lại các phần việc cho từng thành viên theo cấu trúc 4 nhóm Domain (A, B, C, D). Mỗi thành viên sẽ đảm nhận toàn bộ luồng **Fullstack (từ Database, Backend API đến giao diện Frontend React)** cho Domain của mình.

Chiến lược làm việc song song vẫn áp dụng **API First** & **Chia Phase** kết hợp với **Phân chia theo Domain (Vertical Slicing)** để giảm thiểu việc block nhau do phụ thuộc dữ liệu.

---

## 🚀 Chiến lược để không phải đợi nhau (Backend & Frontend)

1. **Phase 0 (1-2 ngày đầu - Cả team cùng làm):**
   - **Backend:** 
     - Chốt API Contract (Swagger/OpenAPI).
     - Tạo toàn bộ các Entity class cơ bản lên nhánh `main` để tránh lỗi biên dịch khi các domain gọi chéo nhau.
   - **Frontend:**
     - Thiết lập project React 18 + TypeScript bằng Vite.
     - Khởi tạo thư mục base, cài đặt các thư viện lõi (TailwindCSS, Framer Motion, React Query, React Router v6, Axios, Chart.js...).
     - Setup Layout cơ bản (Header, Sidebar) để mọi người có thể gắn các màn hình và component của mình vào.

2. **Sử dụng Mock Data & Mock Function:**
   - **Backend:** Các service gọi chéo nhau thông qua Event hoặc Interface để lỏng lẻo hóa liên kết.
   - **Frontend:** Xây dựng component UI bằng dữ liệu cứng (Mock JSON) trước để test luồng và animation. Khi nào Backend API hoàn thiện thì mới cắm API vào bằng React Query.

---

## 👥 Phân chia Task Fullstack (A, B, C, D)

### 🧑‍💻 Thành viên A: Auth/Core (Xác thực & Cốt lõi)
Đảm nhận các tính năng cốt lõi về người dùng, phân quyền và cấu hình hệ thống.

**Backend (API & Database):**
* Language
* SubscriptionPlan
* Users
* Role
* UserRoleAssignment
* RefreshTokenSession

**Frontend (React 18 + TS):**
* Xây dựng luồng UI Đăng nhập, Đăng ký, và Đăng xuất.
* Xử lý logic xác thực toàn cục (AuthContext), lưu trữ và xoay vòng JWT (Refresh Token).
* Phân quyền RBAC trên UI (chặn các route không được phép, ẩn/hiện menu admin theo Role).

### 🧑‍💻 Thành viên B: Content (Nội dung Học)
Đảm nhận hệ thống tạo và quản lý thư viện bộ thẻ học (Deck/Card).

**Backend (API & Database):**
* Deck
* Flashcard
* Tag
* FlashcardTag

**Frontend (React 18 + TS):**
* **Trang thư viện Deck:** Giao diện hiển thị danh sách bộ từ với số lượng card, tiến độ và ngày ôn tiếp theo.
* **Trang Admin:** Quản lý deck, card (CRUD) và thống kê các deck phổ biến.
* **Component chính:** Xây dựng `DeckProgressBar` (Thanh tiến độ số card đã mastered trên tổng số card trong deck).

### 🧑‍💻 Thành viên C: Quiz (Kiểm tra)
Đảm nhận toàn bộ nghiệp vụ kiểm tra trắc nghiệm.

**Backend (API & Database):**
* Quiz
* QuizQuestion
* QuizQuestionOption
* QuizAttempt
* QuizAttemptQuestion
* QuizAttemptOption
* QuizAnswer

**Frontend (React 18 + TS):**
* **Trang Quiz:** Giao diện cho người học làm bài trắc nghiệm, hiển thị số điểm/nộp bài.
* **Trang Admin:** Quản lý ngân hàng câu hỏi quiz.
* **Component chính:** Xây dựng `QuizTimer` (Đồng hồ đếm ngược trực quan cho mỗi bài/câu hỏi quiz).

### 🧑‍💻 Thành viên D: Learning (Học tập & Tương tác)
Đảm nhận logic phức tạp nhất về Thuật toán SRS (lặp lại ngắt quãng), theo dõi tiến độ, bảng xếp hạng và các luồng liên quan tới dòng tiền/tương tác.

**Backend (API & Database):**
* DeckEnrollment
* CardProgress
* ReviewSession
* SrsReview
* DailyLearningActivity
* LeaderboardSnapshot
* Notification
* Payment
* UserSubscription

**Frontend (React 18 + TS):**
* **Trang học Flashcard:** Màn hình review thẻ cốt lõi.
* **Trang tiến độ:** Dashboard hiển thị biểu đồ heatmap hoạt động học theo ngày (dùng Chart.js), và streak hiện tại.
* **Trang bảng xếp hạng:** Top người học theo điểm quiz và streak.
* **Component chính:**
  - `FlashCard`: Component lật thẻ 3D mượt mà sử dụng Framer Motion (hiển thị mặt trước/sau).
  - `ReviewRatingButtons`: Bộ bốn nút (Again/Hard/Good/Easy) với màu sắc phân biệt và tooltip.
  - `StreakCalendar`: Lịch heatmap hiển thị chuỗi ngày hoạt động trong tháng.
  - `LeaderboardTable`: Bảng xếp hạng vinh danh có avatar, điểm và thứ hạng.

---

## 🔄 Quy trình làm việc hàng ngày (Daily Workflow)

1. **Backend:** Viết xong API / Entity nào thì review và merge lên `main` ngay để các domain khác có thể tích hợp.
2. **Frontend:** Code UI và logic state độc lập trước. Khi có API, viết API clients và React Query hook để kết nối.
3. **Độc lập Test:** Mỗi thành viên phải tự lo phần Mock Data (ví dụ Thành viên B cần User id để tạo Deck, tự fake một User ID = 1 trong lúc đợi Thành viên A hoàn tất Auth). Bằng cách gom trọn theo Domain Fullstack, tỷ lệ merge conflict sẽ được giảm thiểu tối đa.
