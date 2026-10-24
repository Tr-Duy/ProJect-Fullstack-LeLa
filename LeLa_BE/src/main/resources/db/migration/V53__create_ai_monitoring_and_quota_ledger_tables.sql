-- V53__create_ai_monitoring_and_quota_ledger_tables.sql
-- Module: AI Monitoring, Quota Ledger & AI Tutor Tracking

-- 1. Bảng sổ ghi biến động hạn mức AI (SO_GHI_HAN_MUC / Usage Ledger)
CREATE TABLE IF NOT EXISTS so_ghi_han_muc (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_id BIGINT NULL,
    entry_type VARCHAR(30) NOT NULL, -- 'SESSION', 'ADJUST'
    minutes_used INT NOT NULL,
    usage_date DATE NOT NULL,
    admin_actor_id BIGINT NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_so_ghi_han_muc PRIMARY KEY (id),
    CONSTRAINT fk_sghm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sghm_session FOREIGN KEY (session_id) REFERENCES conversation_sessions (id) ON DELETE SET NULL,
    CONSTRAINT fk_sghm_admin FOREIGN KEY (admin_actor_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_sghm_user_date (user_id, usage_date),
    INDEX idx_sghm_entry_type (entry_type),
    INDEX idx_sghm_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Mở rộng bảng chat_conversations để lưu vết các phiên AI Tutor và Fallback
SET @col_cc_type = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'chat_conversations' 
      AND COLUMN_NAME = 'channel_type'
);
SET @sql_cc_type = IF(@col_cc_type = 0, 
    'ALTER TABLE chat_conversations ADD COLUMN channel_type VARCHAR(30) NOT NULL DEFAULT ''SUPPORT'' AFTER user_id, ADD COLUMN is_fallback_triggered BOOLEAN NOT NULL DEFAULT FALSE AFTER channel_type, ADD COLUMN fallback_reason VARCHAR(255) NULL AFTER is_fallback_triggered, ADD COLUMN error_message TEXT NULL AFTER fallback_reason', 
    'SELECT 1'
);
PREPARE stmt_cc_type FROM @sql_cc_type;
EXECUTE stmt_cc_type;
DEALLOCATE PREPARE stmt_cc_type;

-- 3. Mở rộng bảng chat_messages để lưu vết các tin nhắn Smart Fallback & Token usage
SET @col_cm_fb = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'chat_messages' 
      AND COLUMN_NAME = 'is_fallback'
);
SET @sql_cm_fb = IF(@col_cm_fb = 0, 
    'ALTER TABLE chat_messages ADD COLUMN is_fallback BOOLEAN NOT NULL DEFAULT FALSE AFTER is_read, ADD COLUMN tokens_used INT NOT NULL DEFAULT 0 AFTER is_fallback', 
    'SELECT 1'
);
PREPARE stmt_cm_fb FROM @sql_cm_fb;
EXECUTE stmt_cm_fb;
DEALLOCATE PREPARE stmt_cm_fb;

-- 4. Seed dữ liệu mẫu thực tế cho Phiên thoại AI & Sổ ghi hạn mức (nếu chưa có)
SET @admin_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @u1_id = (SELECT id FROM users WHERE username = 'learner1' LIMIT 1);
SET @u2_id = (SELECT id FROM users WHERE username = 'learner2' LIMIT 1);
SET @sc1_id = (SELECT id FROM conversation_scenarios WHERE slug = 'order-coffee-shop' LIMIT 1);
SET @sc2_id = (SELECT id FROM conversation_scenarios WHERE slug = 'job-interview-intro' LIMIT 1);
SET @sc3_id = (SELECT id FROM conversation_scenarios WHERE slug = 'airport-check-in' LIMIT 1);

-- Seed session mẫu cho learner1 nếu chưa có
INSERT INTO conversation_sessions 
(public_id, user_id, scenario_id, quota_date, level_at_start, duration_seconds, valid_turn_count, overall_score, pronunciation_score, grammar_score, fluency_score, vocabulary_score, user_feedback, system_recommendation, status, started_at, ended_at, finished_at, xp_awarded, ai_tokens_used, created_at, updated_at)
SELECT 
'demo-sess-001', @u1_id, @sc1_id, CURDATE(), 250, 245, 6, 85, 88, 80, 85, 90, 'COMFORTABLE', 'INCREASE', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 180 MINUTE), DATE_SUB(NOW(), INTERVAL 175 MINUTE), DATE_SUB(NOW(), INTERVAL 175 MINUTE), 50, 680, DATE_SUB(NOW(), INTERVAL 180 MINUTE), DATE_SUB(NOW(), INTERVAL 175 MINUTE)
WHERE @u1_id IS NOT NULL AND @sc1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conversation_sessions WHERE public_id = 'demo-sess-001');

