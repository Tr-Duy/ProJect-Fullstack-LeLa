-- Mock Data for LeLa Flashcard Platform
-- Target: MySQL 8+
-- Usage: Run this script manually in a local or test database after Flyway migrations are applied.
-- The file is UTF-8 and uses utf8mb4 so Vietnamese text is preserved.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Reference languages
-- LeLa demo data only supports Vietnamese learners studying English.
INSERT INTO languages (language_code, name, native_name, flag_url, is_active) VALUES
('en', 'Tiếng Anh', 'English', 'flags/en.svg', TRUE),
('vi', 'Tiếng Việt', 'Tiếng Việt', 'flags/vi.svg', TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    native_name = VALUES(native_name),
    flag_url = VALUES(flag_url),
    is_active = VALUES(is_active);

UPDATE languages
SET is_active = FALSE
WHERE language_code NOT IN ('en', 'vi');

SET @lang_en_id = (SELECT id FROM languages WHERE language_code = 'en' LIMIT 1);
SET @lang_vi_id = (SELECT id FROM languages WHERE language_code = 'vi' LIMIT 1);

-- 2. Roles aligned with RoleCode enum
INSERT INTO roles (role_code, name, description, is_active) VALUES
('ADMIN', 'Quản trị viên', 'Toàn quyền quản trị hệ thống', TRUE),
('LEARNER', 'Người học', 'Học deck, ôn tập SRS và làm quiz', TRUE),
('CONTENT_CREATOR', 'Người tạo nội dung', 'Tạo và quản lý nội dung học của mình', TRUE),
('MODERATOR', 'Kiểm duyệt viên', 'Kiểm duyệt nội dung và hỗ trợ quản lý người dùng', TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    is_active = VALUES(is_active);

SET @role_admin_id = (SELECT id FROM roles WHERE role_code = 'ADMIN' LIMIT 1);
SET @role_learner_id = (SELECT id FROM roles WHERE role_code = 'LEARNER' LIMIT 1);
SET @role_creator_id = (SELECT id FROM roles WHERE role_code = 'CONTENT_CREATOR' LIMIT 1);
SET @role_moderator_id = (SELECT id FROM roles WHERE role_code = 'MODERATOR' LIMIT 1);

-- 3. Subscription plans
INSERT INTO subscription_plans (
    plan_code, name, description, price, currency_code, billing_cycle,
    billing_interval_count, max_owned_decks, max_cards_per_deck, max_daily_reviews,
    quiz_enabled, leaderboard_enabled, offline_enabled, features_json, display_order, is_active
) VALUES
('FREE', 'Gói Miễn Phí', 'Dành cho người mới bắt đầu học flashcard.', 0, 'VND', 'FREE', 0, 3, 50, 100, FALSE, FALSE, FALSE, '{"support":"community"}', 1, TRUE),
('PLUS', 'Gói Plus', 'Mở khóa quiz, bảng xếp hạng và giới hạn học cao hơn.', 79000, 'VND', 'MONTHLY', 1, -1, 500, 1000, TRUE, TRUE, TRUE, '{"support":"standard","offline":true}', 2, TRUE),
('PREMIUM', 'Gói Premium', 'Toàn bộ tính năng hiện có cho người học chuyên sâu.', 149000, 'VND', 'MONTHLY', 1, -1, -1, -1, TRUE, TRUE, TRUE, '{"support":"priority","analytics":true,"offline":true}', 3, TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    price = VALUES(price),
    currency_code = VALUES(currency_code),
    billing_cycle = VALUES(billing_cycle),
    billing_interval_count = VALUES(billing_interval_count),
    max_owned_decks = VALUES(max_owned_decks),
    max_cards_per_deck = VALUES(max_cards_per_deck),
    max_daily_reviews = VALUES(max_daily_reviews),
    quiz_enabled = VALUES(quiz_enabled),
    leaderboard_enabled = VALUES(leaderboard_enabled),
    offline_enabled = VALUES(offline_enabled),
    features_json = VALUES(features_json),
    display_order = VALUES(display_order),
    is_active = VALUES(is_active);

SET @plan_free_id = (SELECT id FROM subscription_plans WHERE plan_code = 'FREE' LIMIT 1);
SET @plan_plus_id = (SELECT id FROM subscription_plans WHERE plan_code = 'PLUS' LIMIT 1);
SET @plan_premium_id = (SELECT id FROM subscription_plans WHERE plan_code = 'PREMIUM' LIMIT 1);

-- 4. Users
-- password hash is reused for demo accounts: password123
INSERT INTO users (
    id, username, email, password_hash, full_name, avatar_url,
    native_language_id, target_language_id, status, timezone, daily_goal_cards,
    xp_total, streak_current, streak_longest, last_activity_date, last_active_at, email_verified_at
) VALUES
(1, 'admin', 'admin@lela.test', '$2a$10$wN2L0a3d4S5y2wZ7k0V.QOvX7W.oN6zJp5z5wZ/P0t7xPq9rP1UaG', 'Quản trị hệ thống', 'https://i.pravatar.cc/160?img=12', @lang_vi_id, @lang_en_id, 'ACTIVE', 'Asia/Ho_Chi_Minh', 10, 8400, 21, 30, CURDATE(), NOW(), NOW()),
(2, 'lananh', 'lananh@lela.test', '$2a$10$wN2L0a3d4S5y2wZ7k0V.QOvX7W.oN6zJp5z5wZ/P0t7xPq9rP1UaG', 'Nguyễn Lan Anh', 'https://i.pravatar.cc/160?img=47', @lang_vi_id, @lang_en_id, 'ACTIVE', 'Asia/Ho_Chi_Minh', 20, 2380, 8, 12, CURDATE(), NOW(), NOW()),
(3, 'minhkhoi', 'minhkhoi@lela.test', '$2a$10$wN2L0a3d4S5y2wZ7k0V.QOvX7W.oN6zJp5z5wZ/P0t7xPq9rP1UaG', 'Trần Minh Khôi', 'https://i.pravatar.cc/160?img=53', @lang_vi_id, @lang_en_id, 'ACTIVE', 'Asia/Ho_Chi_Minh', 15, 1260, 4, 6, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(4, 'hana_creator', 'hana@lela.test', '$2a$10$wN2L0a3d4S5y2wZ7k0V.QOvX7W.oN6zJp5z5wZ/P0t7xPq9rP1UaG', 'Lê Hà Na', 'https://i.pravatar.cc/160?img=32', @lang_vi_id, @lang_en_id, 'ACTIVE', 'Asia/Ho_Chi_Minh', 25, 5120, 17, 22, CURDATE(), NOW(), NOW()),
(5, 'moderator_bao', 'bao@lela.test', '$2a$10$wN2L0a3d4S5y2wZ7k0V.QOvX7W.oN6zJp5z5wZ/P0t7xPq9rP1UaG', 'Phạm Quốc Bảo', 'https://i.pravatar.cc/160?img=15', @lang_vi_id, @lang_en_id, 'ACTIVE', 'Asia/Ho_Chi_Minh', 12, 980, 2, 9, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NOW())
ON DUPLICATE KEY UPDATE
    username = VALUES(username),
    email = VALUES(email),
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    avatar_url = VALUES(avatar_url),
    native_language_id = VALUES(native_language_id),
    target_language_id = VALUES(target_language_id),
    status = VALUES(status),
    timezone = VALUES(timezone),
    daily_goal_cards = VALUES(daily_goal_cards),
    xp_total = VALUES(xp_total),
    streak_current = VALUES(streak_current),
    streak_longest = VALUES(streak_longest),
    last_activity_date = VALUES(last_activity_date),
    last_active_at = VALUES(last_active_at),
    email_verified_at = VALUES(email_verified_at);

-- 5. User roles
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
(1, @role_admin_id, NULL),
(1, @role_learner_id, NULL),
(2, @role_learner_id, 1),
(3, @role_learner_id, 1),
(4, @role_learner_id, 1),
(4, @role_creator_id, 1),
(5, @role_learner_id, 1),
(5, @role_moderator_id, 1)
ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by);

-- 6. Active subscriptions and sample payments
INSERT INTO user_subscriptions (id, user_id, plan_id, status, started_at, expires_at, auto_renew, provider, provider_subscription_id) VALUES
(1, 1, @plan_premium_id, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(NOW(), INTERVAL 305 DAY), TRUE, 'MOMO', 'sub-demo-admin-premium'),
(2, 2, @plan_plus_id, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 16 DAY), TRUE, 'VNPAY', 'sub-demo-lan-plus'),
(3, 3, @plan_free_id, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, FALSE, NULL, NULL),
(4, 4, @plan_premium_id, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_ADD(NOW(), INTERVAL 330 DAY), TRUE, 'MOMO', 'sub-demo-hana-premium'),
(5, 5, @plan_free_id, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, FALSE, NULL, NULL)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    plan_id = VALUES(plan_id),
    status = VALUES(status),
    started_at = VALUES(started_at),
    expires_at = VALUES(expires_at),
    auto_renew = VALUES(auto_renew),
    provider = VALUES(provider),
    provider_subscription_id = VALUES(provider_subscription_id);

INSERT INTO payments (id, user_id, subscription_id, provider, provider_transaction_id, amount, currency_code, status, paid_at, provider_payload) VALUES
(1, 2, 2, 'VNPAY', 'txn-demo-lan-plus-001', 79000, 'VND', 'SUCCEEDED', DATE_SUB(NOW(), INTERVAL 14 DAY), '{"bank":"NCB","channel":"qr"}'),
(2, 4, 4, 'MOMO', 'txn-demo-hana-premium-001', 149000, 'VND', 'SUCCEEDED', DATE_SUB(NOW(), INTERVAL 35 DAY), '{"wallet":"momo","campaign":"creator"}')
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    subscription_id = VALUES(subscription_id),
    provider = VALUES(provider),
    provider_transaction_id = VALUES(provider_transaction_id),
    amount = VALUES(amount),
    currency_code = VALUES(currency_code),
    status = VALUES(status),
    paid_at = VALUES(paid_at),
    provider_payload = VALUES(provider_payload);

-- 7. English decks
INSERT INTO decks (
    id, deck_code, slug, title, description, owner_id, language_id, category,
    difficulty, visibility, status, is_featured, total_cards, view_count,
    enrollment_count, submitted_at, reviewed_by, reviewed_at, published_at
) VALUES
(1, 'D-EN-OFFICE-01', 'tieng-anh-giao-tiep-cong-so', 'Tiếng Anh giao tiếp công sở', 'Cụm câu thường dùng trong email, họp nhóm và trao đổi công việc.', 4, @lang_en_id, 'Giao tiếp', 'BEGINNER', 'PUBLIC', 'PUBLISHED', TRUE, 4, 428, 3, DATE_SUB(NOW(), INTERVAL 20 DAY), 5, DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)),
(2, 'D-EN-TRAVEL-01', 'tieng-anh-du-lich-co-ban', 'Tiếng Anh du lịch cơ bản', 'Mẫu câu ngắn để hỏi đường, đặt phòng, gọi món và xử lý tình huống khi đi du lịch.', 4, @lang_en_id, 'Du lịch', 'BEGINNER', 'PUBLIC', 'PUBLISHED', TRUE, 4, 361, 2, DATE_SUB(NOW(), INTERVAL 12 DAY), 5, DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY))
ON DUPLICATE KEY UPDATE
    deck_code = VALUES(deck_code),
    slug = VALUES(slug),
    title = VALUES(title),
    description = VALUES(description),
    owner_id = VALUES(owner_id),
    language_id = VALUES(language_id),
    category = VALUES(category),
    difficulty = VALUES(difficulty),
    visibility = VALUES(visibility),
    status = VALUES(status),
    is_featured = VALUES(is_featured),
    total_cards = VALUES(total_cards),
    view_count = VALUES(view_count),
    enrollment_count = VALUES(enrollment_count),
    submitted_at = VALUES(submitted_at),
    reviewed_by = VALUES(reviewed_by),
    reviewed_at = VALUES(reviewed_at),
    published_at = VALUES(published_at);

