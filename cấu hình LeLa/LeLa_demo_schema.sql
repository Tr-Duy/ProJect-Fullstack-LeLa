-- ============================================================
-- FLASHCARD LANGUAGE LEARNING PLATFORM - Full Schema
-- Inspired by YOEDU structure + Duolingo-style features
-- Target: Spring Boot 4 + React 18 + MySQL 8+
-- Author: Generated for Fullstack Project 2026
-- ============================================================

DROP DATABASE IF EXISTS flashcard_platform;
CREATE DATABASE flashcard_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flashcard_platform;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- DROP ALL TABLES (reverse dependency order)
-- ============================================================
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS quiz_answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS srs_reviews;
DROP TABLE IF EXISTS card_progress;
DROP TABLE IF EXISTS flashcards;
DROP TABLE IF EXISTS deck_enrollments;
DROP TABLE IF EXISTS decks;
DROP TABLE IF EXISTS learning_streaks;
DROP TABLE IF EXISTS leaderboard_snapshots;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS subscription_plans;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1) SUBSCRIPTION PLANS (like course packages)
-- ============================================================
CREATE TABLE subscription_plans (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_code   VARCHAR(30)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price       DECIMAL(12,2) NOT NULL DEFAULT 0,
    duration_days INT NOT NULL DEFAULT 30  COMMENT 'How many days this plan lasts',
    max_decks   INT NOT NULL DEFAULT 10    COMMENT '-1 = unlimited',
    max_cards_per_deck INT NOT NULL DEFAULT 100 COMMENT '-1 = unlimited',
    has_quiz    BOOLEAN NOT NULL DEFAULT TRUE,
    has_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2) LANGUAGES (target learning languages)
-- ============================================================
CREATE TABLE languages (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    lang_code    VARCHAR(10)  NOT NULL UNIQUE COMMENT 'ISO 639-1: en, ja, ko, fr...',
    name         VARCHAR(100) NOT NULL,
    native_name  VARCHAR(100) COMMENT 'English, 日本語, 한국어...',
    flag_url     VARCHAR(255),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 3) USERS (Auth + Profile, similar to YOEDU users + roles)
-- ============================================================
CREATE TABLE users (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    email            VARCHAR(100) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    full_name        VARCHAR(100) NOT NULL,
    avatar_url       VARCHAR(255),
    role             ENUM('ADMIN','LEARNER','CONTENT_CREATOR','MODERATOR') NOT NULL DEFAULT 'LEARNER',
    native_lang_id   BIGINT COMMENT 'User native language FK → languages',
    target_lang_id   BIGINT COMMENT 'User learning language FK → languages',
    plan_id          BIGINT COMMENT 'Current subscription plan FK → subscription_plans',
    plan_expires_at  DATETIME,
    xp_total         INT NOT NULL DEFAULT 0  COMMENT 'Total experience points (Duolingo-style)',
    gems             INT NOT NULL DEFAULT 0  COMMENT 'In-app currency',
    streak_current   INT NOT NULL DEFAULT 0  COMMENT 'Current daily streak count',
    streak_longest   INT NOT NULL DEFAULT 0  COMMENT 'All-time best streak',
    daily_goal_cards INT NOT NULL DEFAULT 10 COMMENT 'Cards to review per day goal',
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    last_active_at   DATETIME,
    email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_native_lang  FOREIGN KEY (native_lang_id)  REFERENCES languages(id),
    CONSTRAINT fk_users_target_lang  FOREIGN KEY (target_lang_id)  REFERENCES languages(id),
    CONSTRAINT fk_users_plan         FOREIGN KEY (plan_id)         REFERENCES subscription_plans(id)
);

-- ============================================================
-- 4) REFRESH TOKENS (JWT auth, same pattern as YOEDU)
-- ============================================================
CREATE TABLE refresh_tokens (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT NOT NULL,
    token        VARCHAR(512) NOT NULL UNIQUE,
    expires_at   DATETIME NOT NULL,
    revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by  VARCHAR(512),
    ip_address   VARCHAR(50),
    user_agent   VARCHAR(255),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 5) DECKS (like course_classes — a set of flashcards)
-- ============================================================
CREATE TABLE decks (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    deck_code     VARCHAR(30)  NOT NULL UNIQUE,
    title         VARCHAR(150) NOT NULL,
    description   VARCHAR(500),
    cover_img_url VARCHAR(255),
    owner_id      BIGINT NOT NULL COMMENT 'Creator/owner FK → users',
    lang_id       BIGINT NOT NULL COMMENT 'Target language FK → languages',
    category      VARCHAR(80) COMMENT 'e.g. Business, Travel, JLPT N3',
    difficulty    ENUM('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL DEFAULT 'BEGINNER',
    is_public     BOOLEAN NOT NULL DEFAULT TRUE  COMMENT 'Public = other users can enroll',
    is_featured   BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Admin-curated featured decks',
    total_cards   INT NOT NULL DEFAULT 0         COMMENT 'Denormalized count, updated by trigger/app',
    view_count    INT NOT NULL DEFAULT 0,
    enroll_count  INT NOT NULL DEFAULT 0,
    status        ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_decks_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_decks_lang  FOREIGN KEY (lang_id)  REFERENCES languages(id)
);

-- ============================================================
-- 6) DECK ENROLLMENTS (user joins a deck, like enrollments in YOEDU)
-- ============================================================
CREATE TABLE deck_enrollments (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id       BIGINT NOT NULL,
    deck_id       BIGINT NOT NULL,
    enrolled_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        ENUM('ACTIVE','PAUSED','COMPLETED','DROPPED') NOT NULL DEFAULT 'ACTIVE',
    mastered_cards INT NOT NULL DEFAULT 0  COMMENT 'Cards with ease_factor >= threshold',
    last_studied_at DATETIME,
    next_review_at  DATETIME               COMMENT 'Next SRS review due date',
    note          VARCHAR(255),
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_deck_enrollment UNIQUE (user_id, deck_id),
    CONSTRAINT fk_deck_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_deck_enrollments_deck FOREIGN KEY (deck_id) REFERENCES decks(id)
);

