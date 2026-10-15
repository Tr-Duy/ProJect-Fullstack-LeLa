# DATA DICTIONARY - HỆ THỐNG CƠ SỞ DỮ LIỆU LELA PLATFORM

> **Dự án**: Nền tảng học thông minh LeLa (LeLa Fullstack Learning Platform)  
> **Database Engine**: MySQL 8.x (InnoDB, `utf8mb4`, `utf8mb4_unicode_ci`)  
> **Backend Stack**: Java 21, Spring Boot 3.x, Spring Data JPA / Hibernate 6  
> **Thời điểm kiểm toán**: Tháng 10/2026  
> **Thực hiện bởi**: Senior Database Architect & Backend Database Auditor  

---

## 1. BẢNG TỔNG QUAN THỰC THỂ (ENTITY OVERVIEW MATRIX)

Hệ thống bao gồm **38 bảng cơ sở dữ liệu** được tái dựng hoàn chỉnh tại phiên bản Flyway V46. Dưới đây là ma trận ánh xạ 1-1 giữa bảng vật lý trong MySQL và lớp JPA Entity trong mã nguồn Java Backend.

| STT | Tên bảng | Entity tương ứng | Mục đích nghiệp vụ | Khóa chính (PK) |
|:---:|:---|:---|:---|:---|
| 1 | `languages` | `Language` | Danh mục ngôn ngữ hỗ trợ (gốc, đích) cho giao diện và nội dung học | `id` (BIGINT AUTO_INCREMENT) |
| 2 | `roles` | `Role` | Danh mục vai trò bảo mật RBAC (ADMIN, LEARNER, CONTENT_CREATOR, MODERATOR) | `id` (BIGINT AUTO_INCREMENT) |
| 3 | `exam_types` | `ExamType` | Danh mục chứng chỉ ngoại ngữ mục tiêu (hiện tại chuẩn hóa TOEIC) | `id` (BIGINT AUTO_INCREMENT) |
| 4 | `proficiency_levels` | `ProficiencyLevel` | Cấp độ năng lực và dải điểm chuẩn tương ứng theo từng kỳ thi | `id` (BIGINT AUTO_INCREMENT) |
| 5 | `users` | `Users` | Quản lý người dùng, hồ sơ cá nhân, chỉ số gamification, level hiện tại | `id` (BIGINT AUTO_INCREMENT) |
| 6 | `user_roles` | `UserRoleAssignment` | Bảng phân quyền đa vai trò cho người dùng (RBAC mapping) | `(user_id, role_id)` (Composite PK) |
| 7 | `refresh_token_sessions` | `RefreshTokenSession` | Quản lý phiên xác thực, refresh token rotation và phát hiện xâm nhập | `id` (BIGINT AUTO_INCREMENT) |
| 8 | `subscription_plans` | `SubscriptionPlan` | Danh mục các gói đăng ký hội viên (FREE, PLUS, PREMIUM) và hạn mức | `id` (BIGINT AUTO_INCREMENT) |
| 9 | `user_subscriptions` | `UserSubscription` | Quản lý gói hội viên mà người dùng đã mua, thời hạn và trạng thái chu kỳ | `id` (BIGINT AUTO_INCREMENT) |
| 10 | `payments` | `Payment` | Giao dịch thanh toán mua gói hội viên (tích hợp SePay, MoMo, VNPay...) | `id` (BIGINT AUTO_INCREMENT) |
| 11 | `topics` | `Topic` | Chủ đề phân loại bộ thẻ từ vựng (Business, Tech, Oxford, Fruits...) | `id` (BIGINT AUTO_INCREMENT) |
| 12 | `decks` | `Deck` | Bộ flashcard học tập theo chủ đề, cấp độ, kỳ thi hoặc do user tạo | `id` (BIGINT AUTO_INCREMENT) |
| 13 | `tags` | `Tag` | Thẻ phân loại và đánh dấu từ vựng/bộ thẻ phục vụ tìm kiếm | `id` (BIGINT AUTO_INCREMENT) |
| 14 | `deck_tags` | *Không có Entity riêng* (`Deck.@ManyToMany`) | Bảng trung gian ánh xạ nhiều-nhiều giữa bộ thẻ (`decks`) và thẻ nhãn (`tags`) | `(deck_id, tag_id)` (Composite PK) |
| 15 | `flashcards` | `Flashcard` | Thẻ từ vựng chi tiết: 2 mặt, phiên âm, giải nghĩa, ví dụ, hình ảnh, âm thanh | `id` (BIGINT AUTO_INCREMENT) |
| 16 | `flashcard_tags` | `FlashcardTag` | Bảng trung gian ánh xạ nhiều-nhiều giữa thẻ flashcard và thẻ nhãn tag | `(flashcard_id, tag_id)` (Composite PK) |
| 17 | `deck_enrollments` | `DeckEnrollment` | Ghi danh học bộ thẻ của người dùng, giới hạn thẻ mới và tiến độ học | `id` (BIGINT AUTO_INCREMENT) |
| 18 | `card_progress` | `CardProgress` | Trạng thái ghi nhớ từng flashcard theo thuật toán SRS (FSRS / SM-2) | `id` (BIGINT AUTO_INCREMENT) |
| 19 | `review_sessions` | `ReviewSession` | Phiên ôn tập thẻ của người dùng (tính thời gian, số thẻ đúng/sai, XP) | `id` (BIGINT AUTO_INCREMENT) |
| 20 | `srs_reviews` | `SrsReview` | Lịch sử từng lượt lật thẻ, chấm điểm nhớ (1-4) và biến thiên tham số SRS | `id` (BIGINT AUTO_INCREMENT) |
| 21 | `quizzes` | `Quiz` | Bài kiểm tra trắc nghiệm đánh giá trình độ (Deck Quiz, Placement, Final Test) | `id` (BIGINT AUTO_INCREMENT) |
| 22 | `quiz_questions` | `QuizQuestion` | Câu hỏi trong bài kiểm tra (Multiple Choice, True/False, Fill Blank) | `id` (BIGINT AUTO_INCREMENT) |
| 23 | `quiz_question_options` | `QuizQuestionOption` | Các lựa chọn đáp án cho từng câu hỏi kiểm tra | `id` (BIGINT AUTO_INCREMENT) |
| 24 | `quiz_attempts` | `QuizAttempt` | Lượt làm bài kiểm tra của người dùng, điểm số, kết quả đạt và chu kỳ thi | `id` (BIGINT AUTO_INCREMENT) |
| 25 | `quiz_attempt_questions` | `QuizAttemptQuestion` | Danh sách câu hỏi đã bốc ngẫu nhiên phục vụ lượt thi cụ thể | `id` (BIGINT AUTO_INCREMENT) |
| 26 | `quiz_attempt_options` | `QuizAttemptOption` | Thứ tự các đáp án đã xáo trộn phục vụ lượt thi cụ thể | `id` (BIGINT AUTO_INCREMENT) |
| 27 | `quiz_answers` | `QuizAnswer` | Câu trả lời và lựa chọn thực tế của thí sinh cho từng câu hỏi | `id` (BIGINT AUTO_INCREMENT) |
| 28 | `daily_learning_activities` | `DailyLearningActivity` | Tổng hợp chỉ số học tập hằng ngày theo người dùng (Streak, XP, thời gian) | `id` (BIGINT AUTO_INCREMENT) |
| 29 | `daily_user_goals` | `DailyUserGoal` | Thiết lập và xác nhận mục tiêu học số thẻ flashcard hằng ngày của người dùng | `id` (BIGINT AUTO_INCREMENT) |
| 30 | `notifications` | `Notification` | Thông báo đẩy trong hệ thống (nhắc học, gia hạn gói, thành tựu mới) | `id` (BIGINT AUTO_INCREMENT) |
| 31 | `leaderboard_snapshots` | `LeaderboardSnapshot` | Bảng xếp hạng định kỳ (ngày, tuần, tháng, tổng) phục vụ đua top nhận thưởng | `id` (BIGINT AUTO_INCREMENT) |
| 32 | `achievements` | `Achievement` | Danh mục các danh hiệu và huy hiệu thành tựu người dùng có thể mở khóa | `id` (BIGINT AUTO_INCREMENT) |
| 33 | `user_achievements` | `UserAchievement` | Lưu vết danh hiệu thành tựu đã được người dùng chinh phục và nhận thưởng XP | `id` (BIGINT AUTO_INCREMENT) |
| 34 | `chat_conversations` | `ChatConversation` | Phiên hỗ trợ trực tuyến giữa khách truy cập / học viên với tư vấn viên/AI | `id` (BIGINT AUTO_INCREMENT) |
| 35 | `chat_messages` | `ChatMessage` | Chi tiết nội dung các tin nhắn văn bản trao đổi trong phiên hỗ trợ trực tuyến | `id` (BIGINT AUTO_INCREMENT) |
| 36 | `audit_logs` | *Không có Entity tương ứng* | Lưu vết kiểm toán bảo mật, sự kiện thay đổi dữ liệu của actor/hệ thống | `id` (BIGINT AUTO_INCREMENT) |
| 37 | `idempotency_records` | *Không có Entity tương ứng* | Ngăn chặn trùng lặp giao dịch (Idempotent Key) cho thanh toán và API trọng yếu | `id` (BIGINT AUTO_INCREMENT) |
| 38 | `outbox_events` | *Không có Entity tương ứng* | Hàng đợi Transactional Outbox phát sự kiện bất đồng bộ tin cậy (Event Bus) | `id` (BIGINT AUTO_INCREMENT) |