-- 8. English flashcards
INSERT INTO flashcards (id, deck_id, front_text, back_text, phonetic, example_text, hint, note, card_order, is_active, created_by, updated_by) VALUES
(1, 1, 'Could you clarify this point?', 'Bạn có thể làm rõ điểm này không?', 'kud yu klar-uh-fai this point', 'Could you clarify this point before we send the proposal?', 'Dùng khi cần đồng nghiệp giải thích rõ hơn.', 'Mẫu câu lịch sự trong cuộc họp.', 1, TRUE, 4, 4),
(2, 1, 'I will follow up by email.', 'Tôi sẽ trao đổi tiếp qua email.', 'ai wil fol-oh up bai ee-mail', 'I will follow up by email after the meeting.', 'follow up = tiếp tục xử lý hoặc nhắc lại.', 'Dùng sau cuộc họp hoặc cuộc gọi.', 2, TRUE, 4, 4),
(3, 1, 'The deadline has been moved up.', 'Hạn chót đã được đẩy lên sớm hơn.', 'the ded-lain haz bin moovd up', 'The deadline has been moved up to Friday morning.', 'move up = dời lên sớm hơn.', 'Phân biệt với move back là dời muộn hơn.', 3, TRUE, 4, 4),
(4, 1, 'Let us sync again tomorrow.', 'Ngày mai chúng ta trao đổi lại nhé.', 'let us sink uh-gen tuh-maw-row', 'Let us sync again tomorrow after the client responds.', 'sync = cập nhật, trao đổi để thống nhất.', 'Câu thân thiện trong môi trường công sở.', 4, TRUE, 4, 4),
(5, 2, 'Where is the nearest station?', 'Nhà ga gần nhất ở đâu?', 'wer iz the neer-est stay-shun', 'Excuse me, where is the nearest station?', 'nearest = gần nhất.', 'Câu hỏi đường cơ bản.', 1, TRUE, 4, 4),
(6, 2, 'I would like to check in.', 'Tôi muốn làm thủ tục nhận phòng.', 'ai wood laik tu chek in', 'Hello, I would like to check in under the name Lan.', 'check in = nhận phòng hoặc làm thủ tục.', 'Dùng ở khách sạn hoặc sân bay.', 2, TRUE, 4, 4),
(7, 2, 'Could I have the menu, please?', 'Cho tôi xin thực đơn được không?', 'kud ai hav the men-yu pleez', 'Could I have the menu, please? I am ready to order.', 'please giúp câu lịch sự hơn.', 'Dùng trong nhà hàng.', 3, TRUE, 4, 4),
(8, 2, 'How much does this cost?', 'Cái này giá bao nhiêu?', 'hau much duz this kost', 'How much does this cost after the discount?', 'cost = có giá.', 'Dùng khi mua sắm.', 4, TRUE, 4, 4)
ON DUPLICATE KEY UPDATE
    deck_id = VALUES(deck_id),
    front_text = VALUES(front_text),
    back_text = VALUES(back_text),
    phonetic = VALUES(phonetic),
    example_text = VALUES(example_text),
    hint = VALUES(hint),
    note = VALUES(note),
    card_order = VALUES(card_order),
    is_active = VALUES(is_active),
    created_by = VALUES(created_by),
    updated_by = VALUES(updated_by);

