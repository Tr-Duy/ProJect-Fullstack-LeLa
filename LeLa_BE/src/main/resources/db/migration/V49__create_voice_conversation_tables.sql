-- V49__create_voice_conversation_tables.sql
-- Module: Voice Conversation with AI (LeLa Project)

-- 1. Bảng lưu trữ cấp độ hội thoại của người dùng
CREATE TABLE IF NOT EXISTS user_conversation_levels (
    user_id BIGINT NOT NULL,
    current_level INT NOT NULL DEFAULT 200,
    initial_band_min INT NOT NULL DEFAULT 100,
    highest_level INT NOT NULL DEFAULT 200,
    total_sessions INT NOT NULL DEFAULT 0,
    consecutive_hard_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_user_conversation_levels PRIMARY KEY (user_id),
    CONSTRAINT fk_ucl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_ucl_level CHECK (current_level >= 100 AND current_level <= 1000 AND (current_level % 50 = 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng lịch sử thay đổi level
CREATE TABLE IF NOT EXISTS conversation_level_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_id BIGINT NULL,
    old_level INT NOT NULL,
    new_level INT NOT NULL,
    delta INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_conversation_level_history PRIMARY KEY (id),
    CONSTRAINT fk_clh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_clh_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng kịch bản hội thoại (Scenarios)
CREATE TABLE IF NOT EXISTS conversation_scenarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    topic_id BIGINT NULL,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    level_min INT NOT NULL DEFAULT 100,
    level_max INT NOT NULL DEFAULT 1000,
    ai_role VARCHAR(100) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    system_prompt_template TEXT NOT NULL,
    fallback_lines_json TEXT NOT NULL,
    opening_line VARCHAR(300) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_conversation_scenarios PRIMARY KEY (id),
    CONSTRAINT uk_conversation_scenarios_slug UNIQUE (slug),
    CONSTRAINT fk_cs_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng phiên hội thoại (Sessions)
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    scenario_id BIGINT NOT NULL,
    quota_date DATE NOT NULL,
    level_at_start INT NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    valid_turn_count INT NOT NULL DEFAULT 0,
    overall_score INT NULL,
    pronunciation_score INT NULL,
    grammar_score INT NULL,
    fluency_score INT NULL,
    vocabulary_score INT NULL,
    user_feedback VARCHAR(30) NULL, -- 'HARD', 'COMFORTABLE', 'EASY', 'SKIPPED'
    system_recommendation VARCHAR(30) NULL, -- 'INCREASE', 'KEEP', 'DECREASE'
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'
    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ended_at DATETIME(6) NULL,
    last_activity_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    finished_at DATETIME(6) NULL,
    xp_awarded INT NOT NULL DEFAULT 0,
    ai_tokens_used INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_conversation_sessions PRIMARY KEY (id),
    CONSTRAINT uk_conversation_sessions_public_id UNIQUE (public_id),
    CONSTRAINT fk_csess_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_csess_scenario FOREIGN KEY (scenario_id) REFERENCES conversation_scenarios (id) ON DELETE RESTRICT,
    INDEX idx_csess_user_date (user_id, quota_date),
    INDEX idx_csess_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng chi tiết từng lượt nói (Turns)
CREATE TABLE IF NOT EXISTS conversation_turns (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    turn_number INT NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'USER', 'ASSISTANT'
    transcript TEXT NOT NULL,
    stt_confidence DECIMAL(4,3) NULL,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    pronunciation_score INT NULL,
    grammar_errors_json TEXT NULL,
    corrected_text TEXT NULL,
    ai_reply TEXT NULL,
    suggestion_text VARCHAR(300) NULL,
    audio_url VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_conversation_turns PRIMARY KEY (id),
    CONSTRAINT uk_ct_session_turn UNIQUE (session_id, turn_number),
    CONSTRAINT fk_ct_session FOREIGN KEY (session_id) REFERENCES conversation_sessions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng theo dõi từ mục tiêu trong phiên (Target Words)
CREATE TABLE IF NOT EXISTS conversation_target_words (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    flashcard_id BIGINT NOT NULL,
    word_text VARCHAR(100) NOT NULL,
    used_count INT NOT NULL DEFAULT 0,
    used_correctly BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'UNUSED', -- 'USED_CORRECT', 'USED_WRONG', 'UNUSED'
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_conversation_target_words PRIMARY KEY (id),
    CONSTRAINT uk_ctw_session_card UNIQUE (session_id, flashcard_id),
    CONSTRAINT fk_ctw_session FOREIGN KEY (session_id) REFERENCES conversation_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_ctw_card FOREIGN KEY (flashcard_id) REFERENCES flashcards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng từ vựng nền tảng (Foundation Words)
CREATE TABLE IF NOT EXISTS foundation_words (
    id BIGINT NOT NULL AUTO_INCREMENT,
    word VARCHAR(100) NOT NULL,
    lemma VARCHAR(100) NOT NULL,
    part_of_speech VARCHAR(50) NULL,
    cefr_level VARCHAR(10) NOT NULL DEFAULT 'A1',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_foundation_words PRIMARY KEY (id),
    CONSTRAINT uk_foundation_words_word UNIQUE (word),
    INDEX idx_fw_lemma (lemma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bổ sung cột voice_session_count vào daily_learning_activities nếu chưa có
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'daily_learning_activities' 
      AND COLUMN_NAME = 'voice_session_count'
);
SET @sql_add_col = IF(@col_exists = 0, 
    'ALTER TABLE daily_learning_activities ADD COLUMN voice_session_count INT NOT NULL DEFAULT 0 AFTER minutes_spent', 
    'SELECT 1'
);
PREPARE stmt_add_col FROM @sql_add_col;
EXECUTE stmt_add_col;
DEALLOCATE PREPARE stmt_add_col;

-- Seed dữ liệu mẫu cho conversation_scenarios (Tra cứu topic động qua slug, dự phòng id đầu tiên để không bao giờ NULL)
INSERT INTO conversation_scenarios (topic_id, title, slug, level_min, level_max, ai_role, user_role, description, system_prompt_template, fallback_lines_json, opening_line, is_active)
VALUES
(
    COALESCE((SELECT id FROM topics WHERE slug = 'toeic-vocabulary' LIMIT 1), (SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Order at a Coffee Shop',
    'order-coffee-shop',
    100, 400,
    'Barista', 'Customer',
    'Gọi đồ uống và bánh ngọt tại quán cà phê.',
    'You are a friendly barista at a local coffee shop. Greet the customer and take their drink order. Speak in clear, natural English appropriate for beginner learners.',
    '["Welcome to our coffee shop! What can I get started for you today?", "Would you like that hot or iced?", "Sure thing! That will be ready in just a couple of minutes. Anything else?"]',
    'Hello! Welcome to LeLa Coffee. What would you like to drink today?',
    true
),
(
    COALESCE((SELECT id FROM topics WHERE slug = 'toeic-vocabulary' LIMIT 1), (SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Job Interview - Introduction',
    'job-interview-intro',
    300, 800,
    'HR Interviewer', 'Job Applicant',
    'Phỏng vấn xin việc: giới thiệu bản thân và kinh nghiệm.',
    'You are an HR manager conducting a job interview. Ask the candidate about their background, skills, and why they want to join the company.',
    '["Thank you for coming in today. Could you tell me a little bit about yourself?", "What would you say is your greatest professional strength?", "That sounds impressive. How do you handle working under tight deadlines?"]',
    'Good morning! Thanks for joining us today. To start off, could you briefly introduce yourself?',
    true
),
(
    COALESCE((SELECT id FROM topics WHERE slug = 'travel-logistics' LIMIT 1), (SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Airport Check-in',
    'airport-check-in',
    200, 600,
    'Airline Counter Agent', 'Passenger',
    'Làm thủ tục chuyến bay tại quầy check-in sân bay.',
    'You are an airline customer service agent at the check-in desk. Ask for the passenger passport, check luggage, and issue the boarding pass.',
    '["Good day! May I see your passport and booking reference, please?", "Are you checking any bags today or just carry-on luggage?", "Here is your boarding pass. Gate 12, boarding starts at 3:30 PM. Have a safe flight!"]',
    'Hello! Welcome to SkyWings. Where are you flying to today?',
    true
),
(
    COALESCE((SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Daily Routine & Weekend Plans',
    'daily-routine-plans',
    100, 500,
    'Close Friend', 'Friend',
    'Trò chuyện về công việc hàng ngày và kế hoạch cuối tuần.',
    'You are a warm friend catching up after a busy week. Ask what they have been doing recently and discuss weekend fun plans.',
    '["Hey there! How has your week been going so far?", "I am thinking of going cycling this Saturday. Do you have any plans?", "Sounds like a relaxing plan! Let me know if you want to hang out together."] ',
    'Hey! It is so good to see you again. How has your day been going?',
    true
),
(
    COALESCE((SELECT id FROM topics WHERE slug = 'technology-computing' LIMIT 1), (SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Tech Support & Troubleshoot',
    'tech-support-troubleshoot',
    400, 900,
    'IT Support Specialist', 'User needing help',
    'Mô tả lỗi máy tính và nhận hướng dẫn xử lý từ bộ phận IT.',
    'You are an IT help desk agent troubleshooting a technical issue with software or network. Keep advice systematic and clear.',
    '["Hello, IT Helpdesk here. What seems to be the issue with your device?", "Have you tried restarting the application or clearing the cache?", "I understand. Let me check the server logs on my end to see what is causing this."] ',
    'Hi, IT Support here. What technical issue can I help you resolve today?',
    true
),
(
    COALESCE((SELECT id FROM topics WHERE slug = 'general' LIMIT 1), (SELECT id FROM topics ORDER BY id ASC LIMIT 1)),
    'Doctor Consultation',
    'doctor-consultation',
    200, 700,
    'Doctor', 'Patient',
    'Khám bệnh và mô tả các triệu chứng sức khỏe thường gặp.',
    'You are an empathetic physician speaking to a patient who feels unwell. Ask about symptoms, duration, and give general advice.',
    '["Good afternoon. What symptoms are you experiencing today?", "How long have you had this fever and sore throat?", "Make sure to get plenty of rest and drink lots of fluids. Let me prescribe some medication."] ',
    'Hello! Please take a seat. How are you feeling today, and what brings you in?',
    true
)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Seed danh sách ~300 từ chức năng và từ vựng A1-A2 thiết yếu vào foundation_words
INSERT INTO foundation_words (word, lemma, part_of_speech, cefr_level) VALUES
-- Đại từ & Mạo từ & Chỉ định
('the', 'the', 'article', 'A1'),
('a', 'a', 'article', 'A1'),
('an', 'an', 'article', 'A1'),
('this', 'this', 'determiner', 'A1'),
('that', 'that', 'determiner', 'A1'),
('these', 'these', 'determiner', 'A1'),
('those', 'those', 'determiner', 'A1'),
('i', 'i', 'pronoun', 'A1'),
('you', 'you', 'pronoun', 'A1'),
('he', 'he', 'pronoun', 'A1'),
('she', 'she', 'pronoun', 'A1'),
('it', 'it', 'pronoun', 'A1'),
('we', 'we', 'pronoun', 'A1'),
('they', 'they', 'pronoun', 'A1'),
('me', 'i', 'pronoun', 'A1'),
('him', 'he', 'pronoun', 'A1'),
('her', 'she', 'pronoun', 'A1'),
('us', 'we', 'pronoun', 'A1'),
('them', 'they', 'pronoun', 'A1'),
('my', 'my', 'determiner', 'A1'),
('your', 'your', 'determiner', 'A1'),
('his', 'his', 'determiner', 'A1'),
('our', 'our', 'determiner', 'A1'),
('their', 'their', 'determiner', 'A1'),
('who', 'who', 'pronoun', 'A1'),
('what', 'what', 'pronoun', 'A1'),
('where', 'where', 'adverb', 'A1'),
('when', 'when', 'adverb', 'A1'),
('why', 'why', 'adverb', 'A1'),
('how', 'how', 'adverb', 'A1'),
-- Trợ động từ & Động từ cơ bản
('be', 'be', 'verb', 'A1'),
('is', 'be', 'verb', 'A1'),
('am', 'be', 'verb', 'A1'),
('are', 'be', 'verb', 'A1'),
('was', 'be', 'verb', 'A1'),
('were', 'be', 'verb', 'A1'),
('been', 'be', 'verb', 'A1'),
('being', 'be', 'verb', 'A1'),
('have', 'have', 'verb', 'A1'),
('has', 'have', 'verb', 'A1'),
('had', 'have', 'verb', 'A1'),
('do', 'do', 'verb', 'A1'),
('does', 'do', 'verb', 'A1'),
('did', 'do', 'verb', 'A1'),
('will', 'will', 'modal', 'A1'),
('would', 'would', 'modal', 'A1'),
('can', 'can', 'modal', 'A1'),
('could', 'could', 'modal', 'A1'),
('should', 'should', 'modal', 'A1'),
('may', 'may', 'modal', 'A1'),
('might', 'might', 'modal', 'A1'),
('must', 'must', 'modal', 'A1'),
('go', 'go', 'verb', 'A1'),
('goes', 'go', 'verb', 'A1'),
('went', 'go', 'verb', 'A1'),
('gone', 'go', 'verb', 'A1'),
('going', 'go', 'verb', 'A1'),
('come', 'come', 'verb', 'A1'),
('came', 'come', 'verb', 'A1'),
('see', 'see', 'verb', 'A1'),
('saw', 'see', 'verb', 'A1'),
('seen', 'see', 'verb', 'A1'),
('get', 'get', 'verb', 'A1'),
('got', 'get', 'verb', 'A1'),
('make', 'make', 'verb', 'A1'),
('made', 'make', 'verb', 'A1'),
('know', 'know', 'verb', 'A1'),
('knew', 'know', 'verb', 'A1'),
('think', 'think', 'verb', 'A1'),
('thought', 'think', 'verb', 'A1'),
('take', 'take', 'verb', 'A1'),
('took', 'take', 'verb', 'A1'),
('want', 'want', 'verb', 'A1'),
('wanted', 'want', 'verb', 'A1'),
('like', 'like', 'verb', 'A1'),
('liked', 'like', 'verb', 'A1'),
('need', 'need', 'verb', 'A1'),
('needed', 'need', 'verb', 'A1'),
('use', 'use', 'verb', 'A1'),
('used', 'use', 'verb', 'A1'),
('find', 'find', 'verb', 'A1'),
('found', 'find', 'verb', 'A1'),
('give', 'give', 'verb', 'A1'),
('gave', 'give', 'verb', 'A1'),
('tell', 'tell', 'verb', 'A1'),
('told', 'tell', 'verb', 'A1'),
('ask', 'ask', 'verb', 'A1'),
('work', 'work', 'verb', 'A1'),
('worked', 'work', 'verb', 'A1'),
('feel', 'feel', 'verb', 'A1'),
('felt', 'feel', 'verb', 'A1'),
('try', 'try', 'verb', 'A1'),
('leave', 'leave', 'verb', 'A1'),
('call', 'call', 'verb', 'A1'),
-- Giới từ & Liên từ
('in', 'in', 'preposition', 'A1'),
('on', 'on', 'preposition', 'A1'),
('at', 'at', 'preposition', 'A1'),
('to', 'to', 'preposition', 'A1'),
('for', 'for', 'preposition', 'A1'),
('with', 'with', 'preposition', 'A1'),
('by', 'by', 'preposition', 'A1'),
('about', 'about', 'preposition', 'A1'),
('from', 'from', 'preposition', 'A1'),
('into', 'into', 'preposition', 'A1'),
('over', 'over', 'preposition', 'A1'),
('after', 'after', 'preposition', 'A1'),
('before', 'before', 'preposition', 'A1'),
('between', 'between', 'preposition', 'A1'),
('under', 'under', 'preposition', 'A1'),
('and', 'and', 'conjunction', 'A1'),
('but', 'but', 'conjunction', 'A1'),
('or', 'or', 'conjunction', 'A1'),
('so', 'so', 'conjunction', 'A1'),
('because', 'because', 'conjunction', 'A1'),
('if', 'if', 'conjunction', 'A1'),
('while', 'while', 'conjunction', 'A1'),
('as', 'as', 'conjunction', 'A1'),
-- Tính từ & Trạng từ căn bản
('good', 'good', 'adjective', 'A1'),
('better', 'good', 'adjective', 'A1'),
('best', 'good', 'adjective', 'A1'),
('bad', 'bad', 'adjective', 'A1'),
('worse', 'bad', 'adjective', 'A1'),
('worst', 'bad', 'adjective', 'A1'),
('big', 'big', 'adjective', 'A1'),
('small', 'small', 'adjective', 'A1'),
('great', 'great', 'adjective', 'A1'),
('new', 'new', 'adjective', 'A1'),
('old', 'old', 'adjective', 'A1'),
('right', 'right', 'adjective', 'A1'),
('nice', 'nice', 'adjective', 'A1'),
('fine', 'fine', 'adjective', 'A1'),
('sure', 'sure', 'adjective', 'A1'),
('happy', 'happy', 'adjective', 'A1'),
('ready', 'ready', 'adjective', 'A1'),
('not', 'not', 'adverb', 'A1'),
('very', 'very', 'adverb', 'A1'),
('also', 'also', 'adverb', 'A1'),
('too', 'too', 'adverb', 'A1'),
('now', 'now', 'adverb', 'A1'),
('here', 'here', 'adverb', 'A1'),
('there', 'there', 'adverb', 'A1'),
('yes', 'yes', 'adverb', 'A1'),
('no', 'no', 'adverb', 'A1'),
('please', 'please', 'adverb', 'A1'),
('thanks', 'thank', 'noun', 'A1'),
('thank', 'thank', 'verb', 'A1'),
('welcome', 'welcome', 'verb', 'A1'),
('hello', 'hello', 'interjection', 'A1'),
('hi', 'hi', 'interjection', 'A1'),
('bye', 'bye', 'interjection', 'A1'),
('okay', 'okay', 'adjective', 'A1')
ON DUPLICATE KEY UPDATE lemma=VALUES(lemma);