---

## 2. MA TRẬN QUAN HỆ KHÓA NGOẠI (RELATIONSHIP MATRIX)

Toàn bộ **64 ràng buộc khóa ngoại (Foreign Keys)** trong hệ thống được định nghĩa chặt chẽ với hành vi toàn vẹn dữ liệu cụ thể:

| Bảng nguồn | Khóa ngoại (FK) | Bảng đích | Khóa tham chiếu (PK/UK) | Loại quan hệ | ON DELETE | ON UPDATE |
|:---|:---|:---|:---|:---:|:---:|:---:|
| `proficiency_levels` | `exam_type_id` | `exam_types` | `id` | N - 1 | `CASCADE` | `NO ACTION` (Mặc định) |
| `users` | `native_language_id` | `languages` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `users` | `target_language_id` | `languages` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `users` | `current_exam_type_id`| `exam_types` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `users` | `current_level_id` | `proficiency_levels`| `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `user_roles` | `user_id` | `users` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `user_roles` | `role_id` | `roles` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `user_roles` | `assigned_by` | `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `refresh_token_sessions`| `user_id` | `users` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `refresh_token_sessions`| `replaced_by_session_id`| `refresh_token_sessions`| `id` | N - 1 (Tự tham chiếu) | `SET NULL` | `NO ACTION` |
| `user_subscriptions` | `user_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `user_subscriptions` | `plan_id` | `subscription_plans`| `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `payments` | `user_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `payments` | `subscription_id` | `user_subscriptions`| `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `decks` | `owner_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `decks` | `language_id` | `languages` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `decks` | `topic_id` | `topics` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `decks` | `exam_type_id` | `exam_types` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `decks` | `level_id` | `proficiency_levels`| `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `decks` | `reviewed_by` | `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `deck_tags` | `deck_id` | `decks` | `id` | N - 1 (Trung gian N-N)| `CASCADE` | `NO ACTION` |
| `deck_tags` | `tag_id` | `tags` | `id` | N - 1 (Trung gian N-N)| `CASCADE` | `NO ACTION` |
| `flashcards` | `deck_id` | `decks` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `flashcards` | `created_by` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `flashcards` | `updated_by` | `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `flashcard_tags` | `flashcard_id` | `flashcards` | `id` | N - 1 (Trung gian N-N)| `CASCADE` | `NO ACTION` |
| `flashcard_tags` | `tag_id` | `tags` | `id` | N - 1 (Trung gian N-N)| `CASCADE` | `NO ACTION` |
| `deck_enrollments` | `user_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `deck_enrollments` | `deck_id` | `decks` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `card_progress` | `user_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `card_progress` | `card_id` | `flashcards` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `review_sessions` | `user_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `review_sessions` | `deck_id` | `decks` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `srs_reviews` | `review_session_id` | `review_sessions` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `srs_reviews` | `user_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `srs_reviews` | `card_id` | `flashcards` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quizzes` | `deck_id` | `decks` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quizzes` | `exam_type_id` | `exam_types` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `quizzes` | `level_id` | `proficiency_levels`| `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `quizzes` | `created_by` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quizzes` | `updated_by` | `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `quiz_questions` | `quiz_id` | `quizzes` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `quiz_question_options`| `question_id`| `quiz_questions`| `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `quiz_attempts` | `quiz_id` | `quizzes` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quiz_attempts` | `user_id` | `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quiz_attempts` | `level_id_at_attempt`| `proficiency_levels`| `id`| N - 1 | `SET NULL` | `NO ACTION` |
| `quiz_attempt_questions`| `attempt_id`| `quiz_attempts` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `quiz_attempt_questions`| `question_id`| `quiz_questions` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quiz_attempt_options` | `attempt_question_id`| `quiz_attempt_questions`| `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `quiz_attempt_options` | `option_id` | `quiz_question_options`| `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quiz_answers` | `attempt_id` | `quiz_attempts` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `quiz_answers` | `question_id` | `quiz_questions` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `quiz_answers` | `selected_option_id`| `quiz_question_options`| `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `daily_learning_activities`| `user_id`| `users` | `id` | N - 1 | `RESTRICT` | `NO ACTION` |
| `daily_user_goals` | `user_id` | `users` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `notifications` | `user_id` | `users` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `leaderboard_snapshots` | `user_id` | `users` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `user_achievements` | `user_id` | `users` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `user_achievements` | `achievement_id` | `achievements` | `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `chat_conversations` | `user_id` | `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `chat_conversations` | `assigned_admin_id`| `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `chat_messages` | `conversation_id`| `chat_conversations`| `id` | N - 1 | `CASCADE` | `NO ACTION` |
| `audit_logs` | `actor_user_id` | `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |
| `idempotency_records` | `user_id` | `users` | `id` | N - 1 | `SET NULL` | `NO ACTION` |