-- 9. Tags
INSERT INTO tags (id, name, slug) VALUES
(1, 'giao tiếp', 'giao-tiep'),
(2, 'công sở', 'cong-so'),
(3, 'du lịch', 'du-lich'),
(4, 'nhà hàng', 'nha-hang'),
(5, 'mẫu câu', 'mau-cau'),
(6, 'người mới bắt đầu', 'nguoi-moi-bat-dau'),
(7, 'email', 'email'),
(8, 'khách sạn', 'khach-san')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    slug = VALUES(slug);

INSERT INTO flashcard_tags (flashcard_id, tag_id) VALUES
(1, 1), (1, 2), (1, 5),
(2, 1), (2, 2), (2, 7),
(3, 2), (3, 5),
(4, 1), (4, 2),
(5, 3), (5, 5), (5, 6),
(6, 3), (6, 8),
(7, 3), (7, 4),
(8, 3), (8, 5)
ON DUPLICATE KEY UPDATE flashcard_id = VALUES(flashcard_id);

-- 10. Deck enrollments and learning progress
INSERT INTO deck_enrollments (
    id, user_id, deck_id, status, enrolled_at, last_studied_at,
    next_review_at, mastered_cards, note
) VALUES
(1, 2, 1, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 5 HOUR), 2, 'Ưu tiên luyện mẫu câu họp nhóm.'),
(2, 2, 2, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 1, 'Ôn trước chuyến du lịch.'),
(3, 3, 1, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 3 HOUR), 1, 'Tập nói chậm và rõ trong buổi họp.'),
(4, 3, 2, 'ACTIVE', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_ADD(NOW(), INTERVAL 8 HOUR), 0, 'Luyện các câu giao tiếp khi đi sân bay và khách sạn.'),
(5, 4, 1, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), NULL, 4, 'Deck mẫu đã hoàn thành để kiểm tra nội dung.')
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    deck_id = VALUES(deck_id),
    status = VALUES(status),
    enrolled_at = VALUES(enrolled_at),
    last_studied_at = VALUES(last_studied_at),
    next_review_at = VALUES(next_review_at),
    mastered_cards = VALUES(mastered_cards),
    note = VALUES(note);

