-- V21__add_more_sample_data.sql

-- 1. Tạo Topic mới (Chủ đề)
INSERT INTO topics (name, slug, description, is_active) 
VALUES ('Animals', 'animals', 'Từ vựng tiếng Anh về các loài động vật.', true)
ON DUPLICATE KEY UPDATE id=id;

-- 2. Tạo Deck mới (Bộ thẻ)
INSERT INTO decks (deck_code, slug, title, description, cover_image_url, owner_id, language_id, topic_id, difficulty, visibility, status, is_featured, total_cards, display_mode) 
VALUES (
    'DECK-EN-ANIMALS', 'tu-vung-dong-vat', 'Động vật thông dụng (Animals)', 
    'Bộ từ vựng cơ bản về các loài động vật quen thuộc.', 
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800&auto=format&fit=crop', 
    (SELECT id FROM users WHERE username = 'admin'), 
    (SELECT id FROM languages WHERE language_code = 'en'), 
    (SELECT id FROM topics WHERE slug = 'animals'), 
    'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'
) ON DUPLICATE KEY UPDATE id=id;

-- 3. Tạo Flashcards (Thẻ)
INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, example_text, hint, card_color, card_order, is_active, created_by) 
VALUES 
((SELECT id FROM decks WHERE deck_code='DECK-EN-ANIMALS'), 'Dog', 'Con chó', 'dɒɡ', 'The dog is barking.', 'Thú cưng giữ nhà, sủa gâu gâu.', 'bg-brand-coral', 1, true, (SELECT id FROM users WHERE username = 'admin')),
((SELECT id FROM decks WHERE deck_code='DECK-EN-ANIMALS'), 'Cat', 'Con mèo', 'kæt', 'The cat is sleeping on the sofa.', 'Thú cưng bắt chuột, kêu meo meo.', 'bg-[#FFB703]', 2, true, (SELECT id FROM users WHERE username = 'admin')),
((SELECT id FROM decks WHERE deck_code='DECK-EN-ANIMALS'), 'Bird', 'Con chim', 'bɜːd', 'A bird is singing in the tree.', 'Động vật có cánh, biết bay.', 'bg-[#FB8500]', 3, true, (SELECT id FROM users WHERE username = 'admin')),
((SELECT id FROM decks WHERE deck_code='DECK-EN-ANIMALS'), 'Elephant', 'Con voi', 'ˈel.ɪ.fənt', 'An elephant has a long trunk.', 'Động vật to lớn, có vòi dài.', 'bg-brand-teal', 4, true, (SELECT id FROM users WHERE username = 'admin')),
((SELECT id FROM decks WHERE deck_code='DECK-EN-ANIMALS'), 'Lion', 'Con sư tử', 'ˈlaɪ.ən', 'The lion is the king of the jungle.', 'Chúa tể sơn lâm.', 'bg-[#FF006E]', 5, true, (SELECT id FROM users WHERE username = 'admin'))
ON DUPLICATE KEY UPDATE id=id;

-- 4. Tạo Quizzes (Bài kiểm tra)
INSERT INTO quizzes (deck_id, quiz_code, title, description, quiz_type, time_limit_seconds, pass_score, max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, created_by, version) 
VALUES 
((SELECT id FROM decks WHERE deck_code='DECK-EN-ANIMALS'), 'Q-EN-ANIMALS-01', 'Bài kiểm tra Động vật', 'Kiểm tra trí nhớ về các loài động vật.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, (SELECT id FROM users WHERE username='admin'), 0)
ON DUPLICATE KEY UPDATE id=id;