---

## 3. TỪ ĐIỂN CỘT CHI TIẾT THEO TỪNG BẢNG (COLUMN DICTIONARY)

### 3.1. Bảng `languages`
- **Mục đích**: Lưu trữ danh mục ngôn ngữ hỗ trợ.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, Khóa chính (PK).
  - `language_code`: `VARCHAR(10) NOT NULL`, Mã chuẩn ISO ngôn ngữ ('en', 'vi'), Ràng buộc Unique (`uk_languages_language_code`).
  - `name`: `VARCHAR(100) NOT NULL`, Tên tiếng Anh/chuẩn quốc tế.
  - `native_name`: `VARCHAR(100) NULL`, Tên bản địa.
  - `flag_url`: `VARCHAR(500) NULL`, Đường dẫn icon quốc kỳ.
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`, Trạng thái kích hoạt.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`, Thời gian tạo và cập nhật microsecond.

### 3.2. Bảng `roles`
- **Mục đích**: Định nghĩa vai trò tài khoản cho RBAC.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, Khóa chính (PK).
  - `role_code`: `VARCHAR(50) NOT NULL`, Mã vai trò ('ADMIN', 'LEARNER'...), Unique (`uk_roles_role_code`).
  - `name`: `VARCHAR(100) NOT NULL`, Tên mô tả vai trò.
  - `description`: `VARCHAR(500) NULL`, Chi tiết quyền hạn.
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`, Trạng thái hoạt động.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.

### 3.3. Bảng `exam_types`
- **Mục đích**: Các loại kỳ thi ngoại ngữ được chuẩn hóa trong hệ thống.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `code`: `VARCHAR(50) NOT NULL`, Mã chứng chỉ ('TOEIC'), Unique (`uk_exam_types_code`).
  - `name`: `VARCHAR(100) NOT NULL`, Tên đầy đủ của kỳ thi.
  - `max_scale_score`: `DECIMAL(7,2) NOT NULL`, Điểm thang tối đa (990.00 cho TOEIC).
  - `created_at`, `updated_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.

### 3.4. Bảng `proficiency_levels`
- **Mục đích**: Thang bậc và cấp độ năng lực của từng kỳ thi.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `exam_type_id`: `BIGINT NOT NULL`, FK tham chiếu `exam_types(id)` ON DELETE CASCADE.
  - `code`: `VARCHAR(50) NOT NULL`, Mã bậc ('TOEIC_BASIC', 'TOEIC_INTERMEDIATE'...).
  - `name`: `VARCHAR(100) NOT NULL`, Tên phân loại cấp độ.
  - `min_score`: `DECIMAL(7,2) NOT NULL`, Dải điểm sàn.
  - `max_score`: `DECIMAL(7,2) NOT NULL`, Dải điểm trần.
  - `display_order`: `INT NOT NULL DEFAULT 0`, Thứ tự hiển thị tăng dần.
  - `created_at`, `updated_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.

### 3.5. Bảng `users`
- **Mục đích**: Tài khoản người dùng và hồ sơ học tập.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `username`: `VARCHAR(50) NOT NULL`, Tên đăng nhập, Unique (`uk_users_username`).
  - `email`: `VARCHAR(190) NOT NULL`, Địa chỉ email, Unique (`uk_users_email`).
  - `password_hash`: `VARCHAR(255) NOT NULL`, Hash mật khẩu BCrypt.
  - `full_name`: `VARCHAR(150) NOT NULL`, Họ và tên hiển thị.
  - `avatar_url`: `VARCHAR(500) NULL`, Link ảnh đại diện.
  - `native_language_id`: `BIGINT NULL`, FK tới `languages(id)` ON DELETE SET NULL.
  - `target_language_id`: `BIGINT NULL`, FK tới `languages(id)` ON DELETE SET NULL.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'`, Check: PENDING, ACTIVE, SUSPENDED, DEACTIVATED.
  - `timezone`: `VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh'`, Múi giờ người dùng.
  - `daily_goal_cards`: `INT NOT NULL DEFAULT 10`, Mục tiêu thẻ học hằng ngày (1 đến 1000).
  - `prompt_daily_goal`: `BOOLEAN NOT NULL DEFAULT TRUE`, Cờ nhắc nhở xác nhận mục tiêu ngày (V20).
  - `current_exam_type_id`: `BIGINT NULL`, FK tới `exam_types(id)` (V27).
  - `current_level_id`: `BIGINT NULL`, FK tới `proficiency_levels(id)` (V27).
  - `xp_total`: `BIGINT NOT NULL DEFAULT 0`, Tổng điểm kinh nghiệm tích lũy (>= 0).
  - `streak_current`: `INT NOT NULL DEFAULT 0`, Chuỗi ngày học liên tục hiện tại.
  - `streak_longest`: `INT NOT NULL DEFAULT 0`, Kỷ lục chuỗi ngày học dài nhất.
  - `last_activity_date`: `DATE NULL`, Ngày học gần nhất (dùng để tính Streak).
  - `last_active_at`: `DATETIME(6) NULL`, Thời điểm thao tác hệ thống gần nhất.
  - `email_verified_at`: `DATETIME(6) NULL`, Thời điểm xác thực email.
  - `deleted_at`: `DATETIME(6) NULL`, Cột xóa mềm cũ.
  - `version`: `BIGINT NOT NULL DEFAULT 0`, Khóa lạc quan (Optimistic Locking).
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_users_status_deleted (status, deleted_at)`.

### 3.6. Bảng `user_roles`
- **Mục đích**: Bảng trung gian gán vai trò người dùng (UserRoleAssignment).
- **Cột**:
  - `user_id`: `BIGINT NOT NULL`, Composite PK, FK tới `users(id)` ON DELETE CASCADE.
  - `role_id`: `BIGINT NOT NULL`, Composite PK, FK tới `roles(id)` ON DELETE RESTRICT.
  - `assigned_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
  - `assigned_by`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.