INSERT INTO card_progress (
    id, user_id, card_id, state, ease_factor, interval_days, repetitions,
    lapse_count, learning_step, scheduled_days, elapsed_days, due_at,
    last_reviewed_at, last_rating, total_reviews, correct_count,
    again_count, hard_count, good_count, easy_count
) VALUES
(1, 2, 1, 'REVIEW', 2.60, 4, 3, 0, 0, 4, 4, DATE_ADD(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 4 DAY), 3, 3, 3, 0, 0, 2, 1),
(2, 2, 2, 'LEARNING', 2.40, 1, 1, 0, 1, 1, 1, DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY), 2, 2, 1, 0, 1, 1, 0),
(3, 2, 5, 'REVIEW', 2.70, 3, 2, 0, 0, 3, 3, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 4, 2, 2, 0, 0, 1, 1),
(4, 3, 1, 'LEARNING', 2.50, 0, 0, 0, 0, 0, 0, DATE_ADD(NOW(), INTERVAL 3 HOUR), NULL, NULL, 0, 0, 0, 0, 0, 0),
(5, 3, 6, 'LEARNING', 2.30, 1, 1, 1, 1, 1, 1, DATE_ADD(NOW(), INTERVAL 8 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY), 1, 3, 1, 1, 1, 1, 0),
(6, 3, 7, 'NEW', 2.50, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    card_id = VALUES(card_id),
    state = VALUES(state),
    ease_factor = VALUES(ease_factor),
    interval_days = VALUES(interval_days),
    repetitions = VALUES(repetitions),
    lapse_count = VALUES(lapse_count),
    learning_step = VALUES(learning_step),
    scheduled_days = VALUES(scheduled_days),
    elapsed_days = VALUES(elapsed_days),
    due_at = VALUES(due_at),
    last_reviewed_at = VALUES(last_reviewed_at),
    last_rating = VALUES(last_rating),
    total_reviews = VALUES(total_reviews),
    correct_count = VALUES(correct_count),
    again_count = VALUES(again_count),
    hard_count = VALUES(hard_count),
    good_count = VALUES(good_count),
    easy_count = VALUES(easy_count);

-- 11. Quizzes
INSERT INTO quizzes (
    id, deck_id, quiz_code, title, description, quiz_type, time_limit_seconds,
    pass_score, max_attempts, total_questions, created_by, updated_by
) VALUES
(1, 1, 'Q-EN-OFFICE-01', 'Quiz tiếng Anh công sở', 'Kiểm tra nhanh các mẫu câu công sở thường gặp.', 'MULTIPLE_CHOICE', 300, 60.00, 3, 2, 4, 4),
(2, 2, 'Q-EN-TRAVEL-01', 'Quiz tiếng Anh du lịch', 'Ôn mẫu câu hỏi đường, nhận phòng, gọi món và mua sắm.', 'MULTIPLE_CHOICE', 240, 60.00, 3, 2, 4, 4)
ON DUPLICATE KEY UPDATE
    deck_id = VALUES(deck_id),
    quiz_code = VALUES(quiz_code),
    title = VALUES(title),
    description = VALUES(description),
    quiz_type = VALUES(quiz_type),
    time_limit_seconds = VALUES(time_limit_seconds),
    pass_score = VALUES(pass_score),
    max_attempts = VALUES(max_attempts),
    total_questions = VALUES(total_questions),
    created_by = VALUES(created_by),
    updated_by = VALUES(updated_by);

INSERT INTO quiz_questions (
    id, quiz_id, source_card_id, question_text, question_type,
    explanation, points, display_order, is_active
) VALUES
(1, 1, 1, 'Câu nào có nghĩa là "Bạn có thể làm rõ điểm này không?"', 'MULTIPLE_CHOICE', 'Could you clarify this point? là cách hỏi lịch sự khi cần giải thích thêm.', 10, 1, TRUE),
(2, 1, 3, '"The deadline has been moved up" nghĩa là gì?', 'MULTIPLE_CHOICE', 'Move up trong bối cảnh deadline là dời lên sớm hơn.', 10, 2, TRUE),
(3, 2, 5, 'Câu nào dùng để hỏi nhà ga gần nhất?', 'MULTIPLE_CHOICE', 'Where is the nearest station? là câu hỏi đường cơ bản.', 10, 1, TRUE),
(4, 2, 7, '"Could I have the menu, please?" dùng trong tình huống nào?', 'MULTIPLE_CHOICE', 'Câu này dùng để xin thực đơn trong nhà hàng.', 10, 2, TRUE)
ON DUPLICATE KEY UPDATE
    quiz_id = VALUES(quiz_id),
    source_card_id = VALUES(source_card_id),
    question_text = VALUES(question_text),
    question_type = VALUES(question_type),
    explanation = VALUES(explanation),
    points = VALUES(points),
    display_order = VALUES(display_order),
    is_active = VALUES(is_active);

INSERT INTO quiz_question_options (id, question_id, option_key, option_text, normalized_text, is_correct, display_order) VALUES
(1, 1, 'A', 'Could you clarify this point?', 'could you clarify this point', TRUE, 1),
(2, 1, 'B', 'I will follow up by email.', 'i will follow up by email', FALSE, 2),
(3, 1, 'C', 'Let us sync again tomorrow.', 'let us sync again tomorrow', FALSE, 3),
(4, 1, 'D', 'The deadline has been moved up.', 'the deadline has been moved up', FALSE, 4),
(5, 2, 'A', 'Hạn chót bị hủy.', 'han chot bi huy', FALSE, 1),
(6, 2, 'B', 'Hạn chót được dời muộn hơn.', 'han chot duoc doi muon hon', FALSE, 2),
(7, 2, 'C', 'Hạn chót được đẩy lên sớm hơn.', 'han chot duoc day len som hon', TRUE, 3),
(8, 2, 'D', 'Hạn chót không thay đổi.', 'han chot khong thay doi', FALSE, 4),
(9, 3, 'A', 'Where is the nearest station?', 'where is the nearest station', TRUE, 1),
(10, 3, 'B', 'I would like to check in.', 'i would like to check in', FALSE, 2),
(11, 3, 'C', 'How much does this cost?', 'how much does this cost', FALSE, 3),
(12, 3, 'D', 'Could I have the menu, please?', 'could i have the menu please', FALSE, 4),
(13, 4, 'A', 'Khi hỏi đường đến nhà ga.', 'hoi duong den nha ga', FALSE, 1),
(14, 4, 'B', 'Khi xin thực đơn trong nhà hàng.', 'xin thuc don trong nha hang', TRUE, 2),
(15, 4, 'C', 'Khi hỏi giá món đồ.', 'hoi gia mon do', FALSE, 3),
(16, 4, 'D', 'Khi nhận phòng khách sạn.', 'nhan phong khach san', FALSE, 4)
ON DUPLICATE KEY UPDATE
    question_id = VALUES(question_id),
    option_key = VALUES(option_key),
    option_text = VALUES(option_text),
    normalized_text = VALUES(normalized_text),
    is_correct = VALUES(is_correct),
    display_order = VALUES(display_order);

-- 12. Review history, activity, notifications and leaderboard
INSERT INTO review_sessions (id, public_id, user_id, deck_id, session_type, status, device_id, offline_mode, started_at, completed_at) VALUES
(1, '11111111-1111-4111-8111-111111111111', 2, 1, 'REGULAR', 'COMPLETED', 'web-demo-lan', FALSE, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, '22222222-2222-4222-8222-222222222222', 3, 2, 'LEARN_NEW', 'COMPLETED', 'mobile-demo-khoi', TRUE, DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR))
ON DUPLICATE KEY UPDATE
    public_id = VALUES(public_id),
    user_id = VALUES(user_id),
    deck_id = VALUES(deck_id),
    session_type = VALUES(session_type),
    status = VALUES(status),
    device_id = VALUES(device_id),
    offline_mode = VALUES(offline_mode),
    started_at = VALUES(started_at),
    completed_at = VALUES(completed_at);

