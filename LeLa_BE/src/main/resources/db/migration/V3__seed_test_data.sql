-- Seed user test
INSERT IGNORE INTO users (username, email, password_hash, full_name, status, timezone, version)
VALUES ('admin', 'admin@lela.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyWEAR5eW', 'Admin User', 'ACTIVE', 'Asia/Ho_Chi_Minh', 0);

-- Seed deck test (language_id=1 là tiếng Anh từ V1)
INSERT IGNORE INTO decks (deck_code, slug, title, description, owner_id, language_id, difficulty, visibility, status, version)
VALUES
('DECK-001', 'deck-tieng-anh-co-so', 'Tiếng Anh công sở', 'Deck test 1', 1, 1, 'BEGINNER', 'PUBLIC', 'PUBLISHED', 0),
('DECK-002', 'deck-tieng-anh-du-lich', 'Tiếng Anh du lịch', 'Deck test 2', 1, 1, 'BEGINNER', 'PUBLIC', 'PUBLISHED', 0);