-- ============================================================
-- 7) FLASHCARDS (individual cards inside a deck)
-- ============================================================
CREATE TABLE flashcards (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    deck_id        BIGINT NOT NULL,
    front_text     VARCHAR(500) NOT NULL COMMENT 'Word / phrase (target language)',
    front_img_url  VARCHAR(255),
    front_audio_url VARCHAR(255),
    back_text      VARCHAR(500) NOT NULL COMMENT 'Definition / translation',
    back_img_url   VARCHAR(255),
    back_audio_url VARCHAR(255),
    example_sentence VARCHAR(500) COMMENT 'Example usage in target language',
    phonetic       VARCHAR(150) COMMENT 'IPA or romaji pronunciation',
    hint           VARCHAR(255) COMMENT 'Memory hint shown before flip',
    tags           VARCHAR(255) COMMENT 'Comma-separated tags: noun,verb,JLPT-N3',
    card_order     INT NOT NULL DEFAULT 0 COMMENT 'Display order within deck',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_flashcards_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- ============================================================
-- 8) CARD PROGRESS (per-user per-card SRS state)
-- Like learning_results in YOEDU but per-card granularity
-- ============================================================
CREATE TABLE card_progress (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    card_id         BIGINT NOT NULL,
    deck_id         BIGINT NOT NULL COMMENT 'Denormalized for faster queries',
    -- SRS fields (SM-2 algorithm inspired)
    ease_factor     DECIMAL(4,2) NOT NULL DEFAULT 2.50 COMMENT 'SM-2 ease factor, min 1.30',
    interval_days   INT NOT NULL DEFAULT 0   COMMENT 'Days until next review',
    repetitions     INT NOT NULL DEFAULT 0   COMMENT 'Consecutive correct answers',
    next_review_at  DATETIME                 COMMENT 'Scheduled review date',
    last_reviewed_at DATETIME,
    -- Statistics
    total_reviews   INT NOT NULL DEFAULT 0,
    correct_count   INT NOT NULL DEFAULT 0,
    again_count     INT NOT NULL DEFAULT 0   COMMENT 'Times rated Again',
    hard_count      INT NOT NULL DEFAULT 0,
    good_count      INT NOT NULL DEFAULT 0,
    easy_count      INT NOT NULL DEFAULT 0,
    -- Status
    status          ENUM('NEW','LEARNING','REVIEW','MASTERED') NOT NULL DEFAULT 'NEW',
    is_suspended    BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'User manually suspended card',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_card_progress UNIQUE (user_id, card_id),
    CONSTRAINT fk_card_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_card_progress_card FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE,
    CONSTRAINT fk_card_progress_deck FOREIGN KEY (deck_id) REFERENCES decks(id)
);

-- ============================================================
-- 9) SRS REVIEWS (each review event log, like attendances in YOEDU)
-- ============================================================
CREATE TABLE srs_reviews (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    card_id         BIGINT NOT NULL,
    deck_id         BIGINT NOT NULL,
    -- Rating: Again=1 Hard=2 Good=3 Easy=4
    rating          TINYINT NOT NULL COMMENT '1=Again 2=Hard 3=Good 4=Easy',
    -- Time taken to answer in milliseconds
    response_ms     INT COMMENT 'How long user took to answer',
    -- SRS state BEFORE this review (snapshot)
    ease_before     DECIMAL(4,2),
    interval_before INT,
    -- SRS state AFTER this review (new schedule)
    ease_after      DECIMAL(4,2),
    interval_after  INT,
    next_review_at  DATETIME COMMENT 'Next due date calculated after this review',
    -- Session context
    session_type    ENUM('REGULAR','CRAM','LEARN_NEW') NOT NULL DEFAULT 'REGULAR',
    reviewed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_srs_rating CHECK (rating BETWEEN 1 AND 4),
    CONSTRAINT fk_srs_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_srs_reviews_card FOREIGN KEY (card_id) REFERENCES flashcards(id),
    CONSTRAINT fk_srs_reviews_deck FOREIGN KEY (deck_id) REFERENCES decks(id)
);

-- ============================================================
-- 10) QUIZZES (quiz sets linked to a deck)
-- ============================================================
CREATE TABLE quizzes (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    deck_id       BIGINT NOT NULL,
    quiz_code     VARCHAR(30)  NOT NULL UNIQUE,
    title         VARCHAR(150) NOT NULL,
    description   VARCHAR(500),
    quiz_type     ENUM('MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK','MIXED') NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    time_limit_sec INT COMMENT 'Seconds per question, NULL = no limit',
    total_questions INT NOT NULL DEFAULT 0 COMMENT 'Denormalized count',
    pass_score    DECIMAL(5,2) NOT NULL DEFAULT 60.00 COMMENT 'Min % to pass',
    max_attempts  INT NOT NULL DEFAULT 3 COMMENT '-1 = unlimited',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    BIGINT NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quizzes_deck    FOREIGN KEY (deck_id)    REFERENCES decks(id),
    CONSTRAINT fk_quizzes_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- 11) QUIZ QUESTIONS