INSERT INTO srs_reviews (
    id, review_session_id, user_id, card_id, client_event_id, rating,
    response_ms, previous_state, new_state, ease_before, ease_after,
    interval_before, interval_after, due_before, due_after,
    algorithm_version, xp_awarded, client_reviewed_at, server_received_at, reviewed_at
) VALUES
(1, 1, 2, 1, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, 4100, 'REVIEW', 'REVIEW', 2.50, 2.60, 2, 4, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 5 HOUR), 'SM2_V1', 10, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 1, 2, 2, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2, 6200, 'LEARNING', 'LEARNING', 2.50, 2.40, 0, 1, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'SM2_V1', 6, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 2, 3, 6, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 1, 7800, 'LEARNING', 'RELEARNING', 2.50, 2.30, 1, 1, DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_ADD(NOW(), INTERVAL 8 HOUR), 'SM2_V1', 3, DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR))
ON DUPLICATE KEY UPDATE
    review_session_id = VALUES(review_session_id),
    user_id = VALUES(user_id),
    card_id = VALUES(card_id),
    client_event_id = VALUES(client_event_id),
    rating = VALUES(rating),
    response_ms = VALUES(response_ms),
    previous_state = VALUES(previous_state),
    new_state = VALUES(new_state),
    ease_before = VALUES(ease_before),
    ease_after = VALUES(ease_after),
    interval_before = VALUES(interval_before),
    interval_after = VALUES(interval_after),
    due_before = VALUES(due_before),
    due_after = VALUES(due_after),
    algorithm_version = VALUES(algorithm_version),
    xp_awarded = VALUES(xp_awarded),
    client_reviewed_at = VALUES(client_reviewed_at),
    server_received_at = VALUES(server_received_at),
    reviewed_at = VALUES(reviewed_at);