### 3.7. Bảng `refresh_token_sessions`
- **Mục đích**: Quản lý phiên đăng nhập và bảo mật JWT Refresh Token.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE CASCADE.
  - `token_hash`: `VARCHAR(255) NOT NULL`, SHA-256 hash của refresh token, Unique.
  - `token_family_id`: `VARCHAR(100) NOT NULL`, Định danh chuỗi refresh token để chống replay attack.
  - `user_agent`: `VARCHAR(500) NULL`, Trình duyệt / client app.
  - `ip_address`: `VARCHAR(45) NULL`, Địa chỉ IPv4/IPv6.
  - `device_name`: `VARCHAR(100) NULL`, Tên thiết bị đăng nhập.
  - `is_revoked`: `BOOLEAN NOT NULL DEFAULT FALSE`, Đã bị thu hồi hay chưa.
  - `revoked_at`: `DATETIME(6) NULL`.
  - `revoked_reason`: `VARCHAR(255) NULL`.
  - `replaced_by_session_id`: `BIGINT NULL`, FK tự tham chiếu tới session kế nhiệm.
  - `expires_at`: `DATETIME(6) NOT NULL`, Hạn tồn tại của refresh token.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_refresh_token_sessions_user_revoked_expires`, `idx_refresh_token_sessions_family`.

### 3.8. Bảng `subscription_plans`
- **Mục đích**: Thông tin các gói dịch vụ bán phí/miễn phí.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `plan_code`: `VARCHAR(50) NOT NULL`, Unique ('FREE', 'PLUS', 'PREMIUM').
  - `name`: `VARCHAR(100) NOT NULL`, Tên gói dịch vụ.
  - `description`: `VARCHAR(500) NULL`, Mô tả quyền lợi.
  - `price`: `DECIMAL(12,2) NOT NULL DEFAULT 0.00`, Giá tiền (>= 0).
  - `currency_code`: `CHAR(3) NOT NULL DEFAULT 'VND'`.
  - `billing_cycle`: `VARCHAR(20) NOT NULL DEFAULT 'MONTHLY'`, Chu kỳ tính cước.
  - `billing_interval_count`: `INT NOT NULL DEFAULT 1`.
  - `max_owned_decks`: `INT NOT NULL DEFAULT 10`.
  - `max_cards_per_deck`: `INT NOT NULL DEFAULT 200`.
  - `max_daily_reviews`: `INT NOT NULL DEFAULT 500`.
  - `quiz_enabled`, `leaderboard_enabled`, `offline_enabled`: `BOOLEAN NOT NULL`.
  - `display_order`: `INT NOT NULL DEFAULT 0`.
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.

### 3.9. Bảng `user_subscriptions`
- **Mục đích**: Bản ghi đăng ký gói của người dùng.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `plan_id`: `BIGINT NOT NULL`, FK tới `subscription_plans(id)` ON DELETE RESTRICT.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'PENDING'`, Check: TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED, PENDING (V24).
  - `starts_at`, `current_period_start`, `current_period_end`: `DATETIME(6) NOT NULL`.
  - `cancelled_at`, `ended_at`, `trial_ends_at`: `DATETIME(6) NULL`.
  - `auto_renew`: `BOOLEAN NOT NULL DEFAULT TRUE`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_user_subscriptions_user_status_expires`.

### 3.10. Bảng `payments`
- **Mục đích**: Giao dịch nạp tiền/thanh toán gói hội viên.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `subscription_id`: `BIGINT NULL`, FK tới `user_subscriptions(id)` ON DELETE SET NULL.
  - `provider`: `VARCHAR(50) NOT NULL`, Cổng thanh toán ('SEPAY', 'MOMO'...).
  - `provider_transaction_id`: `VARCHAR(190) NULL`, Mã giao dịch cổng thanh toán, Unique (`uk_provider_transaction`).
  - `payment_code`: `VARCHAR(50) NULL`, Mã thanh toán SePay nhận dạng qua chuyển khoản, Unique (`uk_payments_payment_code`) (V26).
  - `amount`: `DECIMAL(12,2) NOT NULL`, Số tiền thanh toán (>= 0).
  - `currency_code`: `CHAR(3) NOT NULL DEFAULT 'VND'`.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'PENDING'`, Check: PENDING, SUCCEEDED, FAILED, REFUNDED, CANCELLED.
  - `paid_at`, `failed_at`, `refunded_at`: `DATETIME(6) NULL`.
  - `expires_at`: `DATETIME(6) NULL`, Thời điểm hết hạn phiên thanh toán SePay (V26).
  - `failure_reason`: `VARCHAR(500) NULL`.
  - `provider_payload`: `JSON NULL`, Raw webhook payload từ cổng thanh toán.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_payments_user_created`, `idx_payments_status`.

### 3.11. Bảng `topics`
- **Mục đích**: Danh mục chủ đề bài học (V15).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `name`: `VARCHAR(100) NOT NULL`, Tên chủ đề, Unique (`uk_topics_name`).
  - `slug`: `VARCHAR(100) NOT NULL`, URL thân thiện, Unique (`uk_topics_slug`).
  - `description`: `VARCHAR(500) NULL`.
  - `icon_url`: `VARCHAR(200) NULL`.
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.

### 3.12. Bảng `decks`
- **Mục đích**: Quản lý bộ thẻ từ vựng (Flashcard Decks).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `deck_code`: `VARCHAR(50) NOT NULL`, Unique.
  - `slug`: `VARCHAR(190) NOT NULL`, Unique.
  - `title`: `VARCHAR(200) NOT NULL`.
  - `description`: `TEXT NULL`.
  - `cover_image_url`: `VARCHAR(500) NULL`.
  - `owner_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `language_id`: `BIGINT NOT NULL`, FK tới `languages(id)` ON DELETE RESTRICT.
  - `topic_id`: `BIGINT NULL`, FK tới `topics(id)` ON DELETE SET NULL (V15).
  - `exam_type_id`: `BIGINT NULL`, FK tới `exam_types(id)` ON DELETE SET NULL (V27).
  - `level_id`: `BIGINT NULL`, FK tới `proficiency_levels(id)` ON DELETE SET NULL (V27).
  - `difficulty`: `VARCHAR(20) NOT NULL DEFAULT 'BEGINNER'`, Check: BEGINNER, INTERMEDIATE, ADVANCED.
  - `visibility`: `VARCHAR(20) NOT NULL DEFAULT 'PUBLIC'`, Check: PUBLIC, UNLISTED, PRIVATE.
  - `status`: `VARCHAR(30) NOT NULL DEFAULT 'DRAFT'`, Check: DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED, ARCHIVED.
  - `display_mode`: `VARCHAR(20) NOT NULL DEFAULT 'RANDOM'`, Chế độ lật mặt thẻ (V9).
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`, Trạng thái xóa mềm mới (V7).
  - `is_featured`: `BOOLEAN NOT NULL DEFAULT FALSE`.
  - `total_cards`: `INT NOT NULL DEFAULT 0`.
  - `view_count`, `enrollment_count`: `BIGINT NOT NULL DEFAULT 0`.
  - `submitted_at`: `DATETIME(6) NULL`.
  - `reviewed_by`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.
  - `reviewed_at`: `DATETIME(6) NULL`.
  - `rejection_reason`: `VARCHAR(1000) NULL`.
  - `published_at`, `deleted_at`: `DATETIME(6) NULL`.
  - `version`: `BIGINT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_decks_language_status_visibility`, `idx_decks_owner_status_deleted`, `idx_decks_featured_status`, `idx_decks_title`, `idx_decks_status_visibility`, `idx_decks_active_lvl_exam` (V46), `idx_decks_topic_active` (V46).

### 3.13. Bảng `tags`
- **Mục đích**: Nhãn phân loại từ vựng và chủ đề.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `name`: `VARCHAR(100) NOT NULL`.
  - `slug`: `VARCHAR(120) NOT NULL`, Unique (`uk_tags_slug`) (V44).
  - `description`: `VARCHAR(500) NULL` (V44).
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE` (V7).
  - `created_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.

### 3.14. Bảng `deck_tags`
- **Mục đích**: Bảng liên kết Nhiều - Nhiều giữa bộ thẻ và nhãn tag (V44).
- **Cột**:
  - `deck_id`: `BIGINT NOT NULL`, Composite PK, FK tới `decks(id)` ON DELETE CASCADE.
  - `tag_id`: `BIGINT NOT NULL`, Composite PK, FK tới `tags(id)` ON DELETE CASCADE.
  - `created_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