-- ============================================================
CREATE TABLE quiz_questions (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    quiz_id        BIGINT NOT NULL,
    card_id        BIGINT COMMENT 'Linked flashcard (nullable for custom questions)',
    question_text  VARCHAR(500) NOT NULL,
    question_img_url VARCHAR(255),
    question_type  ENUM('MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK') NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    -- Options stored as JSON array: ["opt A","opt B","opt C","opt D"]
    options_json   JSON COMMENT 'Answer options for MC questions',
    correct_answer VARCHAR(500) NOT NULL COMMENT 'Correct answer text or index',
    explanation    VARCHAR(500) COMMENT 'Shown after answering',
    points         INT NOT NULL DEFAULT 10,
    question_order INT NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_questions_card FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE SET NULL
);

-- ============================================================
-- 12) QUIZ ATTEMPTS (user attempts a quiz, like tuition_invoices)
-- ============================================================
CREATE TABLE quiz_attempts (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    quiz_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    attempt_number  INT NOT NULL DEFAULT 1,
    started_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at    DATETIME,
    time_spent_sec  INT COMMENT 'Total seconds spent',
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    score_percent   DECIMAL(5,2) COMMENT 'Calculated score %',
    score_points    INT NOT NULL DEFAULT 0,
    passed          BOOLEAN,
    status          ENUM('IN_PROGRESS','SUBMITTED','EXPIRED','ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    xp_earned       INT NOT NULL DEFAULT 0 COMMENT 'XP awarded for this attempt',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id)  REFERENCES quizzes(id),
    CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id)  REFERENCES users(id)
);

-- ============================================================
-- 13) QUIZ ANSWERS (per-question answer in an attempt)
-- ============================================================
CREATE TABLE quiz_answers (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    attempt_id      BIGINT NOT NULL,
    question_id     BIGINT NOT NULL,
    user_answer     VARCHAR(500) COMMENT 'What the user selected/typed',
    is_correct      BOOLEAN,
    points_earned   INT NOT NULL DEFAULT 0,
    time_taken_sec  INT COMMENT 'Time spent on this question',
    answered_at     DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quiz_answer UNIQUE (attempt_id, question_id),
    CONSTRAINT fk_quiz_answers_attempt  FOREIGN KEY (attempt_id)  REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_answers_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
);

-- ============================================================
-- 14) LEARNING STREAKS (daily activity log, like attendances)
-- ============================================================
CREATE TABLE learning_streaks (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    activity_date   DATE NOT NULL,
    cards_reviewed  INT NOT NULL DEFAULT 0,
    cards_learned   INT NOT NULL DEFAULT 0  COMMENT 'NEW cards introduced today',
    quizzes_taken   INT NOT NULL DEFAULT 0,
    xp_earned       INT NOT NULL DEFAULT 0,
    study_minutes   INT NOT NULL DEFAULT 0  COMMENT 'Total study time today in minutes',
    goal_met        BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Daily goal achieved?',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_learning_streak UNIQUE (user_id, activity_date),
    CONSTRAINT fk_learning_streaks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 15) LEADERBOARD SNAPSHOTS (weekly/monthly ranking cache)
-- ============================================================
CREATE TABLE leaderboard_snapshots (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    period_type     ENUM('DAILY','WEEKLY','MONTHLY','ALL_TIME') NOT NULL DEFAULT 'WEEKLY',
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    rank_position   INT NOT NULL,
    xp_score        INT NOT NULL DEFAULT 0,
    quiz_score      INT NOT NULL DEFAULT 0,
    streak_days     INT NOT NULL DEFAULT 0,
    cards_mastered  INT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_leaderboard UNIQUE (user_id, period_type, period_start),
    CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 16) NOTIFICATIONS (same structure as YOEDU)