INSERT INTO daily_learning_activities (id, user_id, activity_date, timezone, review_count, cards_learned, quiz_count, minutes_spent, xp_earned, goal_met) VALUES
(1, 2, CURDATE(), 'Asia/Ho_Chi_Minh', 12, 4, 1, 28, 96, TRUE),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Asia/Ho_Chi_Minh', 8, 2, 0, 16, 58, FALSE),
(3, 3, CURDATE(), 'Asia/Ho_Chi_Minh', 6, 3, 1, 22, 64, TRUE),
(4, 4, CURDATE(), 'Asia/Ho_Chi_Minh', 4, 0, 0, 12, 24, FALSE),
(5, 5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Asia/Ho_Chi_Minh', 5, 1, 0, 15, 35, TRUE)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    activity_date = VALUES(activity_date),
    timezone = VALUES(timezone),
    review_count = VALUES(review_count),
    cards_learned = VALUES(cards_learned),
    quiz_count = VALUES(quiz_count),
    minutes_spent = VALUES(minutes_spent),
    xp_earned = VALUES(xp_earned),
    goal_met = VALUES(goal_met);

INSERT INTO notifications (
    id, user_id, type, channel, status, title, message, action_url,
    related_entity_type, related_entity_id, deduplication_key,
    is_read, read_at, scheduled_at, delivered_at
) VALUES
(1, 2, 'REVIEW_DUE', 'IN_APP', 'SENT', 'Đến giờ ôn tập', 'Bạn có 3 thẻ trong deck Tiếng Anh giao tiếp công sở cần ôn hôm nay.', '/decks/1/review', 'DECK', 1, 'review-due-2-1-today', FALSE, NULL, NOW(), NOW()),
(2, 3, 'STREAK_REMINDER', 'IN_APP', 'SENT', 'Giữ streak hôm nay', 'Hoàn thành 15 thẻ để giữ chuỗi 4 ngày học liên tiếp.', '/study', 'USER', 3, 'streak-3-today', FALSE, NULL, NOW(), NOW()),
(3, 4, 'NEW_CONTENT', 'IN_APP', 'SENT', 'Deck của bạn đã được xuất bản', 'Deck Tiếng Anh du lịch cơ bản đã được kiểm duyệt và xuất bản.', '/decks/2', 'DECK', 2, 'deck-published-2', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    type = VALUES(type),
    channel = VALUES(channel),
    status = VALUES(status),
    title = VALUES(title),
    message = VALUES(message),
    action_url = VALUES(action_url),
    related_entity_type = VALUES(related_entity_type),
    related_entity_id = VALUES(related_entity_id),
    deduplication_key = VALUES(deduplication_key),
    is_read = VALUES(is_read),
    read_at = VALUES(read_at),
    scheduled_at = VALUES(scheduled_at),
    delivered_at = VALUES(delivered_at);

INSERT INTO leaderboard_snapshots (
    id, user_id, period_type, period_start, period_end,
    xp_score, quiz_score, streak_days, cards_mastered, total_score
) VALUES
(1, 2, 'WEEKLY', DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY), 460, 80, 8, 18, 558),
(2, 3, 'WEEKLY', DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY), 320, 60, 4, 10, 394),
(3, 4, 'WEEKLY', DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY), 620, 110, 17, 24, 771),
(4, 5, 'WEEKLY', DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY), 210, 20, 2, 7, 239)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    period_type = VALUES(period_type),
    period_start = VALUES(period_start),
    period_end = VALUES(period_end),
    xp_score = VALUES(xp_score),
    quiz_score = VALUES(quiz_score),
    streak_days = VALUES(streak_days),
    cards_mastered = VALUES(cards_mastered),
    total_score = VALUES(total_score);

SET FOREIGN_KEY_CHECKS = 1;

-- Mock data insertion completed.
