-- V50: Bổ sung 2 scenario hội thoại AI, mở rộng kho foundation_words lên 1000 từ vựng A1-A2, và seed 3 thành tích VOICE_SESSIONS

-- 1. Bổ sung 2 kịch bản hội thoại AI (đạt đủ 8 scenarios như thiết kế)
INSERT INTO conversation_scenarios (topic_id, title, slug, level_min, level_max, ai_role, user_role, description, system_prompt_template, fallback_lines_json, opening_line, is_active)
VALUES
(
    COALESCE((SELECT id FROM topics WHERE slug = 'travel-logistics' LIMIT 1), (SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Hotel Room Reservation & Inquiries',
    'hotel-reservation-inquiries',
    200, 650,
    'Hotel Receptionist', 'Guest',
    'Đặt phòng khách sạn và hỏi về các tiện ích như ăn sáng, wifi, bể bơi.',
    'You are a polite hotel front desk receptionist. Assist the guest with booking details, room preferences, and hotel amenities. Speak clearly and courteously.',
    '["Welcome to Grand LeLa Hotel! How may I assist you today?", "Would you prefer a room with a city view or a king-size bed?", "Breakfast is served from 6:30 AM to 10:00 AM on the second floor. Let me confirm your reservation."] ',
    'Good afternoon! Welcome to Grand LeLa Hotel. Are you checking in or making a new booking today?',
    true
),
(
    COALESCE((SELECT id FROM topics WHERE slug = 'toeic-vocabulary' LIMIT 1), (SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Negotiating a Business Contract',
    'negotiating-business-contract',
    400, 950,
    'Business Partner', 'Client Representative',
    'Thảo luận các điều khoản hợp đồng thương mại, thời hạn giao hàng và chiết khấu.',
    'You are an experienced international business partner discussing contract terms. Maintain a professional, collaborative yet firm negotiating tone.',
    '["Thank you for meeting today. Let us review the primary clauses in the agreement.", "Could you clarify the proposed delivery timeline for this quarter?", "We could offer a five percent volume discount if the order volume increases."] ',
    'Hello, thank you for taking the time to meet with us. Shall we discuss the delivery terms in Section 3 first?',
    true
)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 2. Mở rộng kho foundation_words lên ~1000 từ vựng từ bộ thẻ A1-A2 (Decks BEGINNER)
INSERT INTO foundation_words (word, lemma, part_of_speech, cefr_level)
SELECT DISTINCT
    LOWER(TRIM(f.front_text)) AS word,
    LOWER(TRIM(f.front_text)) AS lemma,
    COALESCE(f.part_of_speech, 'vocabulary') AS part_of_speech,
    'A2' AS cefr_level
FROM flashcards f
JOIN decks d ON f.deck_id = d.id
WHERE d.difficulty = 'BEGINNER'
  AND CHAR_LENGTH(TRIM(f.front_text)) BETWEEN 2 AND 30
  AND TRIM(f.front_text) NOT REGEXP '[^a-zA-Z -]'
ON DUPLICATE KEY UPDATE lemma = VALUES(lemma);

-- 3. Seed 3 thành tích VOICE_SESSIONS (1 buổi, 3 buổi, 7 buổi)
INSERT INTO achievements (code, title, description, xp_reward, condition_type, condition_value, category, is_active)
VALUES
('VOICE_SESSION_1', 'Giọng Nói Đầu Tiên', 'Hoàn thành 1 phiên hội thoại với AI.', 100, 'VOICE_SESSIONS', 1, 'COMMUNICATION', true),
('VOICE_SESSION_3', 'Người Bạn Trò Chuyện', 'Hoàn thành 3 phiên hội thoại với AI.', 250, 'VOICE_SESSIONS', 3, 'COMMUNICATION', true),
('VOICE_SESSION_7', 'Giao Tiếp Tự Tin', 'Hoàn thành 7 phiên hội thoại với AI.', 600, 'VOICE_SESSIONS', 7, 'COMMUNICATION', true)
ON DUPLICATE KEY UPDATE title = VALUES(title);
