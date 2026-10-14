# BÁO CÁO KIỂM TOÁN GIAO DIỆN (UI AUDIT) - LELA PLATFORM

## 1. TỔNG QUAN HỆ THỐNG ROUTING & PHÂN QUYỀN

Toàn bộ hệ thống định tuyến hiện hữu trên `LeLa_FE` (React 18 + TypeScript + React Router v7):

### 1.1. Public Routes (Khách vãng lai & Xác thực)
- `/`: `LandingPage` - Trang chủ giới thiệu nền tảng.
- `/login`: `LoginPage` - Đăng nhập tài khoản.
- `/register`: `RegisterPage` - Đăng ký tài khoản mới.
- `/pricing`: `PricingPage` - Bảng giá các gói cước (FREE, PRO, VIP).
- `/oauth2/redirect`: `OAuth2RedirectHandler` - Nhận callback xác thực Google OAuth2.
- `/unauthorized`: Trang thông báo không có quyền truy cập.

### 1.2. Learner Routes (Người học - vai trò `LEARNER`, dùng `LearnerLayout`)
- `/decks`: `ExploreDecksPage` - Khám phá và tìm kiếm bộ flashcard TOEIC công khai.
- `/decks/:deckId`: `DeckDetailPage` - Xem chi tiết bộ thẻ, danh sách từ và nút ghi danh.
- `/dashboard`: `LearnerDashboardPage` - Bảng điều khiển học tập cá nhân ("Hôm nay").
- `/onboarding`: `OnboardingPage` - Thiết lập ban đầu (Placement test, mục tiêu ngày).
- `/my-decks`: `MyDecksPage` - Quản lý các bộ thẻ cá nhân đã ghi danh/đang học.
- `/study/:deckId`: `StudyPage` - Phiên học lật thẻ flashcard theo thuật toán ngắt quãng SM-2.
- `/typing-game`: `TypingGamePage` - Luyện gõ từ vựng tăng phản xạ tốc độ.
- `/voice-conversation`: `VoiceConversationPage` - Luyện phản xạ đàm thoại AI qua giọng nói.
- `/ai-chat`: `AiChatPage` - Trợ lý ảo AI Tutor hỏi đáp ngữ pháp, từ vựng theo ngữ cảnh.
- `/placement-tests`: `PlacementTestsPage` - Đổi mức độ / kiểm tra trình độ đầu vào.
- `/final-level-tests`: `FinalLevelAssessmentPage` - Bài thi kết thúc cấp độ TOEIC.
- `/quizzes`: `QuizzesPage` - Danh mục các bài kiểm tra trắc nghiệm.
- `/quiz/:quizId/start`: `QuizAttemptPage` - Bắt đầu làm bài kiểm tra.
- `/quiz-attempts/:publicId`: `QuizAttemptPage` - Tiếp tục làm bài kiểm tra.
- `/quiz-attempts/:publicId/result`: `QuizAttemptResultPage` - Xem kết quả và phân tích đáp án.
- `/my-quiz-attempts`: `MyQuizAttemptsPage` - Lịch sử làm bài trắc nghiệm.
- `/achievements`: `LearnerAchievementsPage` - Thành tích và huy hiệu người học.
- `/leaderboard`: `LeaderboardPage` - Bảng xếp hạng XP theo tuần/tháng/tổng.
- `/profile`: `ProfilePage` - Thông tin cá nhân, cài đặt và lịch sử học tập.