- **Index**: `idx_deck_tags_tag_id (tag_id, deck_id)` (V46).

### 3.15. Bảng `flashcards`
- **Mục đích**: Quản lý thẻ từ vựng trong từng deck.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `deck_id`: `BIGINT NOT NULL`, FK tới `decks(id)` ON DELETE RESTRICT.
  - `front_text`: `VARCHAR(1000) NOT NULL`.
  - `back_text`: `VARCHAR(1000) NOT NULL`.
  - `phonetic`: `VARCHAR(255) NULL`, Phiên âm IPA.
  - `example_text`: `VARCHAR(1000) NULL`, Câu ví dụ minh họa.
  - `hint`: `VARCHAR(500) NULL`.
  - `note`: `TEXT NULL`.
  - `front_image_url`, `back_image_url`: `VARCHAR(500) NULL`.
  - `front_audio_url`, `back_audio_url`: `VARCHAR(500) NULL`.
  - `card_color`: `VARCHAR(50) NULL`, Màu sắc nhận diện thẻ (V8).
  - `part_of_speech`: `VARCHAR(100) NULL`, Từ loại: noun, verb, adj... (V45).
  - `definition`: `TEXT NULL`, Định nghĩa giải thích chi tiết (V45).
  - `example_translation`: `TEXT NULL`, Dịch nghĩa câu ví dụ (V45).
  - `related_words`: `VARCHAR(500) NULL`, Từ đồng nghĩa/liên quan (V45).
  - `card_order`: `INT NOT NULL DEFAULT 0`.
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`.
  - `created_by`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `updated_by`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.
  - `deleted_at`: `DATETIME(6) NULL`.
  - `version`: `BIGINT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_flashcards_deck_active_order`, `idx_flashcards_deck_deleted`, `idx_flashcards_is_active` (V10).

### 3.16. Bảng `flashcard_tags`
- **Mục đích**: Bảng liên kết Nhiều - Nhiều giữa flashcard và tag.
- **Cột**:
  - `flashcard_id`: `BIGINT NOT NULL`, Composite PK, FK tới `flashcards(id)` ON DELETE CASCADE.
  - `tag_id`: `BIGINT NOT NULL`, Composite PK, FK tới `tags(id)` ON DELETE CASCADE.
  - `created_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
- **Index**: `idx_flashcard_tags_tag_id (tag_id, flashcard_id)` (V46).