SET @sess1_id = (SELECT id FROM conversation_sessions WHERE public_id = 'demo-sess-001' LIMIT 1);

-- Seed turns cho session demo 1
INSERT INTO conversation_turns 
(session_id, turn_number, role, transcript, stt_confidence, is_valid, pronunciation_score, grammar_errors_json, corrected_text, ai_reply, suggestion_text, created_at)
SELECT @sess1_id, 1, 'ASSISTANT', 'Hello! Welcome to LeLa Coffee. What would you like to drink today?', 0.990, true, NULL, NULL, NULL, NULL, 'Gợi ý: I would like a cappuccino, please.', DATE_SUB(NOW(), INTERVAL 180 MINUTE)
WHERE @sess1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conversation_turns WHERE session_id = @sess1_id AND turn_number = 1);

INSERT INTO conversation_turns 
(session_id, turn_number, role, transcript, stt_confidence, is_valid, pronunciation_score, grammar_errors_json, corrected_text, ai_reply, suggestion_text, created_at)
SELECT @sess1_id, 2, 'USER', 'Hi! I want a cup of hot latte and one croissant please.', 0.945, true, 86, '[]', 'Hi! I would like a cup of hot latte and one croissant, please.', 'Sure thing! What size would you like for your latte: small, medium, or large?', NULL, DATE_SUB(NOW(), INTERVAL 178 MINUTE)
WHERE @sess1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conversation_turns WHERE session_id = @sess1_id AND turn_number = 2);

INSERT INTO conversation_turns 
(session_id, turn_number, role, transcript, stt_confidence, is_valid, pronunciation_score, grammar_errors_json, corrected_text, ai_reply, suggestion_text, created_at)
SELECT @sess1_id, 3, 'ASSISTANT', 'Sure thing! What size would you like for your latte: small, medium, or large?', 0.990, true, NULL, NULL, NULL, NULL, 'Gợi ý: Medium size is good for me.', DATE_SUB(NOW(), INTERVAL 177 MINUTE)
WHERE @sess1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conversation_turns WHERE session_id = @sess1_id AND turn_number = 3);

INSERT INTO conversation_turns 
(session_id, turn_number, role, transcript, stt_confidence, is_valid, pronunciation_score, grammar_errors_json, corrected_text, ai_reply, suggestion_text, created_at)
SELECT @sess1_id, 4, 'USER', 'I taking medium size and how much it cost?', 0.880, true, 80, '[{"error": "I taking", "correction": "I will take", "explanation": "Thiếu trợ động từ will hoặc to be cho thì tiếp diễn"}, {"error": "how much it cost", "correction": "how much does it cost", "explanation": "Câu hỏi thì hiện tại đơn cần mượn trợ động từ does"}]', 'I will take a medium size. How much does it cost?', 'A medium latte is $4.50 and the croissant is $3.00, making it $7.50 in total. Will that be cash or card?', NULL, DATE_SUB(NOW(), INTERVAL 176 MINUTE)
WHERE @sess1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conversation_turns WHERE session_id = @sess1_id AND turn_number = 4);

-- Seed session 2 (Job Interview)
INSERT INTO conversation_sessions 
(public_id, user_id, scenario_id, quota_date, level_at_start, duration_seconds, valid_turn_count, overall_score, pronunciation_score, grammar_score, fluency_score, vocabulary_score, user_feedback, system_recommendation, status, started_at, ended_at, finished_at, xp_awarded, ai_tokens_used, created_at, updated_at)
SELECT 
'demo-sess-002', @u2_id, @sc2_id, CURDATE(), 350, 420, 8, 72, 75, 68, 70, 78, 'HARD', 'KEEP', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 1440 MINUTE), DATE_SUB(NOW(), INTERVAL 1433 MINUTE), DATE_SUB(NOW(), INTERVAL 1433 MINUTE), 50, 1120, DATE_SUB(NOW(), INTERVAL 1440 MINUTE), DATE_SUB(NOW(), INTERVAL 1433 MINUTE)
WHERE @u2_id IS NOT NULL AND @sc2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conversation_sessions WHERE public_id = 'demo-sess-002');