### 1.3. Admin Routes (Quản trị viên - `ADMIN`, `CONTENT_CREATOR`, `MODERATOR`, dùng `AdminLayout`)
- `/admin/dashboard`: `AdminDashboardPage` - Tổng quan số liệu nền tảng.
- `/admin/users`: `UsersAdminPage` - Quản lý tài khoản người dùng và vai trò.
- `/admin/decks`: `DecksAdminPage` - Quản lý kho bộ thẻ TOEIC.
- `/admin/decks/:deckId/flashcards`: `FlashcardsAdminPage` - Quản lý thẻ từ vựng trong bộ thẻ.
- `/admin/quizzes`: `QuizzesAdminPage` - Quản lý bài trắc nghiệm.
- `/admin/quizzes/new` & `/admin/quizzes/:id/edit`: `QuizBuilderAdminPage` - Tạo & sửa bài quiz.
- `/admin/notifications`: `NotificationsAdminPage` - Gửi thông báo hệ thống.
- `/admin/transactions`: `TransactionsAdminPage` - Quản lý đơn hàng & giao dịch VietQR/Sepay.
- `/admin/subscription-plans`: `SubscriptionPlansAdminPage` - Cấu hình bảng giá gói dịch vụ.
- `/admin/tags`: `TagsPage` - Quản lý tag từ vựng/bộ thẻ.
- `/admin/languages`: `LanguagesPage` - Quản lý danh mục ngôn ngữ.
- `/admin/topics`: `TopicsAdminPage` - Quản lý chủ đề TOEIC.
- `/admin/achievements`: `AchievementsAdminPage` - Quản lý danh mục thành tích hệ thống.
- `/admin/chat`: `AdminChatDashboard` - Trung tâm hỗ trợ hội thoại trực tiếp với học viên.

---

## 2. PHÂN TÍCH NHỮNG VẤN ĐỀ BỐ CỤC & TRẢI NGHIỆM HIỆN TẠI

### 2.1. Thanh điều hướng ngang (Header Nav) bị quá tải và vỡ bố cục
- **Tràn dòng trên màn hình trung bình (1024px - 1366px)**: Thanh ngang nhồi nhét tới 10 mục (`Dashboard`, `Khám phá bộ thẻ`, `Bộ thẻ của tôi`, `Luyện Gõ`, `Hội Thoại AI`, `Thi Kết Thúc Level`, `Đổi mức độ`, `Thành tích`, `Bảng xếp hạng`, `AI Tutor`). Khi hiển thị trên laptop 13-14 inch, thanh này bị rớt dòng, chèn ép logo và avatar người dùng.
- **Màu sắc và icon hỗn loạn**: Mỗi nút một màu riêng lẻ (Xanh ngọc `#2A8B9D`, Xanh lá `#10B981`, Đỏ san hô `#F05A4A`, Vàng kim `#FFD700`, v.v.), không có ngôn ngữ thiết kế chung, gây rối mắt.
- **Bỏ quên giao diện thiết bị di động (Mobile <1024px)**: Thẻ `<nav className="hidden lg:flex">` hoàn toàn ẩn menu trên mobile mà không hề có thanh tab dưới hay drawer menu, khiến người dùng di động không thể chuyển trang.

### 2.2. Hai nút nổi Live Chat & AI Chat bị đè nhau và cắt góc
- Tại `LearnerLayout.tsx`, cả `<AiChatWidget />` và `<ChatWidget />` đều được render cố định ở góc dưới phải màn hình (`bottom-6 right-4` và `bottom-[92px] right-4`).
- Hai nút tròn to đè chéo lên nhau, nút Live Chat vàng và nút tròn đỏ thường xuyên bị cắt mép trên màn hình nhỏ hoặc che mất nút bấm của nội dung trang (như nút Submit quiz, nút bắt đầu học).
- Xung đột z-index: các widget này có z-index cao (50) khiến chúng nổi lên trên cả một số modal/drawer thông báo.

### 2.3. Bố cục thiếu bản sắc và tính hệ thống
- Font chữ hỗn tạp: chỗ dùng `Inter`, chỗ dùng `Outfit`, font mặc định hệ thống không đồng nhất.
- Thiếu phân cấp thị giác (visual hierarchy): Các thẻ bài tập, tiến độ, thành tích đều đóng khung đen dày 3px kiểu Neo-brutalism thô, góc bo 24px hoặc pill 9999px không ăn nhập với tinh thần một ứng dụng học tập nghiêm túc.
- Dashboard thiếu tính định hướng: Học viên vào trang chủ không nhận biết được "Thẻ nào cần ôn ngay lúc này?", "Số ngày streak là bao nhiêu?", "Mục tiêu hôm nay còn thiếu mấy điểm?".