### 3.17. Bảng `deck_enrollments`
- **Mục đích**: Đăng ký tham gia học bộ thẻ và hạn mức học hằng ngày.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `deck_id`: `BIGINT NOT NULL`, FK tới `decks(id)` ON DELETE RESTRICT.
  - Unique: `(user_id, deck_id)`.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'`, Check: ACTIVE, PAUSED, COMPLETED, DROPPED.
  - `max_new_cards_per_day`: `INT NOT NULL DEFAULT 20`, Giới hạn thẻ mới mỗi ngày (V11).
  - `max_reviews_per_day`: `INT NOT NULL DEFAULT 100`, Giới hạn thẻ ôn mỗi ngày (V11).
  - `enrolled_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
  - `paused_at`, `completed_at`, `dropped_at`, `last_studied_at`, `next_review_at`: `DATETIME(6) NULL`.
  - `mastered_cards`: `INT NOT NULL DEFAULT 0`.
  - `note`: `VARCHAR(500) NULL`.
  - `version`: `BIGINT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_deck_enrollments_user_status_due`, `idx_deck_enrollments_deck_status`.

### 3.18. Bảng `card_progress`
- **Mục đích**: Thông số tính toán khoảng cách lặp lại giãn cách (SRS Engine).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `card_id`: `BIGINT NOT NULL`, FK tới `flashcards(id)` ON DELETE CASCADE.
  - Unique: `(user_id, card_id)`.
  - `state`: `VARCHAR(20) NOT NULL DEFAULT 'NEW'`, Check: NEW, LEARNING, REVIEW, RELEARNING.
  - `step`: `INT NOT NULL DEFAULT 0`.
  - `stability`: `DECIMAL(8,4) NOT NULL DEFAULT 0.0000`, Độ ổn định ký ức (FSRS).
  - `difficulty`: `DECIMAL(8,4) NOT NULL DEFAULT 0.0000`, Độ khó của thẻ.
  - `interval_days`: `INT NOT NULL DEFAULT 0`, Khoảng cách ngày đến lần ôn tiếp theo.
  - `due_at`: `DATETIME(6) NOT NULL`, Mốc thời gian đến hạn ôn tập.
  - `last_reviewed_at`: `DATETIME(6) NULL`.
  - `reps`: `INT NOT NULL DEFAULT 0`, Số lần đã ôn tập.
  - `lapses`: `INT NOT NULL DEFAULT 0`, Số lần quên thẻ.
  - `elapsed_days`, `scheduled_days`: `INT NOT NULL DEFAULT 0`.
  - `last_rating`: `INT NULL`, Điểm đánh giá lượt gần nhất (1=Again, 2=Hard, 3=Good, 4=Easy) (Đã align ở V2).
  - `version`: `BIGINT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_card_progress_user_due`, `idx_card_progress_user_state_due`, `idx_card_progress_card`.

### 3.19. Bảng `review_sessions`
- **Mục đích**: Tập hợp các thẻ được ôn tập trong một phiên học liên tục.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `public_id`: `CHAR(36) NOT NULL`, UUID định danh duy nhất cho client, Unique.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `deck_id`: `BIGINT NOT NULL`, FK tới `decks(id)` ON DELETE RESTRICT.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'`, Check: ACTIVE, COMPLETED, ABANDONED.
  - `mode`: `VARCHAR(30) NOT NULL DEFAULT 'NORMAL'`, Check: NORMAL, CRAM, CUSTOM, SPEED_REVIEW.
  - `started_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
  - `completed_at`, `abandoned_at`: `DATETIME(6) NULL`.
  - `cards_studied`, `cards_remembered`, `cards_forgotten`, `time_spent_seconds`, `xp_earned`: `INT NOT NULL DEFAULT 0`.
  - `version`: `BIGINT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_review_sessions_user_status_started`, `idx_review_sessions_deck_started`.

### 3.20. Bảng `srs_reviews`
- **Mục đích**: Lịch sử chi tiết từng sự kiện lật thẻ học và cập nhật thuật toán.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `client_event_id`: `VARCHAR(100) NOT NULL`, Unique chống gửi trùng review từ mobile/web offline sync.
  - `review_session_id`: `BIGINT NULL`, FK tới `review_sessions(id)` ON DELETE SET NULL (Đã sửa Nullable ở V17).
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `card_id`: `BIGINT NOT NULL`, FK tới `flashcards(id)` ON DELETE RESTRICT.
  - `rating`: `INT NOT NULL`, Điểm chấm nhớ (1 đến 4).
  - `response_time_ms`: `INT NULL`, Thời gian phản xạ suy nghĩ (ms).
  - `state_before`, `state_after`: `VARCHAR(20) NOT NULL`.
  - `stability_before`, `stability_after`: `DECIMAL(8,4) NOT NULL`.
  - `difficulty_before`, `difficulty_after`: `DECIMAL(8,4) NOT NULL`.
  - `interval_days_before`, `interval_days_after`: `INT NOT NULL`.
  - `due_at_before`, `due_at_after`: `DATETIME(6) NOT NULL`.
  - `xp_awarded`: `INT NOT NULL DEFAULT 0`.
  - `reviewed_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
- **Index**: `idx_srs_reviews_user_reviewed`, `idx_srs_reviews_card_reviewed`, `idx_srs_reviews_session`.

### 3.21. Bảng `quizzes`
- **Mục đích**: Quản lý các bài thi trắc nghiệm từ vựng, thi xếp lớp và thi tốt nghiệp cấp độ.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `deck_id`: `BIGINT NULL`, FK tới `decks(id)` ON DELETE RESTRICT (Sửa Nullable ở V27).
  - `exam_type_id`: `BIGINT NULL`, FK tới `exam_types(id)` ON DELETE SET NULL (V27).
  - `level_id`: `BIGINT NULL`, FK tới `proficiency_levels(id)` ON DELETE SET NULL (V27).
  - `difficulty`: `VARCHAR(20) NULL`, Mức độ bài quiz: EASY, MEDIUM, HARD (V43).
  - `quiz_category`: `VARCHAR(30) DEFAULT 'NORMAL'`, Loại bài: NORMAL, PLACEMENT, UPGRADE, FINAL (V27).
  - `quiz_code`: `VARCHAR(50) NOT NULL`, Unique.
  - `title`: `VARCHAR(200) NOT NULL`.
  - `description`: `TEXT NULL`.
  - `quiz_type`: `VARCHAR(30) NOT NULL DEFAULT 'MULTIPLE_CHOICE'`.
  - `time_limit_seconds`: `INT NULL`, Thời gian làm bài tối đa.
  - `pass_score`: `DECIMAL(5,2) NOT NULL DEFAULT 60.00`, Điểm đạt tối thiểu (%).
  - `max_attempts`: `INT NOT NULL DEFAULT 3`.
  - `shuffle_questions`, `shuffle_options`: `BOOLEAN NOT NULL DEFAULT TRUE`.
  - `total_questions`: `INT NOT NULL DEFAULT 0`.
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`.
  - `created_by`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `updated_by`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.
  - `deleted_at`: `DATETIME(6) NULL`.
  - `version`: `BIGINT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_quizzes_deck_active_deleted`, `idx_quizzes_cat_lvl_active` (V46).

### 3.22. Bảng `quiz_questions`
- **Mục đích**: Câu hỏi trắc nghiệm thuộc bài thi.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `quiz_id`: `BIGINT NOT NULL`, FK tới `quizzes(id)` ON DELETE CASCADE.
  - `question_text`: `TEXT NOT NULL`.
  - `question_type`: `VARCHAR(30) NOT NULL DEFAULT 'MULTIPLE_CHOICE'`.
  - `explanation`: `TEXT NULL`, Lời giải thích cặn kẽ đáp án.
  - `points`: `INT NOT NULL DEFAULT 1`.
  - `display_order`: `INT NOT NULL DEFAULT 0`.
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_quiz_questions_quiz_active_order`.