-- ============================================================
CREATE TABLE notifications (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id             BIGINT NOT NULL     COMMENT 'Recipient FK → users',
    type                ENUM('REVIEW_DUE','STREAK_REMINDER','QUIZ_RESULT','ACHIEVEMENT','SYSTEM','NEW_CONTENT') NOT NULL,
    title               VARCHAR(150) NOT NULL,
    content             VARCHAR(500) NOT NULL,
    action_url          VARCHAR(255) COMMENT 'Deep link: /decks/5/review',
    related_entity_type VARCHAR(50)  COMMENT 'deck | quiz | card | achievement',
    related_entity_id   BIGINT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at             DATETIME,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_users_plan_expires    ON users(plan_expires_at);
CREATE INDEX idx_decks_owner           ON decks(owner_id);
CREATE INDEX idx_decks_lang            ON decks(lang_id);
CREATE INDEX idx_decks_status          ON decks(status);
CREATE INDEX idx_decks_is_public       ON decks(is_public);
CREATE INDEX idx_deck_enrollments_user ON deck_enrollments(user_id);
CREATE INDEX idx_deck_enrollments_deck ON deck_enrollments(deck_id);
CREATE INDEX idx_deck_enrollments_next ON deck_enrollments(next_review_at);
CREATE INDEX idx_flashcards_deck       ON flashcards(deck_id);
CREATE INDEX idx_flashcards_order      ON flashcards(deck_id, card_order);
CREATE INDEX idx_card_progress_user    ON card_progress(user_id);
CREATE INDEX idx_card_progress_deck    ON card_progress(deck_id);
CREATE INDEX idx_card_progress_next    ON card_progress(next_review_at);
CREATE INDEX idx_card_progress_status  ON card_progress(status);
CREATE INDEX idx_srs_reviews_user      ON srs_reviews(user_id);
CREATE INDEX idx_srs_reviews_card      ON srs_reviews(card_id);
CREATE INDEX idx_srs_reviews_date      ON srs_reviews(reviewed_at);
CREATE INDEX idx_quiz_attempts_user    ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz    ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_status  ON quiz_attempts(status);
CREATE INDEX idx_learning_streaks_user ON learning_streaks(user_id);
CREATE INDEX idx_learning_streaks_date ON learning_streaks(activity_date);
CREATE INDEX idx_leaderboard_period    ON leaderboard_snapshots(period_type, period_start);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX idx_refresh_tokens_user   ON refresh_tokens(user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Subscription Plans
INSERT INTO subscription_plans (plan_code, name, description, price, duration_days, max_decks, max_cards_per_deck, has_quiz, has_leaderboard) VALUES
('FREE',    'Gói Miễn Phí',   'Học cơ bản, tối đa 3 bộ thẻ, 50 thẻ/bộ',    0,       0,  3, 50,  FALSE, FALSE),
('PLUS',    'Gói Plus',       'Không giới hạn bộ thẻ, quiz đầy đủ',         79000,  30, -1, 300, TRUE,  TRUE),
('PREMIUM', 'Gói Premium',    'Toàn bộ tính năng, bảng xếp hạng, không quảng cáo', 149000, 30, -1, -1,  TRUE,  TRUE);

-- Languages
INSERT INTO languages (lang_code, name, native_name, flag_url) VALUES
('en', 'Tiếng Anh',  'English',  'flags/en.svg'),
('ja', 'Tiếng Nhật', '日本語',   'flags/ja.svg'),
('ko', 'Tiếng Hàn',  '한국어',   'flags/ko.svg'),
('fr', 'Tiếng Pháp', 'Français', 'flags/fr.svg'),
('zh', 'Tiếng Trung','中文',      'flags/zh.svg'),
('vi', 'Tiếng Việt', 'Tiếng Việt','flags/vi.svg');

-- Users
INSERT INTO users (username, email, password_hash, full_name, avatar_url, role, native_lang_id, target_lang_id, plan_id, plan_expires_at, xp_total, gems, streak_current, streak_longest, daily_goal_cards) VALUES
('admin',       'admin@flashcard.vn',      '{noop}Admin@123',   'System Admin',      'avatars/admin.png',   'ADMIN',           6, 1, 3, '2099-12-31 23:59:59', 9999, 999, 0, 0, 10),
('creator01',   'creator@flashcard.vn',    '{noop}Create@123',  'Nguyễn Thị Hương',  'avatars/huong.png',   'CONTENT_CREATOR', 6, 1, 3, '2026-12-31 23:59:59', 5200, 320, 12, 45, 20),
('learner_nam', 'nam.learner@gmail.com',   '{noop}Nam@123',     'Trần Văn Nam',      'avatars/nam.png',     'LEARNER',         6, 1, 2, '2026-06-30 23:59:59', 1850, 80,  7,  15, 10),
('learner_lan', 'lan.learner@gmail.com',   '{noop}Lan@123',     'Lê Thị Lan',        'avatars/lan.png',     'LEARNER',         6, 2, 2, '2026-06-30 23:59:59', 3100, 150, 21, 35, 15),
('learner_bao', 'bao.learner@gmail.com',   '{noop}Bao@123',     'Phạm Quốc Bảo',     'avatars/bao.png',     'LEARNER',         6, 3, 1, NULL,                  420,  20,  3,  8,  5),
('learner_mai', 'mai.learner@gmail.com',   '{noop}Mai@123',     'Hoàng Thị Mai',     'avatars/mai.png',     'LEARNER',         6, 1, 3, '2026-12-31 23:59:59', 4500, 280, 15, 60, 20),
('mod01',       'mod@flashcard.vn',        '{noop}Mod@123',     'Moderator Tuấn',    'avatars/tuan.png',    'MODERATOR',       6, 1, 3, '2099-12-31 23:59:59', 0,    0,   0,  0,  10);

-- Decks
INSERT INTO decks (deck_code, title, description, cover_img_url, owner_id, lang_id, category, difficulty, is_public, is_featured, total_cards, enroll_count, status) VALUES
('EN-BASIC-001', 'Tiếng Anh Giao Tiếp Hàng Ngày',   '500 từ vựng thiết yếu cho giao tiếp cơ bản',         'covers/en-basic.jpg',    2, 1, 'Giao tiếp',  'BEGINNER',     TRUE, TRUE,  20, 85, 'PUBLISHED'),
('EN-BUSI-001',  'Business English Vocabulary',       'Từ vựng tiếng Anh thương mại và công sở',            'covers/en-biz.jpg',      2, 1, 'Business',   'INTERMEDIATE', TRUE, TRUE,  15, 42, 'PUBLISHED'),
('JA-HIRA-001',  'Bảng Chữ Hiragana Nhật Bản',        'Học thuộc 46 ký tự Hiragana cơ bản',                 'covers/ja-hira.jpg',     2, 2, 'Chữ viết',   'BEGINNER',     TRUE, TRUE,  10, 130,'PUBLISHED'),
('KO-BASIC-001', 'Hàn Ngữ Căn Bản - Bảng Chữ Cái',   'Hangul 40 ký tự cơ bản cho người mới',              'covers/ko-basic.jpg',    2, 3, 'Chữ viết',   'BEGINNER',     TRUE, FALSE, 12, 65, 'PUBLISHED'),
('EN-TOEIC-001', 'TOEIC 600 - Từ Vựng Theo Chủ Đề',  'Luyện từ vựng TOEIC theo nhóm chủ đề phổ biến',     'covers/en-toeic.jpg',    2, 1, 'TOEIC',      'INTERMEDIATE', TRUE, TRUE,  18, 58, 'PUBLISHED'),
('EN-PRIV-001',  'My Personal Vocab Notes',            'Bộ thẻ cá nhân, chỉ tôi xem được',                  'covers/private.jpg',     3, 1, 'Personal',   'BEGINNER',     FALSE,FALSE,  5,  1,  'PUBLISHED');

-- Flashcards - Deck 1: EN-BASIC (sample 20 cards)
INSERT INTO flashcards (deck_id, front_text, front_audio_url, back_text, example_sentence, phonetic, hint, tags, card_order) VALUES
(1, 'Hello',        'audio/en/hello.mp3',      'Xin chào',           'Hello! How are you?',              '/həˈloʊ/',   'Lời chào quen thuộc nhất',       'greeting,basic',        1),
(1, 'Thank you',    'audio/en/thankyou.mp3',   'Cảm ơn',             'Thank you for your help.',         '/θæŋk juː/', 'Dùng khi nhận được sự giúp đỡ', 'polite,basic',          2),
(1, 'Sorry',        'audio/en/sorry.mp3',      'Xin lỗi',            'Sorry, I am late.',                '/ˈsɒri/',    'Dùng khi mắc lỗi',              'polite,basic',          3),
(1, 'Please',       'audio/en/please.mp3',     'Làm ơn / Xin vui lòng', 'Please help me.',              '/pliːz/',    'Lịch sự khi nhờ vả',            'polite,basic',          4),
(1, 'Water',        'audio/en/water.mp3',      'Nước',               'Can I have some water?',           '/ˈwɔːtər/',  'Thứ cơ thể cần mỗi ngày',       'food,noun,basic',       5),
(1, 'Food',         'audio/en/food.mp3',       'Thức ăn / Đồ ăn',   'This food is delicious.',          '/fuːd/',     'Bữa ăn hằng ngày',              'food,noun,basic',       6),
(1, 'Work',         'audio/en/work.mp3',       'Làm việc / Công việc','I go to work every day.',         '/wɜːrk/',    'Hoạt động hàng ngày',           'verb,noun,basic',       7),
(1, 'Home',         'audio/en/home.mp3',       'Nhà',                'I am going home now.',             '/hoʊm/',     'Nơi bạn sống',                  'noun,basic',            8),
(1, 'Family',       'audio/en/family.mp3',     'Gia đình',           'My family has 4 members.',         '/ˈfæməli/', 'Những người thân yêu',           'noun,basic',            9),
(1, 'Friend',       'audio/en/friend.mp3',     'Bạn bè / Người bạn', 'She is my best friend.',          '/frend/',    'Người bạn tin tưởng',           'noun,social,basic',    10),
(1, 'Happy',        'audio/en/happy.mp3',      'Vui / Hạnh phúc',   'I am very happy today.',           '/ˈhæpi/',    'Cảm xúc tích cực',              'adjective,emotion',    11),
(1, 'Sad',          'audio/en/sad.mp3',        'Buồn',               'Why are you sad?',                 '/sæd/',      'Ngược của happy',               'adjective,emotion',    12),
(1, 'Beautiful',    'audio/en/beautiful.mp3',  'Đẹp',                'What a beautiful day!',            '/ˈbjuːtɪfl/','Khen ngợi vẻ đẹp',              'adjective,compliment', 13),
(1, 'Good',         'audio/en/good.mp3',       'Tốt / Ngon',         'This is very good!',               '/ɡʊd/',      'Đánh giá tích cực',             'adjective,basic',      14),
(1, 'Bad',          'audio/en/bad.mp3',        'Xấu / Tệ',           'That is a bad idea.',              '/bæd/',      'Ngược của good',                'adjective,basic',      15),
(1, 'Big',          'audio/en/big.mp3',        'To / Lớn',           'This is a big house.',             '/bɪɡ/',      'Kích thước lớn',                'adjective,size',       16),
(1, 'Small',        'audio/en/small.mp3',      'Nhỏ',                'My cat is very small.',            '/smɔːl/',    'Kích thước nhỏ',                'adjective,size',       17),
(1, 'Run',          'audio/en/run.mp3',        'Chạy',               'I run every morning.',             '/rʌn/',      'Chuyển động nhanh',             'verb,action',          18),
(1, 'Eat',          'audio/en/eat.mp3',        'Ăn',                 'We eat together.',                 '/iːt/',      'Hoạt động dùng bữa',            'verb,food,action',     19),
(1, 'Sleep',        'audio/en/sleep.mp3',      'Ngủ',                'I need to sleep now.',             '/sliːp/',    'Nghỉ ngơi ban đêm',             'verb,action',          20);

-- Flashcards - Deck 3: JA-HIRA (sample 10 Hiragana cards)
INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, hint, tags, card_order) VALUES
(3, 'あ', 'a - âm "a"',   'a',  'Giống chữ Kanji 安 đơn giản hóa', 'hiragana,vowel',  1),
(3, 'い', 'i - âm "i"',   'i',  'Hai nét thẳng song song',          'hiragana,vowel',  2),
(3, 'う', 'u - âm "u"',   'u',  'Hình vòng nhỏ phía trên',          'hiragana,vowel',  3),
(3, 'え', 'e - âm "e"',   'e',  'Giống số 3 có thêm nét',           'hiragana,vowel',  4),
(3, 'お', 'o - âm "o"',   'o',  'Ba nét, phức tạp nhất nguyên âm',  'hiragana,vowel',  5),
(3, 'か', 'ka - âm "ka"', 'ka', 'Giống chữ カ nhưng mềm hơn',       'hiragana,k-row',  6),
(3, 'き', 'ki - âm "ki"', 'ki', 'Bốn nét đặc trưng',               'hiragana,k-row',  7),
(3, 'く', 'ku - âm "ku"', 'ku', 'Giống dấu ngoặc nhọn >',           'hiragana,k-row',  8),
(3, 'け', 'ke - âm "ke"', 'ke', 'Giống chữ け đặc trưng',           'hiragana,k-row',  9),
(3, 'こ', 'ko - âm "ko"', 'ko', 'Hai nét ngang đơn giản',           'hiragana,k-row', 10);

-- Deck Enrollments
INSERT INTO deck_enrollments (user_id, deck_id, status, mastered_cards, last_studied_at, next_review_at, note) VALUES
(3, 1, 'ACTIVE',    12, '2026-06-07 20:30:00', '2026-06-08 08:00:00', NULL),
(3, 3, 'ACTIVE',     5, '2026-06-06 19:00:00', '2026-06-08 10:00:00', NULL),
(4, 1, 'ACTIVE',    18, '2026-06-07 21:00:00', '2026-06-09 08:00:00', NULL),
(4, 2, 'ACTIVE',     8, '2026-06-05 20:00:00', '2026-06-08 09:00:00', NULL),
(4, 3, 'COMPLETED', 10, '2026-06-01 18:00:00', NULL,                  'Đã hoàn thành toàn bộ'),
(5, 1, 'PAUSED',     3, '2026-05-20 15:00:00', NULL,                  'Tạm nghỉ do bận'),
(6, 1, 'ACTIVE',    20, '2026-06-07 22:00:00', '2026-06-08 07:00:00', NULL),
(6, 5, 'ACTIVE',    10, '2026-06-07 21:30:00', '2026-06-09 08:00:00', NULL);

-- Card Progress (sample for user 3 - Nam, deck 1)
INSERT INTO card_progress (user_id, card_id, deck_id, ease_factor, interval_days, repetitions, next_review_at, last_reviewed_at, total_reviews, correct_count, again_count, good_count, easy_count, status) VALUES
(3, 1, 1, 2.60, 7,  4, '2026-06-14 08:00:00', '2026-06-07 20:00:00', 6, 5, 1, 3, 2, 'REVIEW'),
(3, 2, 1, 2.50, 4,  3, '2026-06-11 08:00:00', '2026-06-07 20:10:00', 4, 4, 0, 2, 2, 'REVIEW'),
(3, 3, 1, 2.30, 2,  2, '2026-06-09 08:00:00', '2026-06-07 20:15:00', 3, 2, 1, 2, 0, 'LEARNING'),
(3, 4, 1, 1.80, 1,  1, '2026-06-08 08:00:00', '2026-06-07 20:20:00', 2, 1, 1, 1, 0, 'LEARNING'),
(3, 5, 1, 2.70, 10, 5, '2026-06-17 08:00:00', '2026-06-07 20:25:00', 7, 7, 0, 4, 3, 'MASTERED');

-- SRS Reviews (sample review events)
INSERT INTO srs_reviews (user_id, card_id, deck_id, rating, response_ms, ease_before, interval_before, ease_after, interval_after, next_review_at, session_type, reviewed_at) VALUES
(3, 1, 1, 3, 2100, 2.50, 4, 2.60, 7,  '2026-06-14 08:00:00', 'REGULAR',  '2026-06-07 20:00:00'),
(3, 2, 1, 4, 1500, 2.30, 2, 2.50, 4,  '2026-06-11 08:00:00', 'REGULAR',  '2026-06-07 20:10:00'),
(3, 3, 1, 2, 4500, 2.50, 1, 2.30, 2,  '2026-06-09 08:00:00', 'REGULAR',  '2026-06-07 20:15:00'),
(3, 4, 1, 1, 6000, 2.10, 1, 1.80, 1,  '2026-06-08 08:00:00', 'REGULAR',  '2026-06-07 20:20:00'),
(3, 5, 1, 4, 900,  2.50, 6, 2.70, 10, '2026-06-17 08:00:00', 'REGULAR',  '2026-06-07 20:25:00'),
(4, 1, 1, 4, 800,  2.60, 6, 2.70, 10, '2026-06-17 09:00:00', 'REGULAR',  '2026-06-07 21:00:00'),
(6, 1, 1, 3, 1200, 2.50, 4, 2.60, 7,  '2026-06-14 07:00:00', 'REGULAR',  '2026-06-07 22:00:00');

-- Quizzes
INSERT INTO quizzes (deck_id, quiz_code, title, description, quiz_type, time_limit_sec, total_questions, pass_score, max_attempts, created_by) VALUES
(1, 'QUIZ-EN-BASIC-01', 'Kiểm Tra Từ Vựng Cơ Bản - Phần 1', 'Quiz 10 câu về từ vựng giao tiếp hàng ngày', 'MULTIPLE_CHOICE', 30, 10, 70.00, 3, 2),
(1, 'QUIZ-EN-BASIC-02', 'Kiểm Tra Từ Vựng Cơ Bản - Phần 2', 'Quiz từ vựng cảm xúc và tính từ mô tả',     'MIXED',           30, 8,  60.00, 3, 2),
(3, 'QUIZ-JA-HIRA-01',  'Nhận Diện Hiragana - Cơ Bản',      'Quiz nhận diện nguyên âm và phụ âm cơ bản', 'MULTIPLE_CHOICE', 20, 10, 80.00, 5, 2);

-- Quiz Questions (for Quiz 1)
INSERT INTO quiz_questions (quiz_id, card_id, question_text, question_type, options_json, correct_answer, explanation, points, question_order) VALUES
(1, 1, '"Hello" có nghĩa là gì?',             'MULTIPLE_CHOICE', '["Tạm biệt","Xin chào","Cảm ơn","Xin lỗi"]',      'Xin chào',  '"Hello" là lời chào hỏi cơ bản nhất trong tiếng Anh.', 10, 1),
(1, 2, '"Thank you" có nghĩa là gì?',         'MULTIPLE_CHOICE', '["Xin lỗi","Làm ơn","Cảm ơn","Chào tạm biệt"]',   'Cảm ơn',    'Dùng "Thank you" để bày tỏ lòng biết ơn.',            10, 2),
(1, 5, 'Từ nào có nghĩa là "Nước"?',          'MULTIPLE_CHOICE', '["Food","Work","Water","Home"]',                   'Water',     '"Water" là nước - thứ thiết yếu cho sự sống.',        10, 3),
(1, 7, '"Work" thuộc loại từ gì?',            'MULTIPLE_CHOICE', '["Chỉ danh từ","Chỉ động từ","Vừa danh từ vừa động từ","Tính từ"]', 'Vừa danh từ vừa động từ', '"Work" có thể là danh từ (công việc) hoặc động từ (làm việc).', 10, 4),
(1, 9, 'Điền vào chỗ trống: "My ___ has 4 members."', 'FILL_BLANK', NULL, 'family', '"Family" nghĩa là gia đình.', 10, 5),
(1, NULL, '"Happy" và "Sad" là cặp từ gì?',   'MULTIPLE_CHOICE', '["Từ đồng nghĩa","Từ trái nghĩa","Từ cùng loại","Không liên quan"]', 'Từ trái nghĩa', 'Happy (vui) và Sad (buồn) là hai tính từ trái nghĩa.', 10, 6),
(1, 18, 'Động từ "Run" có nghĩa là gì?',      'MULTIPLE_CHOICE', '["Ăn","Ngủ","Chạy","Nhảy"]',                      'Chạy',      '"Run" là chạy - một hoạt động thể chất phổ biến.',    10, 7),
(1, 19, 'Câu nào đúng với "Eat"?',            'MULTIPLE_CHOICE', '["I eat sleep","We eat together","Eat is happy","Home eat water"]', 'We eat together', 'Cấu trúc đúng: We eat together (Chúng ta ăn cùng nhau).', 10, 8),
(1, 11, '"Beautiful" là loại từ gì?',         'MULTIPLE_CHOICE', '["Danh từ","Động từ","Tính từ","Trạng từ"]',       'Tính từ',   '"Beautiful" là tính từ mô tả vẻ đẹp.',               10, 9),
(1, 20, 'Dịch sang tiếng Anh: "Tôi cần ngủ"','MULTIPLE_CHOICE', '["I need to eat","I need to sleep","I want to run","I go to home"]', 'I need to sleep', '"Need to" + động từ = cần phải làm gì đó.', 10,10);

-- Quiz Attempts (sample)
INSERT INTO quiz_attempts (quiz_id, user_id, attempt_number, started_at, submitted_at, time_spent_sec, total_questions, correct_answers, score_percent, score_points, passed, status, xp_earned) VALUES
(1, 3, 1, '2026-06-05 20:00:00', '2026-06-05 20:05:00', 287, 10, 8, 80.00, 80, TRUE,  'SUBMITTED', 40),
(1, 4, 1, '2026-06-06 21:00:00', '2026-06-06 21:04:00', 241, 10, 9, 90.00, 90, TRUE,  'SUBMITTED', 45),
(1, 6, 1, '2026-06-07 20:00:00', '2026-06-07 20:03:00', 180, 10,10,100.00,100, TRUE,  'SUBMITTED', 50),
(2, 3, 1, '2026-06-07 20:30:00', '2026-06-07 20:36:00', 352, 8,  5, 62.50, 50, TRUE,  'SUBMITTED', 25),
(1, 5, 1, '2026-06-06 15:00:00', '2026-06-06 15:06:00', 360, 10, 4, 40.00, 40, FALSE, 'SUBMITTED', 10);

-- Learning Streaks (last 7 days for active users)
INSERT INTO learning_streaks (user_id, activity_date, cards_reviewed, cards_learned, quizzes_taken, xp_earned, study_minutes, goal_met) VALUES
-- Nam (user 3) - 7-day streak
(3, '2026-06-01', 15, 5, 0, 50, 20, TRUE),
(3, '2026-06-02', 10, 3, 0, 30, 12, TRUE),
(3, '2026-06-03', 12, 0, 1, 65, 18, TRUE),
(3, '2026-06-04', 18, 4, 0, 55, 25, TRUE),
(3, '2026-06-05', 20, 5, 1, 90, 30, TRUE),
(3, '2026-06-06', 10, 2, 0, 30, 15, TRUE),
(3, '2026-06-07', 15, 3, 1, 60, 22, TRUE),
-- Lan (user 4) - 21-day streak (sample last 7)
(4, '2026-06-01', 25, 8, 1, 95, 35, TRUE),
(4, '2026-06-02', 30, 5, 1, 110, 40, TRUE),
(4, '2026-06-03', 20, 3, 0, 60, 28, TRUE),
(4, '2026-06-04', 22, 6, 1, 85, 32, TRUE),
(4, '2026-06-05', 28, 4, 1, 100, 38, TRUE),
(4, '2026-06-06', 15, 2, 0, 45, 20, TRUE),
(4, '2026-06-07', 25, 5, 1, 90, 35, TRUE),
-- Mai (user 6) - 15-day streak
(6, '2026-06-05', 30, 8, 1, 120, 45, TRUE),
(6, '2026-06-06', 25, 5, 1, 100, 38, TRUE),
(6, '2026-06-07', 35, 6, 2, 150, 50, TRUE);

-- Leaderboard Snapshots (weekly)
INSERT INTO leaderboard_snapshots (user_id, period_type, period_start, period_end, rank_position, xp_score, quiz_score, streak_days, cards_mastered) VALUES
(6, 'WEEKLY', '2026-06-01', '2026-06-07', 1, 370, 100, 15, 20),
(4, 'WEEKLY', '2026-06-01', '2026-06-07', 2, 585, 135, 21, 26),
(3, 'WEEKLY', '2026-06-01', '2026-06-07', 3, 380,  65,  7, 12),
(5, 'WEEKLY', '2026-06-01', '2026-06-07', 4,  30,  10,  3,  3),
(6, 'MONTHLY','2026-06-01', '2026-06-30', 1,4500, 100, 15, 20),
(4, 'MONTHLY','2026-06-01', '2026-06-30', 2,3100, 135, 21, 26),
(3, 'MONTHLY','2026-06-01', '2026-06-30', 3,1850,  65,  7, 12);

-- Notifications
INSERT INTO notifications (user_id, type, title, content, action_url, related_entity_type, related_entity_id, is_read) VALUES
(3, 'REVIEW_DUE',     'Đến giờ ôn tập rồi!',                 '15 thẻ trong bộ "Tiếng Anh Giao Tiếp" đang chờ bạn ôn luyện.',      '/decks/1/review',  'deck', 1, FALSE),
(3, 'STREAK_REMINDER','Giữ ngọn lửa streak của bạn!',         'Bạn đang có streak 7 ngày liên tiếp. Đừng để mất nhé!',             '/learn',           NULL,   NULL, FALSE),
(3, 'QUIZ_RESULT',    'Kết quả Quiz: 80/100 điểm!',           'Bạn đã đạt 80% trong Quiz "Từ Vựng Cơ Bản Phần 1". Xuất sắc!',     '/quizzes/1/result','quiz', 1, TRUE),
(4, 'ACHIEVEMENT',    'Huy hiệu mới: "21 Ngày Liên Tiếp" 🔥', 'Chúc mừng! Bạn đã học liên tục 21 ngày. Thật tuyệt vời!',          '/profile',         NULL,   NULL, FALSE),
(4, 'REVIEW_DUE',     'Có 8 thẻ mới cần học hôm nay',         'Bộ "Business English" có 8 thẻ mới chờ bạn khám phá.',             '/decks/2/review',  'deck', 2, FALSE),
(5, 'STREAK_REMINDER','Bạn chưa học hôm nay!',                'Đừng để streak của mình bị reset nhé. Chỉ cần 5 phút thôi!',       '/learn',           NULL,   NULL, FALSE),
(6, 'QUIZ_RESULT',    'Điểm tuyệt đối! 100/100 🎉',           'Bạn đã đạt điểm tối đa trong Quiz "Từ Vựng Cơ Bản Phần 1"!',       '/quizzes/1/result','quiz', 1, TRUE),
(3, 'NEW_CONTENT',    'Bộ thẻ mới: TOEIC 600',                'Bộ thẻ "TOEIC 600 - Từ Vựng Theo Chủ Đề" vừa được thêm. Thử ngay!','/decks/5',         'deck', 5, FALSE);