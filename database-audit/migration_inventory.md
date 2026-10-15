# DANH MỤC KIỂM KÊ NGUỒN DỮ LIỆU & MIGRATION INVENTORY (LELA PLATFORM)

> **Dự án**: LeLa Fullstack Learning Platform (Backend: Java Spring Boot 3.x, Database: MySQL 8.x)  
> **Thời điểm kiểm toán**: Tháng 10/2026  
> **Chuyên gia kiểm toán**: Senior Database Architect & Backend Database Auditor  

---

## 1. TỔNG QUAN KIỂM KÊ MIGRATION

- **Công cụ quản lý migration**: Flyway (`spring.flyway.locations: classpath:db/migration`)
- **Cấu hình baseline / validate**:
  - `spring.flyway.baseline-on-migrate: true`
  - `spring.flyway.validate-on-migrate: true`
  - `spring.jpa.hibernate.ddl-auto: none` (Database Schema hoàn toàn do Flyway quản lý)
- **Thư mục chứa migration**: `LeLa_BE/src/main/resources/db/migration`
- **Tổng số file Migration tìm thấy**: **46 file** (`V1` đến `V46`)
- **Phiên bản Migration đầu tiên**: `V1__init_lela_schema.sql` (Kích thước: 47,464 bytes)
- **Phiên bản Migration mới nhất**: `V46__add_comprehensive_performance_indexes.sql` (Kích thước: 2,894 bytes)
- **Khoảng trống phiên bản (Version gaps)**: **0** (Dãy số V1 đến V46 liên tục 100%, không khuyết thiếu phiên bản nào)
- **File trùng lặp / bất thường**:
  - Không có file trùng version number.
  - Có các migration seed dữ liệu kích thước rất lớn: `V34` (~1.74 MB), `V37` (~2.37 MB), `V38` (~3.78 MB), `V42` (~1.03 MB), `V43` (~3.99 MB). Cần lưu ý cấu hình `max_allowed_packet` và transaction timeout khi deploy trên môi trường CI/CD hoặc Production.
  - Một file phụ trợ dữ liệu thử nghiệm độc lập: `LeLa_BE/src/main/resources/db/mock_data.sql` (không thuộc luồng Flyway tự động).

---

## 2. DANH MỤC CHI TIẾT TOÀN BỘ 46 TẬP TIN MIGRATION