### 3.23. Bảng `quiz_question_options`
- **Mục đích**: Các phương án lựa chọn (A, B, C, D) cho từng câu hỏi.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `question_id`: `BIGINT NOT NULL`, FK tới `quiz_questions(id)` ON DELETE CASCADE.
  - `option_text`: `TEXT NOT NULL`.
  - `is_correct`: `BOOLEAN NOT NULL DEFAULT FALSE`.
  - `display_order`: `INT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_quiz_question_options_question_order`.

### 3.24. Bảng `quiz_attempts`
- **Mục đích**: Lượt làm bài thi của học viên.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `public_id`: `CHAR(36) NOT NULL`, Unique UUID.
  - `quiz_id`: `BIGINT NOT NULL`, FK tới `quizzes(id)` ON DELETE RESTRICT.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `level_id_at_attempt`: `BIGINT NULL`, FK tới `proficiency_levels(id)` ON DELETE SET NULL (V29).
  - `cycle_number`: `INT NOT NULL DEFAULT 1`, Vòng lặp/chu kỳ thi tốt nghiệp cấp độ (V42).
  - `attempt_number`: `INT NOT NULL`, Lần thi số mấy của user cho quiz này.
  - Unique: `(quiz_id, user_id, attempt_number)`.
  - `start_idempotency_key`: `VARCHAR(190) NULL`, Unique.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'`, Check: IN_PROGRESS, SUBMITTED, EXPIRED, ABANDONED.
  - `started_at`, `expires_at`, `submitted_at`, `abandoned_at`: `DATETIME(6)`.
  - `time_spent_seconds`: `INT NULL`.
  - `total_questions`, `correct_answers`, `score_points`: `INT NOT NULL DEFAULT 0`.
  - `score_percent`: `DECIMAL(5,2) NULL`.
  - `passed`: `BOOLEAN NULL`.
  - `xp_awarded`: `INT NOT NULL DEFAULT 0`.
  - `version`: `BIGINT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_quiz_attempts_user_quiz_status`, `idx_quiz_attempts_quiz_submitted`.

### 3.25. Bảng `quiz_attempt_questions`
- **Mục đích**: Snapshot danh sách câu hỏi đã được cấp cho lượt thi.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `attempt_id`: `BIGINT NOT NULL`, FK tới `quiz_attempts(id)` ON DELETE CASCADE.
  - `question_id`: `BIGINT NOT NULL`, FK tới `quiz_questions(id)` ON DELETE RESTRICT.
  - `display_order`: `INT NOT NULL`.
  - Unique: `(attempt_id, display_order)`.
  - `created_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
- **Index**: `idx_quiz_attempt_questions_attempt`.

### 3.26. Bảng `quiz_attempt_options`
- **Mục đích**: Snapshot thứ tự đáp án xáo trộn của từng câu hỏi trong lượt thi.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `attempt_question_id`: `BIGINT NOT NULL`, FK tới `quiz_attempt_questions(id)` ON DELETE CASCADE.
  - `option_id`: `BIGINT NOT NULL`, FK tới `quiz_question_options(id)` ON DELETE RESTRICT.
  - `display_order`: `INT NOT NULL`.
  - Unique: `(attempt_question_id, display_order)`.
  - `created_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.

### 3.27. Bảng `quiz_answers`
- **Mục đích**: Ghi nhận đáp án thực tế học viên chọn và chấm điểm.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `attempt_id`: `BIGINT NOT NULL`, FK tới `quiz_attempts(id)` ON DELETE CASCADE.
  - `question_id`: `BIGINT NOT NULL`, FK tới `quiz_questions(id)` ON DELETE RESTRICT.
  - Unique: `(attempt_id, question_id)`.
  - `selected_option_id`: `BIGINT NULL`, FK tới `quiz_question_options(id)` ON DELETE SET NULL.
  - `text_answer`: `TEXT NULL`.
  - `is_correct`: `BOOLEAN NOT NULL DEFAULT FALSE`.
  - `points_awarded`: `INT NOT NULL DEFAULT 0`.
  - `answered_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
- **Index**: `idx_quiz_answers_attempt`.

### 3.28. Bảng `daily_learning_activities`
- **Mục đích**: Báo cáo tổng hợp số liệu học tập hằng ngày theo người dùng.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE RESTRICT.
  - `activity_date`: `DATE NOT NULL`.
  - Unique: `(user_id, activity_date)`.
  - `cards_studied`, `cards_reviewed`, `quizzes_taken`, `time_spent_seconds`, `xp_earned`, `streak_day`: `INT NOT NULL DEFAULT 0`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_daily_learning_activities_user_date`.

### 3.29. Bảng `daily_user_goals`
- **Mục đích**: Mục tiêu học thẻ từng ngày và trạng thái hoàn thành (V30).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE CASCADE.
  - `goal_date`: `DATE NOT NULL`.
  - Unique: `(user_id, goal_date)`.
  - `target_cards`: `INT NOT NULL`.
  - `confirmed`: `BOOLEAN NOT NULL DEFAULT FALSE`.
  - `created_at`, `updated_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.

### 3.30. Bảng `notifications`
- **Mục đích**: Quản lý thông báo đẩy tới người dùng.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE CASCADE.
  - `notification_type`: `VARCHAR(50) NOT NULL`.
  - `title`: `VARCHAR(200) NOT NULL`.
  - `message`: `TEXT NOT NULL`.
  - `target_url`: `VARCHAR(500) NULL`.
  - `metadata_payload`: `JSON NULL`.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'PENDING'`, Check: PENDING, SENT, FAILED, CANCELLED.
  - `is_read`: `BOOLEAN NOT NULL DEFAULT FALSE`.
  - `read_at`: `DATETIME(6) NULL`.
  - `scheduled_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
  - `sent_at`: `DATETIME(6) NULL`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_notifications_user_read_created`, `idx_notifications_status_scheduled`.

