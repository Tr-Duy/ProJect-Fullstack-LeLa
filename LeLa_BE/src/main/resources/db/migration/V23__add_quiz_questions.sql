-- V23__add_quiz_questions.sql

-- Lấy ID của các bài kiểm tra
SET @quiz_animals = (SELECT id FROM quizzes WHERE quiz_code = 'Q-EN-ANIMALS-01' LIMIT 1);
SET @quiz_colors = (SELECT id FROM quizzes WHERE quiz_code = 'Q-COLORS' LIMIT 1);

-- ==========================================
-- BÀI KIỂM TRA ĐỘNG VẬT (@quiz_animals)
-- Cập nhật loại bài kiểm tra thành MIXED (Hỗn hợp)
UPDATE quizzes SET quiz_type = 'MIXED' WHERE id = @quiz_animals;

-- Câu 1: Trắc nghiệm (MULTIPLE_CHOICE)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, display_order, is_active) 
VALUES (@quiz_animals, 'Con chó tiếng Anh là gì?', 'MULTIPLE_CHOICE', 10, 1, true);
SET @q1_animals = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_text, is_correct, display_order) VALUES 
(@q1_animals, 'Dog', true, 1),
(@q1_animals, 'Cat', false, 2),
(@q1_animals, 'Bird', false, 3),
(@q1_animals, 'Elephant', false, 4);

-- Câu 2: Đúng/Sai (TRUE_FALSE)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, display_order, is_active) 
VALUES (@quiz_animals, 'Từ "Lion" trong tiếng Anh có nghĩa là "Con hổ", đúng hay sai?', 'TRUE_FALSE', 10, 2, true);
SET @q2_animals = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_text, is_correct, display_order) VALUES 
(@q2_animals, 'Đúng (True)', false, 1),
(@q2_animals, 'Sai (False)', true, 2);

-- Câu 3: Điền từ (FILL_BLANK)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, display_order, is_active) 
VALUES (@quiz_animals, 'Con chim bay trên trời tiếng Anh là gì? (Viết hoa chữ cái đầu)', 'FILL_BLANK', 15, 3, true);
SET @q3_animals = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_text, normalized_text, is_correct, display_order) VALUES 
(@q3_animals, 'Bird', 'bird', true, 1);

-- ==========================================
-- BÀI KIỂM TRA MÀU SẮC (@quiz_colors)
-- Cập nhật loại bài kiểm tra thành MIXED
UPDATE quizzes SET quiz_type = 'MIXED' WHERE id = @quiz_colors;

-- Câu 1: Trắc nghiệm (MULTIPLE_CHOICE)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, display_order, is_active) 
VALUES (@quiz_colors, 'Bầu trời thường có màu gì?', 'MULTIPLE_CHOICE', 10, 1, true);
SET @q1_colors = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_text, is_correct, display_order) VALUES 
(@q1_colors, 'Blue', true, 1),
(@q1_colors, 'Red', false, 2),
(@q1_colors, 'Green', false, 3),
(@q1_colors, 'Black', false, 4);

-- Câu 2: Đúng/Sai (TRUE_FALSE)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, display_order, is_active) 
VALUES (@quiz_colors, 'Màu xanh lá cây trong tiếng Anh là "Green", đúng hay sai?', 'TRUE_FALSE', 10, 2, true);
SET @q2_colors = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_text, is_correct, display_order) VALUES 
(@q2_colors, 'Đúng (True)', true, 1),
(@q2_colors, 'Sai (False)', false, 2);

-- Câu 3: Điền từ (FILL_BLANK)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, display_order, is_active) 
VALUES (@quiz_colors, 'Mặt trời có màu vàng. Màu vàng trong tiếng Anh là gì?', 'FILL_BLANK', 15, 3, true);
SET @q3_colors = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_text, normalized_text, is_correct, display_order) VALUES 
(@q3_colors, 'Yellow', 'yellow', true, 1);
