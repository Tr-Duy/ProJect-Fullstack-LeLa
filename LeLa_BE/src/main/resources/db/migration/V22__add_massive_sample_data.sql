-- V22__add_massive_sample_data.sql

-- 1. Topics (Chủ đề)
INSERT INTO topics (name, slug, description, is_active) VALUES 
('Colors', 'colors', 'Từ vựng tiếng Anh về các màu sắc.', true),
('Numbers', 'numbers', 'Từ vựng tiếng Anh về số đếm.', true),
('Family', 'family', 'Từ vựng tiếng Anh về các thành viên gia đình.', true),
('Food & Drinks', 'food-drinks', 'Từ vựng về đồ ăn và thức uống.', true),
('Weather', 'weather', 'Từ vựng về các hiện tượng thời tiết.', true),
('Body Parts', 'body-parts', 'Từ vựng về các bộ phận cơ thể.', true),
('Clothes', 'clothes', 'Từ vựng về quần áo và phụ kiện.', true),
('Transportation', 'transportation', 'Từ vựng về các phương tiện giao thông.', true),
('Jobs', 'jobs', 'Từ vựng về các nghề nghiệp.', true),
('Hobbies', 'hobbies', 'Từ vựng về sở thích và giải trí.', true)
ON DUPLICATE KEY UPDATE id=id;

-- 2. Decks (Bộ thẻ)
-- Lấy id của admin và ngôn ngữ en (Tiếng Anh) cho tiện
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @lang_en_id = (SELECT id FROM languages WHERE language_code = 'en' LIMIT 1);

INSERT INTO decks (deck_code, slug, title, description, cover_image_url, owner_id, language_id, topic_id, difficulty, visibility, status, is_featured, total_cards, display_mode) 
VALUES 
('DECK-COLORS', 'tu-vung-mau-sac', 'Màu sắc (Colors)', 'Bộ từ vựng cơ bản về màu sắc.', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'colors'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-NUMBERS', 'tu-vung-so-dem', 'Số đếm (Numbers)', 'Học đếm số từ 1 đến 10.', 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'numbers'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-FAMILY', 'tu-vung-gia-dinh', 'Gia đình (Family)', 'Các từ vựng chỉ người thân trong gia đình.', 'https://images.unsplash.com/photo-1511895426328-dc8714191300', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'family'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-FOOD', 'tu-vung-do-an', 'Đồ ăn (Food)', 'Các món ăn và đồ uống thông dụng.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'food-drinks'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-WEATHER', 'tu-vung-thoi-tiet', 'Thời tiết (Weather)', 'Từ vựng miêu tả thời tiết.', 'https://images.unsplash.com/photo-1534088568595-a066f410cbda', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'weather'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-BODY', 'tu-vung-co-the', 'Cơ thể người (Body)', 'Từ vựng các bộ phận trên cơ thể.', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'body-parts'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-CLOTHES', 'tu-vung-quan-ao', 'Quần áo (Clothes)', 'Từ vựng về trang phục.', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'clothes'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-TRANS', 'tu-vung-giao-thong', 'Giao thông (Transport)', 'Các loại phương tiện đi lại.', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'transportation'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-JOBS', 'tu-vung-nghe-nghiep', 'Nghề nghiệp (Jobs)', 'Tên các công việc phổ biến.', 'https://images.unsplash.com/photo-1521791136064-7986c2920216', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'jobs'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM'),
('DECK-HOBBIES', 'tu-vung-so-thich', 'Sở thích (Hobbies)', 'Từ vựng về các hoạt động rảnh rỗi.', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', @admin_id, @lang_en_id, (SELECT id FROM topics WHERE slug = 'hobbies'), 'BEGINNER', 'PUBLIC', 'PUBLISHED', true, 5, 'RANDOM')
ON DUPLICATE KEY UPDATE id=id;

-- 3. Flashcards (5 thẻ mỗi bộ để tránh quá dài)
-- Màu sắc
INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, example_text, hint, card_color, card_order, is_active, created_by) VALUES 
((SELECT id FROM decks WHERE deck_code='DECK-COLORS'), 'Red', 'Màu đỏ', 'red', 'The apple is red.', 'Màu của máu.', 'bg-[#FF0000]', 1, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-COLORS'), 'Blue', 'Màu xanh dương', 'bluː', 'The sky is blue.', 'Màu của bầu trời.', 'bg-[#0000FF]', 2, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-COLORS'), 'Green', 'Màu xanh lá', 'ɡriːn', 'The grass is green.', 'Màu của lá cây.', 'bg-[#00FF00]', 3, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-COLORS'), 'Yellow', 'Màu vàng', 'ˈjel.əʊ', 'The sun is yellow.', 'Màu của hoa hướng dương.', 'bg-[#FFFF00]', 4, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-COLORS'), 'Black', 'Màu đen', 'blæk', 'The cat is black.', 'Màu của màn đêm.', 'bg-[#000000]', 5, true, @admin_id);

-- Số đếm
INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, example_text, card_color, card_order, is_active, created_by) VALUES 
((SELECT id FROM decks WHERE deck_code='DECK-NUMBERS'), 'One', 'Số một', 'wʌn', 'I have one dog.', 'bg-gray-500', 1, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-NUMBERS'), 'Two', 'Số hai', 'tuː', 'I have two cats.', 'bg-gray-500', 2, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-NUMBERS'), 'Three', 'Số ba', 'θriː', 'There are three birds.', 'bg-gray-500', 3, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-NUMBERS'), 'Four', 'Số bốn', 'fɔːr', 'A car has four wheels.', 'bg-gray-500', 4, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-NUMBERS'), 'Five', 'Số năm', 'faɪv', 'I have five fingers on a hand.', 'bg-gray-500', 5, true, @admin_id);