-- Seed session 3 (Abandoned / System error)
INSERT INTO conversation_sessions 
(public_id, user_id, scenario_id, quota_date, level_at_start, duration_seconds, valid_turn_count, overall_score, pronunciation_score, grammar_score, fluency_score, vocabulary_score, user_feedback, system_recommendation, status, started_at, ended_at, finished_at, xp_awarded, ai_tokens_used, created_at, updated_at)
SELECT 
'demo-sess-003', @u1_id, @sc3_id, CURDATE(), 250, 45, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ABANDONED', DATE_SUB(NOW(), INTERVAL 300 MINUTE), DATE_SUB(NOW(), INTERVAL 299 MINUTE), NULL, 0, 150, DATE_SUB(NOW(), INTERVAL 300 MINUTE), DATE_SUB(NOW(), INTERVAL 299 MINUTE)
WHERE @u1_id IS NOT NULL AND @sc3_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM conversation_sessions WHERE public_id = 'demo-sess-003');

-- Seed bút toán sổ ghi hạn mức (so_ghi_han_muc)
INSERT INTO so_ghi_han_muc (user_id, session_id, entry_type, minutes_used, usage_date, admin_actor_id, reason, created_at)
SELECT @u1_id, @sess1_id, 'SESSION', 4, CURDATE(), NULL, 'Hội thoại AI Voice: Order at a Coffee Shop', DATE_SUB(NOW(), INTERVAL 175 MINUTE)
WHERE @u1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM so_ghi_han_muc WHERE session_id = @sess1_id AND entry_type = 'SESSION');

INSERT INTO so_ghi_han_muc (user_id, session_id, entry_type, minutes_used, usage_date, admin_actor_id, reason, created_at)
SELECT @u2_id, (SELECT id FROM conversation_sessions WHERE public_id = 'demo-sess-002' LIMIT 1), 'SESSION', 7, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, 'Hội thoại AI Voice: Job Interview - Introduction', DATE_SUB(NOW(), INTERVAL 1433 MINUTE)
WHERE @u2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM so_ghi_han_muc WHERE user_id = @u2_id AND entry_type = 'SESSION');

-- Seed một bút toán điều chỉnh thủ công (ADJUST) do Admin thực hiện
INSERT INTO so_ghi_han_muc (user_id, session_id, entry_type, minutes_used, usage_date, admin_actor_id, reason, created_at)
SELECT @u1_id, NULL, 'ADJUST', 15, CURDATE(), @admin_id, 'Cộng thêm 15 phút đền bù sự cố gián đoạn âm thanh ngày 24/10', DATE_SUB(NOW(), INTERVAL 60 MINUTE)
WHERE @u1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM so_ghi_han_muc WHERE user_id = @u1_id AND entry_type = 'ADJUST');

-- 5. Seed các phiên hội thoại AI Tutor (channel_type = 'AI_TUTOR') và Fallback Logs
-- Phiên 1: Bình thường (Gemini API thành công)
INSERT INTO chat_conversations (user_id, channel_type, is_fallback_triggered, fallback_reason, status, created_at, updated_at)
SELECT @u1_id, 'AI_TUTOR', false, NULL, 'CLOSED', DATE_SUB(NOW(), INTERVAL 360 MINUTE), DATE_SUB(NOW(), INTERVAL 350 MINUTE)
WHERE @u1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM chat_conversations WHERE user_id = @u1_id AND channel_type = 'AI_TUTOR' AND is_fallback_triggered = false);

SET @tutor_conv1 = (SELECT id FROM chat_conversations WHERE user_id = @u1_id AND channel_type = 'AI_TUTOR' AND is_fallback_triggered = false ORDER BY id DESC LIMIT 1);

INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, is_read, is_fallback, tokens_used, created_at)
SELECT @tutor_conv1, 'LEARNER', @u1_id, 'Phân biệt giúp mình thì Present Perfect và Past Simple trong trường hợp nói về trải nghiệm?', true, false, 25, DATE_SUB(NOW(), INTERVAL 360 MINUTE)
WHERE @tutor_conv1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM chat_messages WHERE conversation_id = @tutor_conv1);

INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, is_read, is_fallback, tokens_used, created_at)
SELECT @tutor_conv1, 'ADMIN', NULL, 'Chào bạn! Điểm mấu chốt để phân biệt: \n1. **Present Perfect (Hiện tại hoàn thành)**: Dùng khi nói về trải nghiệm cho tới thời điểm hiện tại và KHÔNG nêu rõ thời gian cụ thể (Ví dụ: "I have visited Da Nang twice").\n2. **Past Simple (Quá khứ đơn)**: Dùng khi trải nghiệm đó xảy ra tại một thời điểm xác định cụ thể trong quá khứ (Ví dụ: "I visited Da Nang last summer").\nBạn có muốn thực hành làm 1 ví dụ không?', true, false, 280, DATE_SUB(NOW(), INTERVAL 359 MINUTE)
WHERE @tutor_conv1 IS NOT NULL AND (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = @tutor_conv1) = 1;

-- Phiên 2: Đã kích hoạt Smart Data-Driven Fallback khi Gemini API bị 429 Quota Exceeded
INSERT INTO chat_conversations (user_id, channel_type, is_fallback_triggered, fallback_reason, error_message, status, created_at, updated_at)
SELECT @u1_id, 'AI_TUTOR', true, 'Gemini API 429 Quota Limit Exceeded - Switched to Smart Data-Driven Fallback', 'HTTP 429 Too Many Requests: Resource has been exhausted (e.g. check quota).', 'CLOSED', DATE_SUB(NOW(), INTERVAL 120 MINUTE), DATE_SUB(NOW(), INTERVAL 115 MINUTE)
WHERE @u1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM chat_conversations WHERE user_id = @u1_id AND is_fallback_triggered = true);

SET @tutor_conv2 = (SELECT id FROM chat_conversations WHERE user_id = @u1_id AND is_fallback_triggered = true ORDER BY id DESC LIMIT 1);

INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, is_read, is_fallback, tokens_used, created_at)
SELECT @tutor_conv2, 'LEARNER', @u1_id, 'Hôm nay tôi đã học được bao nhiêu thẻ từ vựng và kiếm được bao nhiêu XP rồi?', true, false, 18, DATE_SUB(NOW(), INTERVAL 120 MINUTE)
WHERE @tutor_conv2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM chat_messages WHERE conversation_id = @tutor_conv2);

INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, is_read, is_fallback, tokens_used, created_at)
SELECT @tutor_conv2, 'ADMIN', NULL, 'Hôm nay bạn đã tích lũy được **50 XP** trên LeLa! Bạn cũng đã học được **12 thẻ** từ vựng trong ngày. Hãy tiếp tục duy trì streak nhé!', true, true, 0, DATE_SUB(NOW(), INTERVAL 119 MINUTE)
WHERE @tutor_conv2 IS NOT NULL AND (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = @tutor_conv2) = 1;

-- Phiên 3: Smart Fallback do Network Timeout (504 Gateway Timeout)
INSERT INTO chat_conversations (user_id, channel_type, is_fallback_triggered, fallback_reason, error_message, status, created_at, updated_at)
SELECT @u2_id, 'AI_TUTOR', true, 'Gemini API Timeout (504) - Smart Context Fallback Applied', 'java.util.concurrent.TimeoutException: Gemini stream response timed out after 15000ms', 'CLOSED', DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 40 MINUTE)
WHERE @u2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM chat_conversations WHERE user_id = @u2_id AND is_fallback_triggered = true);

SET @tutor_conv3 = (SELECT id FROM chat_conversations WHERE user_id = @u2_id AND is_fallback_triggered = true ORDER BY id DESC LIMIT 1);

INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, is_read, is_fallback, tokens_used, created_at)
SELECT @tutor_conv3, 'LEARNER', @u2_id, 'Tôi đã đủ điều kiện làm bài thi kết thúc level chưa?', true, false, 15, DATE_SUB(NOW(), INTERVAL 45 MINUTE)
WHERE @tutor_conv3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM chat_messages WHERE conversation_id = @tutor_conv3);

INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, is_read, is_fallback, tokens_used, created_at)
SELECT @tutor_conv3, 'ADMIN', NULL, 'Chúc mừng! Bạn **ĐÃ ĐỦ ĐIỀU KIỆN** làm bài Thi Kết Thúc Level! (Đã học 15/15 bộ thẻ). Hãy sẵn sàng bài thi đánh giá 40 câu hỏi trắc nghiệm nhé!', true, true, 0, DATE_SUB(NOW(), INTERVAL 44 MINUTE)
WHERE @tutor_conv3 IS NOT NULL AND (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = @tutor_conv3) = 1;
