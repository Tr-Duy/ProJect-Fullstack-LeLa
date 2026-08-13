-- ===== V5: Seed LeLa data =====

-- Clean up old test data nếu còn
DELETE FROM quizzes        WHERE quiz_code IN ('Q-EN-OFFICE-01','Q-EN-TRAVEL-01');
DELETE FROM flashcards     WHERE deck_id IN (SELECT id FROM decks WHERE deck_code IN ('DECK-EN-OFFICE','DECK-EN-TRAVEL','DECK-EN-BASIC','DECK-001','DECK-002'));
DELETE FROM decks          WHERE deck_code IN ('DECK-EN-OFFICE','DECK-EN-TRAVEL','DECK-EN-BASIC','DECK-001','DECK-002');
DELETE FROM user_roles     WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','learner1','learner2'));
DELETE FROM payments       WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','learner1','learner2'));
DELETE FROM user_subscriptions WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','learner1','learner2'));
DELETE FROM users          WHERE username IN ('admin','learner1','learner2');
DELETE FROM quizzes   WHERE quiz_code IN ('Q-EN-OFFICE-01','Q-EN-TRAVEL-01');
DELETE FROM flashcards WHERE deck_id IN (SELECT id FROM decks WHERE deck_code IN ('DECK-EN-OFFICE','DECK-EN-TRAVEL','DECK-EN-BASIC','DECK-001','DECK-002'));
DELETE FROM decks     WHERE deck_code IN ('DECK-EN-OFFICE','DECK-EN-TRAVEL','DECK-EN-BASIC','DECK-001','DECK-002');
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin','learner1','learner2'));
DELETE FROM users     WHERE username IN ('admin','learner1','learner2');

-- 1. Users
INSERT INTO users (username, email, password_hash, full_name, status, timezone, version) VALUES
('admin',    'admin@lela.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyWEAR5eW', 'Admin LeLa',  'ACTIVE', 'Asia/Ho_Chi_Minh', 0),
('learner1', 'learner1@lela.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyWEAR5eW', 'Học viên 1',  'ACTIVE', 'Asia/Ho_Chi_Minh', 0),
('learner2', 'learner2@lela.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyWEAR5eW', 'Học viên 2',  'ACTIVE', 'Asia/Ho_Chi_Minh', 0);

-- 2. Assign ADMIN role
INSERT INTO user_roles (user_id, role_id) VALUES (
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM roles  WHERE role_code = 'ADMIN')
);

-- 3. Decks
INSERT INTO decks (deck_code, slug, title, description, owner_id, language_id, difficulty, visibility, status, version) VALUES
('DECK-EN-OFFICE', 'tieng-anh-cong-so', 'Tiếng Anh công sở',  'Từ vựng và mẫu câu tiếng Anh dùng trong văn phòng',
    (SELECT id FROM users     WHERE username      = 'admin'),
    (SELECT id FROM languages WHERE language_code = 'en'),
    'INTERMEDIATE', 'PUBLIC', 'PUBLISHED', 0),
('DECK-EN-TRAVEL', 'tieng-anh-du-lich', 'Tiếng Anh du lịch',  'Hỏi đường, đặt phòng, gọi món, mua sắm',
    (SELECT id FROM users     WHERE username      = 'admin'),
    (SELECT id FROM languages WHERE language_code = 'en'),
    'BEGINNER', 'PUBLIC', 'PUBLISHED', 0),
('DECK-EN-BASIC',  'tieng-anh-co-ban',  'Tiếng Anh cơ bản',   'Từ vựng và ngữ pháp tiếng Anh căn bản',
    (SELECT id FROM users     WHERE username      = 'admin'),
    (SELECT id FROM languages WHERE language_code = 'en'),
    'BEGINNER', 'PUBLIC', 'PUBLISHED', 0);

-- 4. Flashcards - công sở
INSERT INTO flashcards (deck_id, front_text, back_text, card_order, is_active, created_by, version) VALUES
((SELECT id FROM decks WHERE deck_code='DECK-EN-OFFICE'), 'Meeting',      'Cuộc họp',             1, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-OFFICE'), 'Deadline',     'Thời hạn hoàn thành',  2, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-OFFICE'), 'Presentation', 'Bài thuyết trình',     3, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-OFFICE'), 'Report',       'Báo cáo',              4, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-OFFICE'), 'Colleague',    'Đồng nghiệp',          5, TRUE, (SELECT id FROM users WHERE username='admin'), 0);

-- 5. Flashcards - du lịch
INSERT INTO flashcards (deck_id, front_text, back_text, card_order, is_active, created_by, version) VALUES
((SELECT id FROM decks WHERE deck_code='DECK-EN-TRAVEL'), 'Where is the hotel?',    'Khách sạn ở đâu?',       1, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-TRAVEL'), 'Check in',               'Làm thủ tục nhận phòng', 2, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-TRAVEL'), 'I would like to order',  'Tôi muốn gọi món',       3, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-TRAVEL'), 'How much does it cost?', 'Cái này giá bao nhiêu?', 4, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-TRAVEL'), 'Turn left / Turn right', 'Rẽ trái / Rẽ phải',      5, TRUE, (SELECT id FROM users WHERE username='admin'), 0);

-- 6. Quizzes
INSERT INTO quizzes (deck_id, quiz_code, title, description, quiz_type, time_limit_seconds, pass_score, max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, created_by, version) VALUES
((SELECT id FROM decks WHERE deck_code='DECK-EN-OFFICE'), 'Q-EN-OFFICE-01', 'Quiz tiếng Anh công sở', 'Kiểm tra nhanh các mẫu câu công sở thường gặp.',           'MULTIPLE_CHOICE', 300, 60.00, 3, TRUE, TRUE, 4, TRUE, (SELECT id FROM users WHERE username='admin'), 0),
((SELECT id FROM decks WHERE deck_code='DECK-EN-TRAVEL'), 'Q-EN-TRAVEL-01', 'Quiz tiếng Anh du lịch', 'Ôn mẫu câu hỏi đường, nhận phòng, gọi món và mua sắm.',    'MULTIPLE_CHOICE', 240, 60.00, 3, TRUE, TRUE, 4, TRUE, (SELECT id FROM users WHERE username='admin'), 0);
