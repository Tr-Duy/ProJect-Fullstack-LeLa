-- V35__seed_placement_tests.sql
-- Thêm 4 bài kiểm tra trình độ đầu vào TOEIC Thích ứng (Adaptive Placement Tests) 30 câu / bài

SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @toeic_exam_id = (SELECT id FROM exam_types WHERE code = 'TOEIC' LIMIT 1);


-- Placement Test: TOEIC Placement Test - Dưới 500 (PLACEMENT-TOEIC-U500)
INSERT INTO quizzes (
    quiz_code, title, description, quiz_type, quiz_category, 
    deck_id, exam_type_id, level_id, time_limit_seconds, pass_score, 
    max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, created_by
) VALUES (
    'PLACEMENT-TOEIC-U500', 'TOEIC Placement Test - Dưới 500', 'Bài kiểm tra xác định trình độ TOEIC đầu vào mức độ Cơ bản (Dưới 500). Gồm 30 câu hỏi đánh giá Ngữ pháp & Từ vựng căn bản.', 
    'MIXED', 'PLACEMENT', 
    NULL, @toeic_exam_id, (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_BASIC' LIMIT 1), 1800, 80.00, 
    1, false, true, 30, true, @admin_id
) ON DUPLICATE KEY UPDATE title = VALUES(title), total_questions = VALUES(total_questions), quiz_category = VALUES(quiz_category), level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_BASIC' LIMIT 1);

SET @quiz_id = (SELECT id FROM quizzes WHERE quiz_code = 'PLACEMENT-TOEIC-U500' LIMIT 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The new employee _____ at the office at 8:00 AM every morning.', 'MULTIPLE_CHOICE', 'Thì hiện tại đơn diễn tả thói quen hàng ngày.', 1, 1, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'arrives', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'arrived', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'arriving', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'arrival', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Mr. John _____ the financial report yesterday afternoon.', 'MULTIPLE_CHOICE', 'Trạng từ ''yesterday afternoon'' dùng thì quá khứ đơn.', 1, 2, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'completed', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'completes', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'completing', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'completion', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'All visitors must _____ their identification badges at the front desk.', 'MULTIPLE_CHOICE', 'Sau động từ khuyết thiếu ''must'' dùng V nguyên mẫu.', 1, 3, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'show', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'showing', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'showed', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'shows', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Ms. Sarah is responsible _____ managing customer inquiries.', 'FILL_BLANK', 'Cụm từ ''be responsible for'' (chịu trách nhiệm).', 1, 4, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'for', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The annual staff meeting will take place _____ Monday morning.', 'FILL_BLANK', 'Giới từ ''on'' đi với ngày trong tuần.', 1, 5, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'on', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Please send the signed contract back to our office as soon as _____.', 'MULTIPLE_CHOICE', 'Cụm từ ''as soon as possible'' (càng sớm càng tốt).', 1, 6, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'possible', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'possibility', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'possibly', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'impossible', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The company decided to hire a new marketing _____.', 'MULTIPLE_CHOICE', 'Cần danh từ chỉ người ''specialist'' (chuyên gia).', 1, 7, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'specialist', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'special', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'specially', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'specialize', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'We need to _____ more office supplies before next week.', 'MULTIPLE_CHOICE', 'Sau ''need to'' là động từ nguyên mẫu ''order''.', 1, 8, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'order', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'ordering', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'ordered', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'orders', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Is the main conference room located on the second floor?', 'TRUE_FALSE', 'Câu hỏi đúng/sai về vị trí phòng họp.', 1, 9, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Employees are required to turn _____ all lights before leaving the building.', 'FILL_BLANK', 'Cụm ''turn off'' (tắt đèn/thiết bị).', 1, 10, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'off', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Mr. David left _____ briefcase in the conference room.', 'MULTIPLE_CHOICE', 'Tính từ sở hữu ''his'' trước danh từ ''briefcase''.', 1, 11, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'his', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'him', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'he', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'himself', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The flight was delayed due to bad weather conditions.', 'TRUE_FALSE', 'Cụm ''due to'' đi với danh từ chỉ lý do.', 1, 12, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'She has been working for this firm _____ three years.', 'FILL_BLANK', 'Dùng ''for'' chỉ khoảng thời gian.', 1, 13, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'for', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The client requested _____ copy of the invoice.', 'MULTIPLE_CHOICE', 'Mạo từ ''a'' đứng trước danh từ bắt đầu bằng phụ âm.', 1, 14, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'a', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'an', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'these', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'those', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Our team successfully completed the project on _____.', 'MULTIPLE_CHOICE', 'Cụm ''on schedule'' (đúng tiến độ).', 1, 15, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'schedule', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'scheduled', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'scheduler', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'scheduling', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Applicants must submit their resumes before the deadline.', 'TRUE_FALSE', 'Thông tin thủ tục nộp hồ sơ xin việc.', 1, 16, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The manager asked us to write a short _____ of the meeting.', 'MULTIPLE_CHOICE', 'Sau tính từ ''short'' cần danh từ ''summary''.', 1, 17, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'summary', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'summarize', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'summarized', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'summarizing', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'They decided to _____ the outdoor event because of heavy rain.', 'MULTIPLE_CHOICE', 'Sau ''decided to'' là V nguyên mẫu ''cancel''.', 1, 18, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'cancel', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'cancellation', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'canceling', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'canceled', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The printer is out _____ paper. Please refill it.', 'FILL_BLANK', 'Cụm ''out of paper'' (hết giấy).', 1, 19, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'of', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'All new products come with a one-year _____.', 'MULTIPLE_CHOICE', 'Cụm danh từ ''one-year warranty'' (bảo hành 1 năm).', 1, 20, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'warranty', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'warrant', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'warranted', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'warranting', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The store offers a 20 percent _____ on all items today.', 'MULTIPLE_CHOICE', 'Danh từ ''discount'' (sự giảm giá).', 1, 21, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'discount', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'discounted', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'discounting', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'discounts', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Please check your email for the flight _____ details.', 'MULTIPLE_CHOICE', 'Danh từ ghép ''flight confirmation''.', 1, 22, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'confirmation', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'confirm', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'confirmed', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'confirming', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The train departs _____ 9:30 AM precisely.', 'FILL_BLANK', 'Giới từ chỉ mốc giờ ''at''.', 1, 23, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'at', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Does the hotel provide free Wi-Fi in all guest rooms?', 'TRUE_FALSE', 'Câu hỏi dịch vụ khách sạn.', 1, 24, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Our supervisor will _____ the new guidelines tomorrow.', 'MULTIPLE_CHOICE', 'Sau ''will'' dùng V nguyên mẫu ''explain''.', 1, 25, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'explain', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'explanation', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'explanatory', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'explaining', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The company''s customer service department is available 24 hours _____ day.', 'FILL_BLANK', 'Cụm từ ''24 hours a day''.', 1, 26, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'a', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'If you have any questions, please contact _____ immediately.', 'MULTIPLE_CHOICE', 'Tân ngữ ''us'' đứng sau động từ ''contact''.', 1, 27, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'us', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'we', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'our', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'ourselves', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The price includes tax and shipping charges.', 'TRUE_FALSE', 'Thông tin giá sản phẩm.', 1, 28, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'She was promoted to senior manager because of her hard _____.', 'MULTIPLE_CHOICE', 'Cụm danh từ ''hard work''.', 1, 29, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'work', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'working', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'worked', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'worker', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'We look forward to _____ from you soon.', 'MULTIPLE_CHOICE', 'Cấu trúc ''look forward to + V-ing''.', 1, 30, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'hearing', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'hear', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'heard', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'hears', false, 4);

-- Placement Test: TOEIC Placement Test - 500 - 650 (PLACEMENT-TOEIC-500-650)
INSERT INTO quizzes (
    quiz_code, title, description, quiz_type, quiz_category, 
    deck_id, exam_type_id, level_id, time_limit_seconds, pass_score, 
    max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, created_by
) VALUES (
    'PLACEMENT-TOEIC-500-650', 'TOEIC Placement Test - 500 - 650', 'Bài kiểm tra xác định trình độ TOEIC đầu vào Trung cấp (500 - 650). Gồm 30 câu hỏi đánh giá cấu trúc câu & Từ vựng thương mại.', 
    'MIXED', 'PLACEMENT', 
    NULL, @toeic_exam_id, (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_INTERMEDIATE' LIMIT 1), 1800, 80.00, 
    1, false, true, 30, true, @admin_id
) ON DUPLICATE KEY UPDATE title = VALUES(title), total_questions = VALUES(total_questions), quiz_category = VALUES(quiz_category), level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_INTERMEDIATE' LIMIT 1);

SET @quiz_id = (SELECT id FROM quizzes WHERE quiz_code = 'PLACEMENT-TOEIC-500-650' LIMIT 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The board of directors unanimously _____ the proposal for expanding into overseas markets.', 'MULTIPLE_CHOICE', 'Động từ quá khứ ''approved'' đứng sau trạng từ.', 1, 1, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'approved', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'approval', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'approvingly', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'approvement', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Although the budget was restricted, the team managed to deliver a _____ high quality product.', 'MULTIPLE_CHOICE', 'Trạng từ ''remarkably'' bổ nghĩa cho cụm tính từ.', 1, 2, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'remarkably', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'remarkable', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'remark', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'remarked', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Had we known about the weather delay earlier, we _____ our travel arrangements.', 'MULTIPLE_CHOICE', 'Đảo ngữ câu điều kiện loại 3.', 1, 3, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'would have adjusted', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'will adjust', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'adjusted', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'adjust', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The contract terms are non-negotiable once both parties have signed the document.', 'TRUE_FALSE', 'Điều khoản hợp đồng không thể thỏa thuận lại.', 1, 4, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Mr. Henderson is in charge _____ overseeing the IT department infrastructure.', 'FILL_BLANK', 'Cụm ''in charge of''.', 1, 5, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'of', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'New safety procedures were _____ last week to prevent workplace accidents.', 'MULTIPLE_CHOICE', 'Thể bị động quá khứ đơn ''were implemented''.', 1, 6, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'implemented', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'implementation', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'implementing', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'implements', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Employees who perform exceptionally well will be eligible _____ a quarterly bonus.', 'FILL_BLANK', 'Cụm tính từ ''eligible for''.', 1, 7, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'for', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The marketing strategy aims to increase brand _____ among young professionals.', 'MULTIPLE_CHOICE', 'Danh từ ghép ''brand awareness''.', 1, 8, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'awareness', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'aware', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'awares', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'awarded', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Due to unforeseen circumstances, the workshop has been postponed until further notice.', 'TRUE_FALSE', 'Cụm ''postponed until further notice''.', 1, 9, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The executive committee is evaluating several innovative solutions to reduce production _____.', 'MULTIPLE_CHOICE', 'Danh từ ''production costs''.', 1, 10, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'costs', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'costly', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'costing', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'costed', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Candidates _____ resumes demonstrate strong leadership skills will be invited for an interview.', 'MULTIPLE_CHOICE', 'Đại từ sở hữu ''whose''.', 1, 11, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'whose', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'who', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'whom', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'which', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The regional sales conference will take place in Chicago, _____ next month.', 'FILL_BLANK', 'Rút gọn mệnh đề quan hệ chủ động.', 1, 12, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'starting', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Despite facing severe supply chain interruptions, the factory met its annual production targets.', 'TRUE_FALSE', 'Giới từ ''Despite'' đi với cụm V-ing.', 1, 13, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Participants must register _____ Friday if they wish to receive the early-bird discount.', 'FILL_BLANK', 'Giới từ ''by'' chỉ hạn chót.', 1, 14, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'by', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The chief executive officer delivered an _____ speech at the annual convention.', 'MULTIPLE_CHOICE', 'Tính từ V-ing ''inspiring''.', 1, 15, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'inspiring', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'inspiration', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'inspire', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'inspiredly', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Please make sure all financial documents are filed in compliance _____ national auditing standards.', 'FILL_BLANK', 'Cụm ''in compliance with''.', 1, 16, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'with', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The research team conducted an _____ investigation into consumer shopping preferences.', 'MULTIPLE_CHOICE', 'Tính từ ''extensive''.', 1, 17, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'extensive', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'extensively', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'extent', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'extend', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Only authorized personnel are permitted to access confidential client files.', 'TRUE_FALSE', 'Cụm ''authorized personnel''.', 1, 18, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The manager suggested _____ the staff training program to include digital tools.', 'MULTIPLE_CHOICE', 'Cấu trúc ''suggest + V-ing''.', 1, 19, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'updating', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'update', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'updated', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'to update', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Neither the department head nor the team members _____ available for comment.', 'MULTIPLE_CHOICE', 'Cấu trúc ''Neither... nor...'' chia theo chủ ngữ gần nhất.', 1, 20, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'were', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'was', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'is', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'are not', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The warranty covers repairs arising from manufacturing defects for a period of two years.', 'TRUE_FALSE', 'Thông tin bảo hành sản phẩm.', 1, 21, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'If the shipment does not arrive within 5 business days, please notify our customer service team _____.', 'MULTIPLE_CHOICE', 'Trạng từ ''immediately''.', 1, 22, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'immediately', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'immediacy', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'immediate', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'immediateness', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Strong communication skills are essential _____ building productive business relationships.', 'FILL_BLANK', 'Tính từ ''essential for''.', 1, 23, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'for', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The merger between the two telecommunications giants will create significant market synergies.', 'TRUE_FALSE', 'Khái niệm sáp nhập doanh nghiệp.', 1, 24, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'All expense claims must be accompanied by original receipts in order to be _____.', 'MULTIPLE_CHOICE', 'Động từ bị động ''be reimbursed''.', 1, 25, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'reimbursed', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'reimbursement', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'reimbursing', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'reimburse', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The auditor pointed out a minor discrepancy _____ the inventory records and physical stock.', 'FILL_BLANK', 'Cụm ''between... and...''.', 1, 26, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'between', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The company''s stock price fluctuated significantly throughout the trading session.', 'TRUE_FALSE', 'Biến động giá cổ phiếu.', 1, 27, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The new software is designed to streamline administrative tasks and improve overall _____.', 'MULTIPLE_CHOICE', 'Danh từ ''productivity''.', 1, 28, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'productivity', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'product', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'productive', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'productively', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'We will issue a full refund in the event _____ the merchandise is damaged upon receipt.', 'FILL_BLANK', 'Cụm liên từ ''in the event that''.', 1, 29, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'that', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Ms. Taylor was chosen to lead the delegation because of her extensive international experience.', 'TRUE_FALSE', 'Lý do lựa chọn nhân sự.', 1, 30, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

-- Placement Test: TOEIC Placement Test - 650 - 800 (PLACEMENT-TOEIC-650-800)
INSERT INTO quizzes (
    quiz_code, title, description, quiz_type, quiz_category, 
    deck_id, exam_type_id, level_id, time_limit_seconds, pass_score, 
    max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, created_by
) VALUES (
    'PLACEMENT-TOEIC-650-800', 'TOEIC Placement Test - 650 - 800', 'Bài kiểm tra xác định trình độ TOEIC đầu vào Khá - Giỏi (650 - 800). Gồm 30 câu hỏi nâng cao đánh giá ngữ pháp phức hợp & đọc hiểu.', 
    'MIXED', 'PLACEMENT', 
    NULL, @toeic_exam_id, (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_ADVANCED' LIMIT 1), 1800, 80.00, 
    1, false, true, 30, true, @admin_id
) ON DUPLICATE KEY UPDATE title = VALUES(title), total_questions = VALUES(total_questions), quiz_category = VALUES(quiz_category), level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_ADVANCED' LIMIT 1);

SET @quiz_id = (SELECT id FROM quizzes WHERE quiz_code = 'PLACEMENT-TOEIC-650-800' LIMIT 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Not until the final audit report was released _____ the full extent of the financial miscalculations.', 'MULTIPLE_CHOICE', 'Đảo ngữ với Not until.', 1, 1, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'did the board realize', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'the board realized', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'realized the board', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'the board did realize', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Had the preliminary negotiations been conducted more transparently, the agreement _____ signed months ago.', 'MULTIPLE_CHOICE', 'Đảo ngữ câu điều kiện loại 3 bị động.', 1, 2, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'would have been', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'will be', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'was', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'would be', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The CEO attributed the firm''s historic quarterly revenue growth _____ aggressive international expansion.', 'FILL_BLANK', 'Cấu trúc ''attribute sth to sth''.', 1, 3, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'to', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Acquiring a controlling stake in the regional distributor is crucial for safeguarding our market share.', 'TRUE_FALSE', 'Chiến lược bảo vệ thị phần.', 1, 4, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The committee reached a consensus only after evaluating all relevant empirical data.', 'TRUE_FALSE', 'Sự đồng thuận dựa trên dữ liệu thực nghiệm.', 1, 5, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, '_____ upon extensive market research, the newly unveiled advertising campaign targets tech-savvy millennials.', 'MULTIPLE_CHOICE', 'Rút gọn mệnh đề tính từ bị động ''Based upon''.', 1, 6, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'Based', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'Basing', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'Base', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'Basement', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The legal department advised against signing the memorandum of understanding without further _____.', 'MULTIPLE_CHOICE', 'Danh từ ''scrutiny'' (xem xét kỹ lưỡng).', 1, 7, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'scrutiny', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'scrutinize', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'scrutinized', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'scrutinizingly', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Under no circumstances should confidential financial credentials be shared with unauthorized personnel.', 'TRUE_FALSE', 'Đảo ngữ ''Under no circumstances''.', 1, 8, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The manufacturer agreed to replace all compromised components free _____ charge.', 'FILL_BLANK', 'Cụm ''free of charge''.', 1, 9, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'of', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Despite stiff competition, the startup successfully secured substantial venture capital funding.', 'TRUE_FALSE', 'Gọi vốn đầu tư mạo hiểm.', 1, 10, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'To cope with escalating operational costs, the management resolved to _____ non-essential expenditures.', 'MULTIPLE_CHOICE', 'Động từ ''curtail'' (cắt giảm).', 1, 11, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'curtail', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'curtailment', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'curtailed', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'curtailing', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Should you require further clarification regarding the revised policies, please do not hesitate to contact us.', 'TRUE_FALSE', 'Đảo ngữ câu điều kiện loại 1 ''Should you require''.', 1, 12, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The company''s quarterly financial disclosures exceeded analysts'' predictions by a wide _____.', 'MULTIPLE_CHOICE', 'Cụm ''by a wide margin''.', 1, 13, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'margin', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'marginal', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'marginally', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'margins', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Mr. Harrison has been tasked _____ coordinating the cross-departmental restructuring initiative.', 'FILL_BLANK', 'Cấu trúc ''be tasked with''.', 1, 14, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'with', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The newly enacted environmental regulations will necessitate significant modifications to existing facilities.', 'TRUE_FALSE', 'Tác động của quy định môi trường.', 1, 15, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The board member expressed strong reservations concerning the proposed merger''s long-term _____.', 'MULTIPLE_CHOICE', 'Danh từ ''viability'' (tính khả thi).', 1, 16, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'viability', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'viable', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'viably', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'viabilities', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Prompt action by the emergency response team prevented the chemical spill from causing irreparable damage.', 'TRUE_FALSE', 'Hành động ứng phó sự cố.', 1, 17, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The contract explicitly stipulates that all proprietary intellectual property remains the sole possession of the client.', 'TRUE_FALSE', 'Quy định bản quyền trí tuệ.', 1, 18, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The consultant recommended that the firm _____ its investment portfolio to mitigate financial volatility.', 'MULTIPLE_CHOICE', 'Thức giả định sau ''recommended that + S + V bare''.', 1, 19, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'diversify', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'diversified', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'diversification', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'diversifying', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The chief financial officer presented a comprehensive forecast of projected cash flows for the upcoming fiscal year.', 'TRUE_FALSE', 'Báo cáo dòng tiền năm tài chính.', 1, 20, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Regrettably, the flight cancellation was rendered unavoidable owing _____ severe meteorological disruptions.', 'FILL_BLANK', 'Cụm ''owing to''.', 1, 21, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'to', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The new incentive program was designed to foster employee retention and boost workplace morale.', 'TRUE_FALSE', 'Chính sách đãi ngộ nhân sự.', 1, 22, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Submitting fraudulent expense claims is considered a grave breach of professional _____.', 'MULTIPLE_CHOICE', 'Danh từ ''professional conduct''.', 1, 23, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'conduct', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'conductor', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'conducting', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'conductive', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The delegates engaged in intense deliberations before reaching a mutually beneficial compromise.', 'TRUE_FALSE', 'Thỏa hiệp hai bên cùng có lợi.', 1, 24, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'So high was the demand for the new smartphone model that retail outlets sold out within hours of launch.', 'TRUE_FALSE', 'Đảo ngữ với So + Adj.', 1, 25, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The architect incorporated sustainable design principles into the blueprint to minimize energy _____.', 'MULTIPLE_CHOICE', 'Cụm ''energy consumption''.', 1, 26, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'consumption', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'consume', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'consumer', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'consumable', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The keynote speaker eloquently addressed the ethical implications of artificial intelligence in corporate governance.', 'TRUE_FALSE', 'Đạo đức AI trong quản trị.', 1, 27, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The human resources director emphasized the importance of maintaining an inclusive work environment.', 'TRUE_FALSE', 'Môi trường làm việc hòa nhập.', 1, 28, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'All claims for travel compensation must be submitted in accordance _____ corporate financial guidelines.', 'FILL_BLANK', 'Cụm ''in accordance with''.', 1, 29, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'with', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Only upon receipt of the written confirmation will the reservation be officially registered in our system.', 'TRUE_FALSE', 'Đảo ngữ với Only upon.', 1, 30, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

-- Placement Test: TOEIC Placement Test - 800+ (PLACEMENT-TOEIC-800-PLUS)
INSERT INTO quizzes (
    quiz_code, title, description, quiz_type, quiz_category, 
    deck_id, exam_type_id, level_id, time_limit_seconds, pass_score, 
    max_attempts, shuffle_questions, shuffle_options, total_questions, is_active, created_by
) VALUES (
    'PLACEMENT-TOEIC-800-PLUS', 'TOEIC Placement Test - 800+', 'Bài kiểm tra xác định trình độ TOEIC đầu vào Xuất sắc (800+). Gồm 30 câu hỏi chuyên sâu đánh giá Ngữ pháp nâng cao, Đảo ngữ & Thuật ngữ Doanh nghiệp.', 
    'MIXED', 'PLACEMENT', 
    NULL, @toeic_exam_id, (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_EXCELLENT' LIMIT 1), 1800, 80.00, 
    1, false, true, 30, true, @admin_id
) ON DUPLICATE KEY UPDATE title = VALUES(title), total_questions = VALUES(total_questions), quiz_category = VALUES(quiz_category), level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_EXCELLENT' LIMIT 1);

SET @quiz_id = (SELECT id FROM quizzes WHERE quiz_code = 'PLACEMENT-TOEIC-800-PLUS' LIMIT 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'In addition to implementing stringent cost-containment measures, the conglomerate decided to divest its non-core assets to augment _____ liquidity.', 'MULTIPLE_CHOICE', 'Tính từ bổ nghĩa cho danh từ ''liquidity''.', 1, 1, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'corporate', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'corporation', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'corporately', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'incorporate', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Scarcely had the press conference concluded _____ stockholders began unloading shares due to pessimistic revenue guidance.', 'MULTIPLE_CHOICE', 'Đấu trúc đảo ngữ ''Scarcely had + S + V3 when...''.', 1, 2, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'when', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'than', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'that', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'where', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The regulatory authority imposed severe punitive fines on the financial institution for systemic non-compliance _____ anti-money laundering statutes.', 'FILL_BLANK', 'Cụm danh từ ''non-compliance with''.', 1, 3, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'with', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Exemplary fiscal management during macro-economic headwinds bolstered the company''s credit rating among global rating agencies.', 'TRUE_FALSE', 'Quản trị tài chính xuất sắc giúp tăng xếp hạng tín nhiệm.', 1, 4, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Not only did the corporate restructuring streamline cross-functional operations, but it also engendered significant cost efficiencies across all subsidiaries.', 'TRUE_FALSE', 'Cấu trúc đảo ngữ ''Not only... but also...''.', 1, 5, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The chief risk officer warned that geopolitical turmoil could exert significant upward pressure _____ commodity prices.', 'FILL_BLANK', 'Cụm ''upward pressure on''.', 1, 6, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'on', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The patent dispute was amicably resolved out of court through binding arbitration presided _____ an independent mediator.', 'FILL_BLANK', 'Cụm động từ bị động ''presided over by''.', 1, 7, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'over by', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'To mitigate foreign currency exposure, the multinational enterprise executed hedging transactions involving derivative contracts.', 'TRUE_FALSE', 'Sử dụng hợp đồng phái sinh để giảm rủi ro tỷ giá.', 1, 8, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The managing director insisted that all operational protocols be meticulously scrutinized prior to commercial deployment.', 'TRUE_FALSE', 'Thức giả định sau ''insisted that + S + V bare''.', 1, 9, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Hardly had the groundbreaking technology been patented _____ competing firms attempted to engineer derivative variants.', 'MULTIPLE_CHOICE', 'Cấu trúc ''Hardly had + S + V3 when...''.', 1, 10, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'when', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'than', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'since', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'until', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The board mandated a comprehensive overhaul of executive compensation structures to align managerial incentives _____ shareholder interests.', 'FILL_BLANK', 'Cụm ''align sth with sth''.', 1, 11, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'with', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Notwithstanding the preliminary market volatility, institutional investors maintained a bullish long-term outlook on renewable energy equities.', 'TRUE_FALSE', 'Giới từ ''Notwithstanding'' (Mặc dù...).', 1, 12, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The firm''s proprietary algorithmic trading platform executed high-frequency orders with unprecedented precision and minimal _____.', 'MULTIPLE_CHOICE', 'Danh từ ''latency'' (độ trễ).', 1, 13, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'latency', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'late', false, 2);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'C', 'lately', false, 3);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'D', 'lateness', false, 4);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The acquisition was contingent _____ securing regulatory clearance from the federal trade commission.', 'FILL_BLANK', 'Cụm tính từ ''contingent upon'' (phụ thuộc vào).', 1, 14, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'upon', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Severe macroeconomic contraction forced several regional lending institutions into involuntary liquidation.', 'TRUE_FALSE', 'Suy thoái kinh tế buộc ngân hàng giải thể.', 1, 15, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Were the joint venture to fail to achieve key performance indicators by Q4, both corporate partners have option rights to terminate the agreement.', 'TRUE_FALSE', 'Đảo ngữ câu điều kiện loại 2 ''Were + S + to V''.', 1, 16, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The Chief Executive Officer demonstrated exceptional acumen in navigating the organization through complex regulatory hurdles.', 'TRUE_FALSE', 'Nhạy bén trong quản trị doanh nghiệp.', 1, 17, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'So formidable were the barriers to entry that aspiring startups found it virtually impossible to capture meaningful market share.', 'TRUE_FALSE', 'Đảo ngữ với ''So + Adj + be + S''.', 1, 18, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The forensic accounting firm unearthed evidence of pervasive financial irregularities during the due diligence process.', 'TRUE_FALSE', 'Kiểm toán điều tra phát hiện sai phạm tài chính.', 1, 19, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The commercial real estate market experienced a pronounced downturn exacerbated _____ rising benchmark interest rates.', 'FILL_BLANK', 'Cụm bị động ''exacerbated by''.', 1, 20, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'by', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'To fortify cybersecurity posture, the enterprise implemented zero-trust architecture across all network endpoints.', 'TRUE_FALSE', 'Triển khai kiến trúc an ninh mạng zero-trust.', 1, 21, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The advisory council recommended that executive bonuses be tied directly to environmental, social, and governance (ESG) metrics.', 'TRUE_FALSE', 'Gắn thưởng quản trị với tiêu chí ESG.', 1, 22, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Little did the board suspect that the competitor''s hostile takeover bid had been quietly engineered over a two-year period.', 'TRUE_FALSE', 'Đảo ngữ với ''Little did + S + V''.', 1, 23, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The CFO emphasized that maintaining adequate solvency margins remains paramount during periods of heightened market turbulence.', 'TRUE_FALSE', 'Duy trì biên khả năng thanh toán.', 1, 24, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The international trade dispute was exacerbated when counter-tariffs were levied _____ agricultural exports.', 'FILL_BLANK', 'Cụm ''levied on''.', 1, 25, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'on', true, 1);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Subsequent empirical evaluation validated the efficacy of the revised promotional campaign in capturing premium market segments.', 'TRUE_FALSE', 'Đánh giá thực nghiệm xác nhận hiệu quả chiến dịch.', 1, 26, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Had the central bank not intervened aggressively, the banking sector would have suffered widespread systemic insolvency.', 'TRUE_FALSE', 'Đảo ngữ điều kiện loại 3.', 1, 27, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The enterprise negotiated an exclusive licensing agreement that granted sole distribution rights throughout the Asia-Pacific region.', 'TRUE_FALSE', 'Thỏa thuận cấp phép độc quyền.', 1, 28, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'The newly appointed managing director pledged to restore stakeholder confidence through complete corporate transparency.', 'TRUE_FALSE', 'Cam kết khôi phục niềm tin cổ đông.', 1, 29, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);

INSERT INTO quiz_questions (quiz_id, question_text, question_type, explanation, points, display_order, is_active, version)
VALUES (@quiz_id, 'Under no circumstances may proprietary algorithmic source code be transmitted outside the corporate firewall.', 'TRUE_FALSE', 'Đảo ngữ ''Under no circumstances''.', 1, 30, true, 0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'A', 'True', true, 1);
INSERT INTO quiz_question_options (question_id, option_key, option_text, is_correct, display_order) VALUES (@q_id, 'B', 'False', false, 2);