### 3.31. Bảng `leaderboard_snapshots`
- **Mục đích**: Snapshot dữ liệu bảng xếp hạng đua top tích lũy XP.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE CASCADE.
  - `period_type`: `VARCHAR(20) NOT NULL`, Check: DAILY, WEEKLY, MONTHLY, ALL_TIME.
  - `period_start`, `period_end`: `DATE NOT NULL`.
  - Unique: `(user_id, period_type, period_start)`.
  - `rank_position`: `INT NOT NULL`.
  - `xp_score`, `total_score`: `BIGINT NOT NULL DEFAULT 0`.
  - `snapshot_metadata`: `JSON NULL`.
  - `created_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
- **Index**: `idx_leaderboard_period_xp`, `idx_leaderboard_period_total`.

### 3.32. Bảng `achievements`
- **Mục đích**: Danh mục các danh hiệu và thành tựu (V12, V44).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `code`: `VARCHAR(100) NOT NULL`, Unique (`uk_achievements_code`).
  - `title`: `VARCHAR(200) NOT NULL`.
  - `description`: `VARCHAR(500) NULL`.
  - `icon_url`: `VARCHAR(200) NULL`.
  - `xp_reward`: `INT NOT NULL`.
  - `condition_type`: `VARCHAR(50) NULL`.
  - `condition_value`: `INT NULL`.
  - `category`: `VARCHAR(50) NULL` (V44).
  - `is_active`: `TINYINT(1) NOT NULL DEFAULT 1` (V44).
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.

### 3.33. Bảng `user_achievements`
- **Mục đích**: Lịch sử mở khóa thành tựu của người dùng (V12, V44).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `user_id`: `BIGINT NOT NULL`, FK tới `users(id)` ON DELETE CASCADE.
  - `achievement_id`: `BIGINT NOT NULL`, FK tới `achievements(id)` ON DELETE CASCADE.
  - Unique: `(user_id, achievement_id)` (`uk_user_achievement`).
  - `unlocked_at`: `DATETIME(6) NOT NULL`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.

### 3.34. Bảng `chat_conversations`
- **Mục đích**: Quản lý phiên hỗ trợ khách hàng và giải đáp thắc mắc (V25).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `guest_token`: `VARCHAR(255) NULL`, Unique (`uk_chat_conversations_guest_token`).
  - `guest_name`: `VARCHAR(100) NULL`.
  - `guest_email`: `VARCHAR(100) NULL`.
  - `guest_phone`: `VARCHAR(20) NULL`.
  - `guest_department`: `VARCHAR(100) NULL`.
  - `user_id`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.
  - `assigned_admin_id`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.
  - `status`: `VARCHAR(20) NOT NULL`.
  - `created_at`, `updated_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.

### 3.35. Bảng `chat_messages`
- **Mục đích**: Lịch sử tin nhắn trao đổi trong phiên hỗ trợ (V25).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `conversation_id`: `BIGINT NOT NULL`, FK tới `chat_conversations(id)` ON DELETE CASCADE.
  - `sender_type`: `VARCHAR(20) NOT NULL` ('GUEST', 'USER', 'ADMIN', 'SYSTEM').
  - `sender_id`: `BIGINT NULL`.
  - `content`: `TEXT NOT NULL`.
  - `is_read`: `BOOLEAN DEFAULT FALSE`.
  - `created_at`, `updated_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.

### 3.36. Bảng `audit_logs`
- **Mục đích**: Bảng hệ thống lưu vết toàn bộ thay đổi dữ liệu nhạy cảm (Security Audit Trail).
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `actor_user_id`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.
  - `entity_type`: `VARCHAR(100) NOT NULL`.
  - `entity_id`: `VARCHAR(100) NOT NULL`.
  - `action`: `VARCHAR(50) NOT NULL` ('CREATE', 'UPDATE', 'DELETE', 'LOGIN'...).
  - `old_state`: `JSON NULL`, Dữ liệu trước khi sửa.
  - `new_state`: `JSON NULL`, Dữ liệu sau khi sửa.
  - `ip_address`: `VARCHAR(45) NULL`.
  - `user_agent`: `VARCHAR(500) NULL`.
  - `created_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
- **Index**: `idx_audit_logs_entity_created`, `idx_audit_logs_actor_created`.

### 3.37. Bảng `idempotency_records`
- **Mục đích**: Bảng hệ thống lưu trữ Idempotent Key tránh gửi trùng request.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `idempotency_key`: `VARCHAR(190) NOT NULL`.
  - `scope`: `VARCHAR(100) NOT NULL`.
  - Unique: `(idempotency_key, scope)`.
  - `user_id`: `BIGINT NULL`, FK tới `users(id)` ON DELETE SET NULL.
  - `request_hash`: `VARCHAR(64) NOT NULL`, SHA-256 hash của body request.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'PROCESSING'`, Check: PROCESSING, COMPLETED, FAILED.
  - `response_code`: `INT NULL`.
  - `response_payload`: `JSON NULL`.
  - `expires_at`: `DATETIME(6) NOT NULL`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_idempotency_records_expiration`.

### 3.38. Bảng `outbox_events`
- **Mục đích**: Hàng đợi Transactional Outbox Pattern cho Microservices / Event-Driven Architecture.
- **Cột**:
  - `id`: `BIGINT NOT NULL AUTO_INCREMENT`, PK.
  - `aggregate_type`: `VARCHAR(100) NOT NULL`.
  - `aggregate_id`: `VARCHAR(100) NOT NULL`.
  - `event_type`: `VARCHAR(100) NOT NULL`.
  - `event_payload`: `JSON NOT NULL`.
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'PENDING'`, Check: PENDING, PROCESSING, SENT, DEAD_LETTER.
  - `retry_count`: `INT NOT NULL DEFAULT 0`.
  - `max_retries`: `INT NOT NULL DEFAULT 5`.
  - `available_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`.
  - `sent_at`, `failed_at`: `DATETIME(6) NULL`.
  - `last_error`: `TEXT NULL`.
  - `created_at`, `updated_at`: `DATETIME(6) NOT NULL`.
- **Index**: `idx_outbox_events_status_available`.