| Phiên bản | Tên tập tin | Loại script | Kích thước | Tác động Schema / Nghiệp vụ |
|:---|:---|:---:|:---:|:---|
| **V1** | `V1__init_lela_schema.sql` | DDL + DML | 47,464 B | Khởi tạo schema gốc gồm 29 bảng, 42 index, các check constraint và nạp dữ liệu nền tảng (`languages`, `roles`, `subscription_plans`). |
| **V2** | `V2__align_card_progress_last_rating_type.sql` | DDL | 120 B | Sửa kiểu cột `card_progress.last_rating` từ `VARCHAR` thành `INT NULL`. |
| **V3** | `V3__seed_test_data.sql` | DML | 850 B | Script chèn dữ liệu test ban đầu (chứa comment/noop). |
| **V4** | `V4__seed_test_data_fix.sql` | DML | 920 B | Sửa lỗi script chèn dữ liệu test V3. |
| **V5** | `V5__seed_lela_data.sql` | DML | 6,000 B | Seed dữ liệu mẫu: tài khoản quản trị/người dùng, phân quyền, deck mẫu, flashcards và quiz. |
| **V6** | `V6__add_is_deleted_to_tags.sql` | DDL | 111 B | Bổ sung cột xóa mềm `tags.is_deleted BOOLEAN NOT NULL DEFAULT FALSE`. |
| **V7** | `V7__update_soft_delete_to_is_active.sql` | DDL | 535 B | Chuẩn hóa cơ chế cờ trạng thái: Drop cột `tags.is_deleted`, thêm `tags.is_active BOOLEAN NOT NULL DEFAULT TRUE`; thêm `decks.is_active BOOLEAN NOT NULL DEFAULT TRUE`. |
| **V8** | `V8__add_show_meaning_first_and_card_color.sql` | DDL | 140 B | Thêm `decks.show_meaning_first BOOLEAN NOT NULL DEFAULT FALSE` và `flashcards.card_color VARCHAR(50)`. |
| **V9** | `V9__update_deck_display_mode.sql` | DDL + DML | 389 B | Thêm `decks.display_mode VARCHAR(20) NOT NULL DEFAULT 'RANDOM'`, migrate dữ liệu từ `show_meaning_first` sang `display_mode`, sau đó DROP cột `decks.show_meaning_first`. |
| **V10** | `V10__add_performance_indexes.sql` | DDL | 726 B | Bổ sung 3 index: `idx_decks_status_visibility`, `idx_flashcards_is_active`, `idx_payments_status`. |
| **V11** | `V11__add_deck_enrollment_limits.sql` | DDL | 147 B | Bổ sung hạn mức học hằng ngày cho ghi danh deck: `deck_enrollments.max_new_cards_per_day` (mặc định 20), `deck_enrollments.max_reviews_per_day` (mặc định 100). |
| **V12** | `V12__create_achievements_tables.sql` | DDL + DML | 1,875 B | Tạo mới 2 bảng: `achievements` và `user_achievements` kèm khóa ngoại, unique constraint và seed 5 thành tựu khởi đầu. |
| **V13** | `V13__sync_deck_counts.sql` | DML | 890 B | Đồng bộ lại số lượng thẻ `decks.total_cards` từ bảng `flashcards`. |
| **V14** | `V14__clear_dummy_data.sql` | DML | 1,200 B | Dọn dẹp dữ liệu giả lập/thử nghiệm cũ. |
| **V15** | `V15__create_topics.sql` | DDL + DML | 1,143 B | Tạo bảng mới `topics`, seed topic mặc định (id=1, 'General'), thêm cột `decks.topic_id`, gán FK `fk_decks_topic`, và DROP cột cũ `decks.category`. |
| **V16** | `V16__seed_fruit_deck.sql` | DML | 2,403 B | Nạp chủ đề Trái cây, deck Fruit và các thẻ từ vựng mẫu. |
| **V17** | `V17__make_review_session_optional.sql` | DDL | 70 B | Thay đổi cột `srs_reviews.review_session_id` thành nullable (`BIGINT NULL`) để hỗ trợ ôn tập nhanh không bắt buộc tạo session. |
| **V18** | `V18__recalculate_users_xp_total.sql` | DML | 1,500 B | Tính toán và cập nhật lại `users.xp_total` dựa trên lịch sử hoạt động học và thành tựu. |
| **V19** | `V19__sync_deck_enrollment_count.sql` | DML | 950 B | Đồng bộ lại số lượng người học `decks.enrollment_count` từ `deck_enrollments`. |
| **V20** | `V20__add_prompt_daily_goal.sql` | DDL | 119 B | Thêm cột `users.prompt_daily_goal BOOLEAN NOT NULL DEFAULT TRUE` phục vụ tính năng nhắc nhở mục tiêu học. |
| **V21** | `V21__add_more_sample_data.sql` | DML | 2,953 B | Seed thêm các chủ đề, bộ thẻ và bài quiz mẫu. |
| **V22** | `V22__add_massive_sample_data.sql` | DML | 10,528 B | Nạp khối lượng lớn dữ liệu bài tập và bộ thẻ mẫu. |
| **V23** | `V23__add_quiz_questions.sql` | DML | 3,545 B | Seed câu hỏi và đáp án lựa chọn cho các bài quiz. |
| **V24** | `V24__alter_user_subscriptions_status_check.sql` | DDL | 241 B | Cập nhật Check Constraint `chk_user_subscriptions_status` bổ sung thêm trạng thái `'PENDING'` (hỗ trợ quy trình thanh toán SePay chờ duyệt). |
| **V25** | `V25__create_chat_tables.sql` | DDL | 1,049 B | Tạo mới 2 bảng hỗ trợ CSKH trực tuyến: `chat_conversations` (phiên chat khách vãng lai hoặc user) và `chat_messages` (tin nhắn trao đổi). |
| **V26** | `V26__add_sepay_payment_support.sql` | DDL | 364 B | Nâng cấp bảng `payments`: thêm cột `payment_code VARCHAR(50) UNIQUE`, sửa `provider_transaction_id VARCHAR(190) NULL UNIQUE`, thêm `expires_at DATETIME(6)`. |
| **V27** | `V27__add_exam_and_proficiency_levels.sql` | DDL + DML | 2,922 B | Tạo 2 bảng: `exam_types`, `proficiency_levels`. Thêm `exam_type_id`, `level_id` vào `decks` và `quizzes`; thêm `quiz_category` vào `quizzes`; thêm `current_exam_type_id`, `current_level_id` vào `users`. Seed TOEIC và VSTEP ban đầu. |
| **V28** | `V28__remove_vstep.sql` | DDL + DML | 3,537 B | Loại bỏ hoàn toàn kỳ thi VSTEP khỏi hệ thống: tạo bảng tạm `_mig_temp_*`, xóa toàn bộ dữ liệu phụ thuộc (quiz, deck, level, exam_type), reset tham chiếu ở bảng `users`, sau đó DROP toàn bộ bảng tạm. |
| **V29** | `V29__add_level_snapshot_to_quiz_attempt.sql` | DDL + DML | 396 B | Bổ sung cột lưu vết trình độ lúc làm bài: `quiz_attempts.level_id_at_attempt BIGINT NULL`, gắn FK `fk_quiz_attempts_level` tới `proficiency_levels`. |
| **V30__create_daily_user_goals.sql** | `V30__create_daily_user_goals.sql` | DDL | 489 B | Tạo bảng mới `daily_user_goals` ghi nhận mục tiêu học tập theo ngày của từng user (`uk_daily_goal_user_date`). |
| **V31** | `V31__fix_user_password_hashes.sql` | DML | 1,400 B | Cập nhật lại hash mật khẩu BCrypt cho các tài khoản seed hệ thống. |
| **V32** | `V32__seed_600_toeic_vocabulary.sql` | DML | 329,901 B | Nạp 600 từ vựng cốt lõi TOEIC vào hệ thống. |
| **V33** | `V33__split_toeic_vocabulary_into_decks.sql` | DML | 366,511 B | Chia tách 600 từ vựng TOEIC thành 50 bộ deck chuyên biệt theo chủ đề. |
| **V34** | `V34__seed_deck_quizzes.sql` | DML | 1,741,865 B | Khởi tạo 154 bài quiz, 1,569 câu hỏi và 6,276 đáp án lựa chọn tương ứng cho các bộ deck. |
| **V35** | `V35__seed_placement_tests.sql` | DML | 90,395 B | Khởi tạo 4 bài thi đánh giá năng lực đầu vào (Placement Tests). |
| **V36** | `V36__link_toeic_decks_to_levels.sql` | DML | 18,500 B | Liên kết các deck TOEIC tương ứng với 4 cấp độ kỹ năng TOEIC (Basic, Intermediate, Advanced, Excellent). |
| **V37** | `V37__seed_upgrade_tests.sql` | DML | 2,371,957 B | Khởi tạo 30 bài thi nâng cấp trình độ (Upgrade Tests) gồm 900 câu hỏi và 3,150 đáp án. |
| **V38** | `V38__seed_oxford_5000_vocabulary.sql` | DML | 3,788,673 B | Nạp kho từ vựng Oxford 5000: 11 chủ đề, 119 deck, 2,014 flashcard, 119 quiz, 2,014 câu hỏi. |
| **V39** | `V39__fix_oxford_deck_images_and_merge_small_decks.sql` | DML | 45,200 B | Chuẩn hóa đường dẫn hình ảnh của các deck Oxford và gộp các deck nhỏ. |
| **V40** | `V40__seed_u500_toeic_vocabulary_decks_quizzes.sql` | DML | 340,609 B | Nạp thêm từ vựng, deck và quiz cho dải điểm dưới 500 TOEIC. |
| **V41** | `V41__fix_and_seed_40_upgrade_tests.sql` | DML | 378,006 B | Bổ sung và đồng bộ 40 bài thi nâng bậc trình độ TOEIC. |
| **V42** | `V42__seed_40_final_level_tests.sql` | DDL + DML | 1,038,915 B | DDL: Thêm cột `quiz_attempts.cycle_number INT NOT NULL DEFAULT 1`. DML: Khởi tạo 40 bài thi tốt nghiệp cấp độ (Final Level Tests). |
| **V43** | `V43__sync_three_quizzes_per_deck.sql` | DDL + DML | 3,998,647 B | DDL: Thêm cột `quizzes.difficulty VARCHAR(20) NULL AFTER level_id` (sử dụng dynamic prepared statement). DML: Đồng bộ cơ chế mỗi deck sở hữu 3 bài quiz tương ứng 3 mức độ. |
| **V44** | `V44__add_tags_and_achievements_system.sql` | DDL | 4,473 B | DDL nâng cấp hệ thống Tag & Thành tựu: Thêm cột `tags.description VARCHAR(500)`, `uk_tags_slug`; Tạo bảng `deck_tags`; Đảm bảo bảng `flashcard_tags`; Thêm `achievements.category`, `achievements.is_active`, `uk_achievements_code`; Thêm `uk_user_achievement (user_id, achievement_id)`. |
| **V45** | `V45__add_flashcard_extended_fields.sql` | DDL | 187 B | Bổ sung 4 trường từ vựng mở rộng cho `flashcards`: `part_of_speech VARCHAR(100)`, `definition TEXT`, `example_translation TEXT`, `related_words VARCHAR(500)`. |
| **V46** | `V46__add_comprehensive_performance_indexes.sql` | DDL | 2,894 B | Tạo 5 chỉ mục tối ưu hóa hiệu năng cao cấp: `idx_decks_active_lvl_exam` trên `decks`, `idx_decks_topic_active` trên `decks`, `idx_quizzes_cat_lvl_active` trên `quizzes`, `idx_deck_tags_tag_id` trên `deck_tags`, `idx_flashcard_tags_tag_id` trên `flashcard_tags`. |