### 2.4. Màn hình Hội thoại Giọng nói (Voice Conversation) chưa tối ưu
- Giao diện phòng học chỉ là một khung đen đơn điệu, thiếu lịch sử bong bóng chat hai chiều.
- Chưa hiển thị trực quan các từ vựng mục tiêu (Target words) dạng chip kèm trạng thái đã áp dụng đúng hay chưa.
- Chưa hiện rõ ràng hạn mức số phút hội thoại còn lại trong ngày/gói cước của người học.

---

## 3. ĐỊNH HƯỚNG THẨM MỸ: "SỔ TAY ÔN THI" (EDITORIAL STUDY JOURNAL)

### 3.1. Tinh thần chủ đạo
Biến giao diện thành một **cuốn sổ tay luyện thi TOEIC cao cấp** kết hợp với **tập flashcard học tập** và **bút dạ quang đánh dấu**:
- Nền giấy kem nhã nhặn (`--paper: #F5F1E8`), tạo cảm giác đọc sách thoải mái, bảo vệ mắt.
- Đường nét mực in sắc sảo (`--ink: #0F1729`, viền 2px, bóng cứng 4px 4px 0px).
- Vệt bút dạ quang (`--sun: #FFD60A`) nhấn dưới 1-2 từ khóa quan trọng của tiêu đề trang.
- Mô-típ Flashcard đặc trưng: cắt góc trên phải 12px (`clip-path: polygon(...)`) cho các thẻ hành động quan trọng.
- Thước tiến độ 10 nấc chia vạch (Ruler Progress) thay cho thanh progress bo tròn generic.
- Tem nhãn (Stamp) in hoa xoay nhẹ -2 độ cho trạng thái (ĐẾN HẠN, THÀNH THẠO, PRO, MỚI).
- Số liệu lớn (XP, streak, số thẻ) trình bày bằng font monospace (`IBM Plex Mono`) dạng `tabular-nums`.

### 3.2. Bảng mã màu tiêu chuẩn (Design Tokens)
```css
:root {
  --paper: #F5F1E8;        /* Nền trang chủ đạo */
  --paper-2: #EDE7DA;      /* Nền phụ, vùng nhấn */
  --card: #FFFFFF;         /* Nền thẻ nội dung */
  --ink: #0F1729;          /* Chữ chính, viền mực, khối tối */
  --ink-soft: #3B465C;     /* Chữ phụ */
  --ink-mute: #7A8499;     /* Chữ mờ, placeholder */
  --line: #D9D2C3;         /* Viền mảnh phân cách */
  --brand: #1D5CFF;        /* Xanh dương LeLa chủ đạo */
  --brand-ink: #0B2E99;    /* Xanh đậm tương phản */
  --mint: #00C896;         /* Trạng thái thành công, hoàn thành */
  --sun: #FFD60A;          /* Vệt bút dạ quang, điểm nhấn duy nhất */
  --coral: #FF5A4E;        /* Trạng thái sai, cảnh báo, chấm logo LELA. */
}
```

### 3.3. Hệ thống Typography
- **Tiêu đề (Display / Headings)**: `Bricolage Grotesque` 700/800, `letter-spacing: -0.02em` (fallback `Be Vietnam Pro 800` để đảm bảo 100% hiển thị hoàn hảo dấu tiếng Việt "Ắ Ề Ữ ợ ỹ Ồ ẩ").
- **Văn bản nội dung (Body)**: `Be Vietnam Pro` 400/500/600.
- **Số liệu, mã số, nhãn tiến độ**: `IBM Plex Mono` 500 (`tabular-nums`).

---

## 4. BẢN VẼ KIẾN TRÚC THÔNG TIN MỚI (APP SHELL)

### 4.1. Desktop (>= 1024px)
- **Thanh bên trái (Sidebar)**: Chiều rộng 248px (thu gọn 72px với lưu trạng thái `localStorage`), chia thành 4 nhóm rõ ràng:
  1. **HỌC**:
     - *Hôm nay* (`/dashboard`)
     - *Khám phá bộ thẻ* (`/decks`)
     - *Bộ thẻ của tôi* (`/my-decks`)
  2. **LUYỆN**:
     - *Luyện gõ* (`/typing-game`)
     - *Hội thoại AI* (`/voice-conversation`) [Tem AI]
     - *AI Tutor* (`/ai-chat`) [Tem AI]
  3. **THI**:
     - *Lộ trình & Thi* (gộp các bài kiểm tra level-up, thi kết thúc level, placement test)
  4. **CỘNG ĐỒNG**:
     - *Thành tích* (`/achievements`)
     - *Bảng xếp hạng* (`/leaderboard`)
  - Chân Sidebar: Khối thẻ nhỏ "Gói cước của bạn" (FREE/PRO/VIP, số phút AI còn lại, nút Nâng cấp).