-- Gia đình
INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, example_text, card_color, card_order, is_active, created_by) VALUES 
((SELECT id FROM decks WHERE deck_code='DECK-FAMILY'), 'Father', 'Bố / Cha', 'ˈfɑː.ðər', 'My father is a doctor.', 'bg-blue-400', 1, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FAMILY'), 'Mother', 'Mẹ', 'ˈmʌð.ər', 'My mother loves cooking.', 'bg-pink-400', 2, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FAMILY'), 'Brother', 'Anh/em trai', 'ˈbrʌð.ər', 'I have an older brother.', 'bg-blue-300', 3, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FAMILY'), 'Sister', 'Chị/em gái', 'ˈsɪs.tər', 'My sister is very tall.', 'bg-pink-300', 4, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FAMILY'), 'Baby', 'Em bé', 'ˈbeɪ.bi', 'The baby is crying.', 'bg-yellow-200', 5, true, @admin_id);

-- Đồ ăn
INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, example_text, card_color, card_order, is_active, created_by) VALUES 
((SELECT id FROM decks WHERE deck_code='DECK-FOOD'), 'Bread', 'Bánh mì', 'bred', 'I eat bread for breakfast.', 'bg-orange-300', 1, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FOOD'), 'Rice', 'Cơm / Gạo', 'raɪs', 'Vietnamese people eat rice daily.', 'bg-gray-100', 2, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FOOD'), 'Meat', 'Thịt', 'miːt', 'He does not eat meat.', 'bg-red-400', 3, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FOOD'), 'Water', 'Nước', 'ˈwɔː.tər', 'Please give me some water.', 'bg-blue-200', 4, true, @admin_id),
((SELECT id FROM decks WHERE deck_code='DECK-FOOD'), 'Milk', 'Sữa', 'mɪlk', 'Milk is good for bones.', 'bg-gray-50', 5, true, @admin_id);

-- Quizzes (10 Bài kiểm tra)
INSERT INTO quizzes (deck_id, quiz_code, title, description, quiz_type, time_limit_seconds, pass_score, max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, created_by, version) VALUES 
((SELECT id FROM decks WHERE deck_code='DECK-COLORS'), 'Q-COLORS', 'Bài kiểm tra Màu sắc', 'Kiểm tra trí nhớ về các màu.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-NUMBERS'), 'Q-NUMBERS', 'Bài kiểm tra Số đếm', 'Kiểm tra số đếm cơ bản.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-FAMILY'), 'Q-FAMILY', 'Bài kiểm tra Gia đình', 'Kiểm tra từ vựng gia đình.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-FOOD'), 'Q-FOOD', 'Bài kiểm tra Đồ ăn', 'Kiểm tra từ vựng món ăn.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-WEATHER'), 'Q-WEATHER', 'Bài kiểm tra Thời tiết', 'Kiểm tra từ vựng thời tiết.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-BODY'), 'Q-BODY', 'Bài kiểm tra Cơ thể', 'Kiểm tra từ vựng các bộ phận.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-CLOTHES'), 'Q-CLOTHES', 'Bài kiểm tra Quần áo', 'Kiểm tra từ vựng trang phục.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-TRANS'), 'Q-TRANS', 'Bài kiểm tra Giao thông', 'Kiểm tra từ vựng xe cộ.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-JOBS'), 'Q-JOBS', 'Bài kiểm tra Nghề nghiệp', 'Kiểm tra từ vựng công việc.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0),
((SELECT id FROM decks WHERE deck_code='DECK-HOBBIES'), 'Q-HOBBIES', 'Bài kiểm tra Sở thích', 'Kiểm tra từ vựng sở thích.', 'MULTIPLE_CHOICE', 300, 80.00, 3, TRUE, TRUE, 5, TRUE, @admin_id, 0);
