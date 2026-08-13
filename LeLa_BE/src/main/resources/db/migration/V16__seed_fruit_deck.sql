-- V16__seed_fruit_deck.sql

-- 1. Tạo Topic (Chủ đề)
INSERT INTO topics (id, name, slug, description, is_active) 
VALUES (2, 'Basic Vocabulary', 'basic-vocabulary', 'Từ vựng tiếng Anh cơ bản cho người mới bắt đầu.', true)
ON DUPLICATE KEY UPDATE id=id;

-- 2. Tạo Deck (Bộ thẻ) Fruits
-- Đảm bảo có user admin (owner_id = 1) và language_id = 1 (Tiếng Anh) - dữ liệu mặc định từ V5
INSERT INTO decks (
    id, deck_code, slug, title, description, cover_image_url, owner_id, language_id, topic_id, 
    difficulty, visibility, status, is_featured, total_cards, display_mode
) VALUES (
    1, 'FRUITS-001', 'tu-vung-trai-cay', 'Trái cây cơ bản (Fruits)', 
    'Bộ từ vựng cơ bản về các loại trái cây quen thuộc trong đời sống hàng ngày.', 
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop', 
    (SELECT id FROM users WHERE username = 'admin'), 
    (SELECT id FROM languages WHERE language_code = 'en'), 
    2, 
    'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'
) ON DUPLICATE KEY UPDATE id=id;

-- 3. Tạo Flashcards cho Deck Fruits
INSERT INTO flashcards (
    id, deck_id, front_text, back_text, phonetic, example_text, hint, card_color, card_order, is_active, created_by
) VALUES 
(1, 1, 'Apple', 'Quả táo', 'ˈæp.əl', 'I eat an apple every day.', 'Quả tròn, màu đỏ hoặc xanh.', 'bg-brand-coral', 1, true, (SELECT id FROM users WHERE username = 'admin')),
(2, 1, 'Banana', 'Quả chuối', 'bəˈnæn.ə', 'Monkeys love bananas.', 'Dài, vỏ màu vàng.', 'bg-[#FFB703]', 2, true, (SELECT id FROM users WHERE username = 'admin')),
(3, 1, 'Orange', 'Quả cam', 'ˈɒr.ɪndʒ', 'Orange juice is good for health.', 'Tròn, màu cam, nhiều vitamin C.', 'bg-[#FB8500]', 3, true, (SELECT id FROM users WHERE username = 'admin')),
(4, 1, 'Watermelon', 'Quả dưa hấu', 'ˈwɔː.təˌmel.ən', 'Watermelon is refreshing in summer.', 'Rất to, ruột đỏ, nhiều nước.', 'bg-brand-teal', 4, true, (SELECT id FROM users WHERE username = 'admin')),
(5, 1, 'Strawberry', 'Quả dâu tây', 'ˈstrɔː.bər.i', 'She bought a basket of strawberries.', 'Nhỏ, màu đỏ, có hạt lấm tấm bên ngoài.', 'bg-[#FF006E]', 5, true, (SELECT id FROM users WHERE username = 'admin'))
ON DUPLICATE KEY UPDATE id=id;