- **Thanh trên cùng (Topbar)**: Chiều cao 60px:
  - Bên trái: Tiêu đề trang động kèm vệt dạ quang vàng.
  - Bên phải: Chip Chuỗi Streak (ngày) dạng mono, Chip Tổng XP, Chuông thông báo (Popover), Avatar người dùng + Dropdown menu cá nhân.

### 4.2. Mobile (< 1024px)
- **Thanh trên 56px**: Logo `LELA.`, Chuông thông báo, Avatar profile.
- **Thanh Tab dưới cố định (Bottom Tab Bar 5 mục)**:
  - `Hôm nay` (`/dashboard`)
  - `Học` (`/decks`)
  - `Nút Ôn ngay` (Nổi chính giữa, mở ngay phiên học thẻ đến hạn)
  - `Luyện` (`/voice-conversation` / `/typing-game`)
  - `Tôi` (`/profile` & cài đặt)

### 4.3. Nút nổi Live Chat gom gọn
- Hợp nhất thành **MỘT** nút nổi duy nhất bo góc 12px, đặt cách lề 16px, `bottom: calc(16px + env(safe-area-inset-bottom))`, không bị đè nút AI Tutor và không che thanh Tab dưới trên mobile.

---

## 5. KẾ HOẠCH TRIỂN KHAI THEO TỪNG PHASE

- **PHASE 1 - Nền tảng**:
  - Cài đặt 3 gói font: `@fontsource-variable/bricolage-grotesque`, `@fontsource/be-vietnam-pro`, `@fontsource/ibm-plex-mono`.
  - Tạo `src/styles/tokens.css` và cấu hình Tailwind `@theme`.
  - Thiết lập chuẩn `ConfigProvider` Ant Design theo tokens.
  - Xây dựng bộ UI component cốt lõi: `HighlighterText`, `FlashCardBox` (clip-path), `RulerProgress`, `Stamp`, `StatBadge`.
  - Viết lại `LearnerLayout.tsx` thành App Shell hoàn chỉnh (Desktop Sidebar + Mobile Bottom Tab + Unified Live Chat).

- **PHASE 2 - Dashboard "Hôm nay"**:
  - Thiết kế lại lưới 12 cột bất đối xứng: Khối thẻ đến hạn lớn nền ink, vòng tiến độ Daily Goal, hàng "Học tiếp" và 3 ô "Phòng luyện".

- **PHASE 3 - Phân hệ Học**:
  - Giao diện danh mục Khám phá bộ thẻ (`/decks`) & Bộ thẻ của tôi (`/my-decks`).
  - Màn hình học SM-2 (`/study/:deckId`): Thẻ flashcard 3D lật mượt mà, phím tắt 1-4, thanh số thẻ còn lại.

- **PHASE 4 - Phân hệ Luyện**:
  - Phòng Luyện gõ từ vựng (`/typing-game`).
  - Hội thoại Giọng nói AI (`/voice-conversation`): Bố cục 3 cột (Kịch bản/Từ mục tiêu - Lịch sử hội thoại bong bóng - Điều khiển micro 4 trạng thái).
  - Trợ lý học tập AI Tutor (`/ai-chat`).

- **PHASE 5 - Thi, Cộng đồng & Bảng giá**:
  - Lộ trình bài thi (`/placement-tests`, `/final-level-tests`, `/quizzes`).
  - Bảng xếp hạng (`/leaderboard`), Thành tích (`/achievements`).
  - Bảng giá & Hộp thoại thanh toán VietQR (`/pricing`).

- **PHASE 6 - Landing & Trang Công Khai**:
  - Landing page (`/`) phong cách Editorial Journal với hero bất đối xứng, flashcard tương tác lật thử.
  - Trang đăng nhập/đăng ký (`/login`, `/register`).