---

## 3. DANH MỤC 34 LỚP JPA ENTITY / MODEL ĐÃ PHÁT HIỆN

| STT | Tên Entity | Package nguồn | Bảng ánh xạ (`@Table`) | Kế thừa / Khóa |
|:---:|:---|:---|:---|:---|
| 1 | `Achievement` | `com.lela.achievement.domain` | `achievements` | `BaseEnity` (id) |
| 2 | `CardProgress` | `com.lela.cardprogress.domain` | `card_progress` | `BaseEnity` (id) |
| 3 | `ChatConversation` | `com.lela.chat.domain` | `chat_conversations` | Khóa đơn `id` (GeneratedValue IDENTITY) |
| 4 | `ChatMessage` | `com.lela.chat.domain` | `chat_messages` | Khóa đơn `id` (GeneratedValue IDENTITY) |
| 5 | `DailyLearningActivity` | `com.lela.dailylearningactivity.domain` | `daily_learning_activities` | `BaseEnity` (id) |
| 6 | `DailyUserGoal` | `com.lela.users.domain` | `daily_user_goals` | Khóa đơn `id` (GeneratedValue IDENTITY) |
| 7 | `Deck` | `com.lela.deck.domain` | `decks` | `AuditableEntity` (id, created_at, updated_at) |
| 8 | `DeckEnrollment` | `com.lela.deckenrollment.domain` | `deck_enrollments` | `BaseEnity` (id) |
| 9 | `ExamType` | `com.lela.common.domain` | `exam_types` | Khóa đơn `id` (GeneratedValue IDENTITY) |
| 10 | `Flashcard` | `com.lela.flashcard.domain` | `flashcards` | `AuditableEntity` (id, created_at, updated_at) |
| 11 | `FlashcardTag` | `com.lela.flashcard.domain` | `flashcard_tags` | Khóa ghép `@EmbeddedId FlashcardTagId` |
| 12 | `Language` | `com.lela.language.domain` | `languages` | `BaseEnity` (id) |
| 13 | `LeaderboardSnapshot` | `com.lela.leaderboardsnapshot.domain` | `leaderboard_snapshots` | `BaseEnity` (id) |
| 14 | `Notification` | `com.lela.notification.domain` | `notifications` | `BaseEnity` (id) |
| 15 | `Payment` | `com.lela.payment.domain` | `payments` | `BaseEnity` (id) |
| 16 | `ProficiencyLevel` | `com.lela.common.domain` | `proficiency_levels` | Khóa đơn `id` (GeneratedValue IDENTITY) |
| 17 | `Quiz` | `com.lela.Quiz.domain` | `quizzes` | `AuditableEntity` (id, created_at, updated_at) |
| 18 | `QuizAnswer` | `com.lela.QuizAnswer.domain` | `quiz_answers` | `BaseEnity` (id) |
| 19 | `QuizAttempt` | `com.lela.QuizAttempt.domain` | `quiz_attempts` | `BaseEnity` (id) |
| 20 | `QuizAttemptOption` | `com.lela.QuizAttemptOption.domain` | `quiz_attempt_options` | `BaseEnity` (id) |
| 21 | `QuizAttemptQuestion` | `com.lela.QuizAttemptQuestion.domain` | `quiz_attempt_questions` | `BaseEnity` (id) |
| 22 | `QuizQuestion` | `com.lela.QuizQuestion.domain` | `quiz_questions` | `BaseEnity` (id) |
| 23 | `QuizQuestionOption` | `com.lela.QuizQuestionOption.domain` | `quiz_question_options` | `BaseEnity` (id) |
| 24 | `RefreshTokenSession` | `com.lela.refreshtokensession.domain` | `refresh_token_sessions` | `BaseEnity` (id) |
| 25 | `ReviewSession` | `com.lela.reviewsession.domain` | `review_sessions` | `BaseEnity` (id) |
| 26 | `Role` | `com.lela.role.domain` | `roles` | `BaseEnity` (id) |
| 27 | `SrsReview` | `com.lela.srsreview.domain` | `srs_reviews` | `BaseEnity` (id) |
| 28 | `SubscriptionPlan` | `com.lela.subscriptionplan.domain` | `subscription_plans` | `BaseEnity` (id) |
| 29 | `Tag` | `com.lela.tag.domain` | `tags` | `BaseEnity` (id) |
| 30 | `Topic` | `com.lela.deck.domain` | `topics` | `AuditableEntity` (id, created_at, updated_at) |
| 31 | `UserAchievement` | `com.lela.achievement.domain` | `user_achievements` | Khóa đơn `id` (GeneratedValue IDENTITY) |
| 32 | `UserRoleAssignment` | `com.lela.userroleassignment.domain` | `user_roles` | Khóa ghép `@EmbeddedId UserRoleAssignmentId` |
| 33 | `UserSubscription` | `com.lela.usersubscription.domain` | `user_subscriptions` | `BaseEnity` (id) |
| 34 | `Users` | `com.lela.users.domain` | `users` | `BaseEnity` (id) |

---

## 4. ĐỐI SOÁT BẢNG KHÔNG CÓ LỚP ENTITY TƯƠNG ỨNG

Trong số **38 bảng** được xác định tại trạng thái Database Schema cuối cùng:
1. **`deck_tags`**: Bảng trung gian quan hệ Nhiều-Nhiều (ManyToMany) giữa `decks` và `tags`. Trong mã nguồn Java, bảng này được khai báo ánh xạ trực tiếp thông qua annotation `@ManyToMany @JoinTable(name = "deck_tags")` tại `Deck.java`, không tạo riêng lớp Entity độc lập.
2. **`audit_logs`**: Bảng ghi log kiểm toán bảo mật và hành động của actor/system (được định nghĩa tại V1). Không có lớp Entity Java tương ứng trong source code.
3. **`idempotency_records`**: Bảng lưu vết Idempotency Key chống trùng lặp request giao dịch/thanh toán (được định nghĩa tại V1). Không có lớp Entity Java tương ứng trong source code.
4. **`outbox_events`**: Bảng Outbox Pattern phục vụ phát tán sự kiện bất đồng bộ tin cậy (Transactional Outbox) (được định nghĩa tại V1). Không có lớp Entity Java tương ứng trong source code.
