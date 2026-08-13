-- ============================================================
-- LeLa Flashcard Platform - Upgraded Production Schema
-- Target: MySQL 8+
-- This combined file is for a NEW database.
-- Flyway projects should use the individual V1..V16 files.
-- ============================================================

-- ===== V1__create_languages.sql =====
-- LeLa Flashcard Platform
-- MySQL 8+ / Flyway
-- V1: Reference languages

CREATE TABLE languages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    language_code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NULL,
    flag_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_languages PRIMARY KEY (id),
    CONSTRAINT uk_languages_language_code UNIQUE (language_code)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V2__create_users_and_rbac.sql =====
-- V2: Users and multi-role RBAC

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(500) NULL,

    native_language_id BIGINT NULL,
    target_language_id BIGINT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    daily_goal_cards INT NOT NULL DEFAULT 10,

    xp_total BIGINT NOT NULL DEFAULT 0,
    streak_current INT NOT NULL DEFAULT 0,
    streak_longest INT NOT NULL DEFAULT 0,
    last_activity_date DATE NULL,
    last_active_at DATETIME(6) NULL,

    email_verified_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),

    CONSTRAINT fk_users_native_language_id
        FOREIGN KEY (native_language_id) REFERENCES languages(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_users_target_language_id
        FOREIGN KEY (target_language_id) REFERENCES languages(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_users_status
        CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    CONSTRAINT chk_users_daily_goal_cards
        CHECK (daily_goal_cards BETWEEN 1 AND 1000),
    CONSTRAINT chk_users_xp_total
        CHECK (xp_total >= 0),
    CONSTRAINT chk_users_streak_current
        CHECK (streak_current >= 0),
    CONSTRAINT chk_users_streak_longest
        CHECK (streak_longest >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    role_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uk_roles_role_code UNIQUE (role_code)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V3__create_refresh_token_sessions.sql =====
-- V3: Secure refresh-token sessions
-- Store SHA-256/strong hash only; never store the raw refresh token.

CREATE TABLE refresh_token_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,

    token_hash CHAR(64) NOT NULL,
    token_family_id CHAR(36) NOT NULL,
    replaced_by_token_id BIGINT NULL,

    device_name VARCHAR(150) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(1000) NULL,

    expires_at DATETIME(6) NOT NULL,
    last_used_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    revoke_reason VARCHAR(100) NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_refresh_token_sessions PRIMARY KEY (id),
    CONSTRAINT uk_refresh_token_sessions_token_hash UNIQUE (token_hash),

    CONSTRAINT fk_refresh_token_sessions_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_refresh_token_sessions_replaced_by_token_id
        FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_token_sessions(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_refresh_token_sessions_expiration
        CHECK (expires_at > created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V4__create_subscription_tables.sql =====
-- V4: Subscription and payment history

CREATE TABLE subscription_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    plan_code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NULL,

    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency_code CHAR(3) NOT NULL DEFAULT 'VND',
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    billing_interval_count INT NOT NULL DEFAULT 1,

    max_owned_decks INT NOT NULL DEFAULT 3,
    max_cards_per_deck INT NOT NULL DEFAULT 50,
    max_daily_reviews INT NOT NULL DEFAULT 100,

    quiz_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    leaderboard_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    offline_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    features_json JSON NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_subscription_plans PRIMARY KEY (id),
    CONSTRAINT uk_subscription_plans_plan_code UNIQUE (plan_code),

    CONSTRAINT chk_subscription_plans_price
        CHECK (price >= 0),
    CONSTRAINT chk_subscription_plans_currency_code
        CHECK (CHAR_LENGTH(currency_code) = 3),
    CONSTRAINT chk_subscription_plans_billing_cycle
        CHECK (billing_cycle IN ('FREE', 'MONTHLY', 'YEARLY', 'LIFETIME')),
    CONSTRAINT chk_subscription_plans_billing_interval
        CHECK (billing_interval_count >= 0),
    CONSTRAINT chk_subscription_plans_limits
        CHECK (
            max_owned_decks >= -1
            AND max_cards_per_deck >= -1
            AND max_daily_reviews >= -1
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_subscriptions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    started_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NULL,
    trial_ends_at DATETIME(6) NULL,
    cancelled_at DATETIME(6) NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,

    provider VARCHAR(50) NULL,
    provider_subscription_id VARCHAR(190) NULL,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_user_subscriptions PRIMARY KEY (id),
    CONSTRAINT uk_user_subscriptions_provider_subscription
        UNIQUE (provider, provider_subscription_id),

    CONSTRAINT fk_user_subscriptions_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_user_subscriptions_plan_id
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_user_subscriptions_status
        CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT chk_user_subscriptions_dates
        CHECK (expires_at IS NULL OR expires_at > started_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    subscription_id BIGINT NULL,

    provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(190) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    paid_at DATETIME(6) NULL,
    failed_at DATETIME(6) NULL,
    refunded_at DATETIME(6) NULL,
    failure_reason VARCHAR(500) NULL,
    provider_payload JSON NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT uk_payments_provider_transaction
        UNIQUE (provider, provider_transaction_id),

    CONSTRAINT fk_payments_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_payments_subscription_id
        FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_payments_amount
        CHECK (amount >= 0),
    CONSTRAINT chk_payments_status
        CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED'))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V5__create_decks.sql =====
-- V5: Deck content and moderation workflow

CREATE TABLE decks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    deck_code VARCHAR(50) NOT NULL,
    slug VARCHAR(190) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    cover_image_url VARCHAR(500) NULL,

    owner_id BIGINT NOT NULL,
    language_id BIGINT NOT NULL,

    category VARCHAR(100) NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    total_cards INT NOT NULL DEFAULT 0,
    view_count BIGINT NOT NULL DEFAULT 0,
    enrollment_count BIGINT NOT NULL DEFAULT 0,

    submitted_at DATETIME(6) NULL,
    reviewed_by BIGINT NULL,
    reviewed_at DATETIME(6) NULL,
    rejection_reason VARCHAR(1000) NULL,
    published_at DATETIME(6) NULL,

    deleted_at DATETIME(6) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_decks PRIMARY KEY (id),
    CONSTRAINT uk_decks_deck_code UNIQUE (deck_code),
    CONSTRAINT uk_decks_slug UNIQUE (slug),

    CONSTRAINT fk_decks_owner_id
        FOREIGN KEY (owner_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_decks_language_id
        FOREIGN KEY (language_id) REFERENCES languages(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_decks_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_decks_difficulty
        CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    CONSTRAINT chk_decks_visibility
        CHECK (visibility IN ('PUBLIC', 'UNLISTED', 'PRIVATE')),
    CONSTRAINT chk_decks_status
        CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
    CONSTRAINT chk_decks_counters
        CHECK (total_cards >= 0 AND view_count >= 0 AND enrollment_count >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V6__create_flashcards_and_tags.sql =====
-- V6: Flashcards and normalized tags

CREATE TABLE flashcards (
    id BIGINT NOT NULL AUTO_INCREMENT,
    deck_id BIGINT NOT NULL,

    front_text VARCHAR(1000) NOT NULL,
    back_text VARCHAR(1000) NOT NULL,
    phonetic VARCHAR(255) NULL,
    example_text VARCHAR(1000) NULL,
    hint VARCHAR(500) NULL,
    note TEXT NULL,

    front_image_url VARCHAR(500) NULL,
    back_image_url VARCHAR(500) NULL,
    front_audio_url VARCHAR(500) NULL,
    back_audio_url VARCHAR(500) NULL,

    card_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT NOT NULL,
    updated_by BIGINT NULL,
    deleted_at DATETIME(6) NULL,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_flashcards PRIMARY KEY (id),

    CONSTRAINT fk_flashcards_deck_id
        FOREIGN KEY (deck_id) REFERENCES decks(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_flashcards_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_flashcards_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_flashcards_card_order
        CHECK (card_order >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tags (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_tags PRIMARY KEY (id),
    CONSTRAINT uk_tags_slug UNIQUE (slug)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE flashcard_tags (
    flashcard_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_flashcard_tags PRIMARY KEY (flashcard_id, tag_id),

    CONSTRAINT fk_flashcard_tags_flashcard_id
        FOREIGN KEY (flashcard_id) REFERENCES flashcards(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_flashcard_tags_tag_id
        FOREIGN KEY (tag_id) REFERENCES tags(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V7__create_deck_enrollments.sql =====
-- V7: Deck enrollments

CREATE TABLE deck_enrollments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    deck_id BIGINT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    enrolled_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    paused_at DATETIME(6) NULL,
    completed_at DATETIME(6) NULL,
    dropped_at DATETIME(6) NULL,

    last_studied_at DATETIME(6) NULL,
    next_review_at DATETIME(6) NULL,

    mastered_cards INT NOT NULL DEFAULT 0,
    note VARCHAR(500) NULL,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_deck_enrollments PRIMARY KEY (id),
    CONSTRAINT uk_deck_enrollments_user_deck UNIQUE (user_id, deck_id),

    CONSTRAINT fk_deck_enrollments_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_deck_enrollments_deck_id
        FOREIGN KEY (deck_id) REFERENCES decks(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_deck_enrollments_status
        CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'DROPPED')),
    CONSTRAINT chk_deck_enrollments_mastered_cards
        CHECK (mastered_cards >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V8__create_card_progress.sql =====
-- V8: Lazy per-user card progress
-- No progress rows are created for every card during enrollment.
-- Missing progress means the card is NEW.

CREATE TABLE card_progress (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    card_id BIGINT NOT NULL,

    state VARCHAR(20) NOT NULL DEFAULT 'NEW',
    suspended_from_state VARCHAR(20) NULL,

    ease_factor DECIMAL(5,2) NOT NULL DEFAULT 2.50,
    interval_days INT NOT NULL DEFAULT 0,
    repetitions INT NOT NULL DEFAULT 0,
    lapse_count INT NOT NULL DEFAULT 0,
    learning_step INT NOT NULL DEFAULT 0,
    scheduled_days INT NOT NULL DEFAULT 0,
    elapsed_days INT NOT NULL DEFAULT 0,

    due_at DATETIME(6) NULL,
    last_reviewed_at DATETIME(6) NULL,
    last_rating TINYINT NULL,
    algorithm_version VARCHAR(30) NOT NULL DEFAULT 'SM2_V1',

    total_reviews INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    again_count INT NOT NULL DEFAULT 0,
    hard_count INT NOT NULL DEFAULT 0,
    good_count INT NOT NULL DEFAULT 0,
    easy_count INT NOT NULL DEFAULT 0,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_card_progress PRIMARY KEY (id),
    CONSTRAINT uk_card_progress_user_card UNIQUE (user_id, card_id),

    CONSTRAINT fk_card_progress_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_card_progress_card_id
        FOREIGN KEY (card_id) REFERENCES flashcards(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_card_progress_state
        CHECK (state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING', 'SUSPENDED')),
    CONSTRAINT chk_card_progress_suspended_from_state
        CHECK (
            suspended_from_state IS NULL
            OR suspended_from_state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING')
        ),
    CONSTRAINT chk_card_progress_ease_factor
        CHECK (ease_factor >= 1.30),
    CONSTRAINT chk_card_progress_non_negative
        CHECK (
            interval_days >= 0
            AND repetitions >= 0
            AND lapse_count >= 0
            AND learning_step >= 0
            AND scheduled_days >= 0
            AND elapsed_days >= 0
            AND total_reviews >= 0
            AND correct_count >= 0
            AND again_count >= 0
            AND hard_count >= 0
            AND good_count >= 0
            AND easy_count >= 0
        ),
    CONSTRAINT chk_card_progress_last_rating
        CHECK (last_rating IS NULL OR last_rating BETWEEN 1 AND 4)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V9__create_review_sessions_and_reviews.sql =====
-- V9: SRS review sessions, offline sync and immutable review events

CREATE TABLE review_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,

    user_id BIGINT NOT NULL,
    deck_id BIGINT NOT NULL,

    session_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    device_id VARCHAR(190) NULL,
    offline_mode BOOLEAN NOT NULL DEFAULT FALSE,

    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6) NULL,
    abandoned_at DATETIME(6) NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_review_sessions PRIMARY KEY (id),
    CONSTRAINT uk_review_sessions_public_id UNIQUE (public_id),

    CONSTRAINT fk_review_sessions_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_review_sessions_deck_id
        FOREIGN KEY (deck_id) REFERENCES decks(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_review_sessions_session_type
        CHECK (session_type IN ('REGULAR', 'CRAM', 'LEARN_NEW')),
    CONSTRAINT chk_review_sessions_status
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED'))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE srs_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    review_session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    card_id BIGINT NOT NULL,

    client_event_id CHAR(36) NOT NULL,
    rating TINYINT NOT NULL,
    response_ms INT NULL,

    previous_state VARCHAR(20) NULL,
    new_state VARCHAR(20) NOT NULL,

    ease_before DECIMAL(5,2) NULL,
    ease_after DECIMAL(5,2) NOT NULL,
    interval_before INT NULL,
    interval_after INT NOT NULL,
    due_before DATETIME(6) NULL,
    due_after DATETIME(6) NULL,

    algorithm_version VARCHAR(30) NOT NULL,
    xp_awarded INT NOT NULL DEFAULT 0,

    client_reviewed_at DATETIME(6) NOT NULL,
    server_received_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reviewed_at DATETIME(6) NOT NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_srs_reviews PRIMARY KEY (id),
    CONSTRAINT uk_srs_reviews_client_event_id UNIQUE (client_event_id),

    CONSTRAINT fk_srs_reviews_review_session_id
        FOREIGN KEY (review_session_id) REFERENCES review_sessions(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_srs_reviews_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_srs_reviews_card_id
        FOREIGN KEY (card_id) REFERENCES flashcards(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_srs_reviews_rating
        CHECK (rating BETWEEN 1 AND 4),
    CONSTRAINT chk_srs_reviews_response_ms
        CHECK (response_ms IS NULL OR response_ms >= 0),
    CONSTRAINT chk_srs_reviews_states
        CHECK (
            (previous_state IS NULL OR previous_state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING'))
            AND new_state IN ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING')
        ),
    CONSTRAINT chk_srs_reviews_intervals
        CHECK (
            (interval_before IS NULL OR interval_before >= 0)
            AND interval_after >= 0
        ),
    CONSTRAINT chk_srs_reviews_xp
        CHECK (xp_awarded >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V10__create_quiz_tables.sql =====
-- V10: Quiz authoring, immutable attempt snapshots and idempotent submission

CREATE TABLE quizzes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    deck_id BIGINT NOT NULL,
    quiz_code VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,

    quiz_type VARCHAR(30) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    time_limit_seconds INT NULL,
    pass_score DECIMAL(5,2) NOT NULL DEFAULT 60.00,
    max_attempts INT NOT NULL DEFAULT 3,

    shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
    shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,
    total_questions INT NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    updated_by BIGINT NULL,
    deleted_at DATETIME(6) NULL,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_quizzes PRIMARY KEY (id),
    CONSTRAINT uk_quizzes_quiz_code UNIQUE (quiz_code),

    CONSTRAINT fk_quizzes_deck_id
        FOREIGN KEY (deck_id) REFERENCES decks(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_quizzes_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_quizzes_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_quizzes_quiz_type
        CHECK (quiz_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MIXED')),
    CONSTRAINT chk_quizzes_time_limit
        CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
    CONSTRAINT chk_quizzes_pass_score
        CHECK (pass_score BETWEEN 0 AND 100),
    CONSTRAINT chk_quizzes_max_attempts
        CHECK (max_attempts = -1 OR max_attempts > 0),
    CONSTRAINT chk_quizzes_total_questions
        CHECK (total_questions >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_questions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    quiz_id BIGINT NOT NULL,
    source_card_id BIGINT NULL,

    question_text VARCHAR(1500) NOT NULL,
    question_image_url VARCHAR(500) NULL,
    question_type VARCHAR(30) NOT NULL,
    explanation TEXT NULL,

    points INT NOT NULL DEFAULT 10,
    question_time_limit_seconds INT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_quiz_questions PRIMARY KEY (id),

    CONSTRAINT fk_quiz_questions_quiz_id
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_quiz_questions_source_card_id
        FOREIGN KEY (source_card_id) REFERENCES flashcards(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_quiz_questions_question_type
        CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK')),
    CONSTRAINT chk_quiz_questions_points
        CHECK (points > 0),
    CONSTRAINT chk_quiz_questions_time_limit
        CHECK (question_time_limit_seconds IS NULL OR question_time_limit_seconds > 0),
    CONSTRAINT chk_quiz_questions_display_order
        CHECK (display_order >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_question_options (
    id BIGINT NOT NULL AUTO_INCREMENT,
    question_id BIGINT NOT NULL,

    option_key VARCHAR(20) NULL,
    option_text VARCHAR(1000) NOT NULL,
    normalized_text VARCHAR(1000) NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_quiz_question_options PRIMARY KEY (id),

    CONSTRAINT fk_quiz_question_options_question_id
        FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_quiz_question_options_display_order
        CHECK (display_order >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,

    quiz_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    attempt_number INT NOT NULL,

    start_idempotency_key VARCHAR(190) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',

    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NULL,
    submitted_at DATETIME(6) NULL,
    abandoned_at DATETIME(6) NULL,

    time_spent_seconds INT NULL,
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    score_points INT NOT NULL DEFAULT 0,
    score_percent DECIMAL(5,2) NULL,
    passed BOOLEAN NULL,
    xp_awarded INT NOT NULL DEFAULT 0,

    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_quiz_attempts PRIMARY KEY (id),
    CONSTRAINT uk_quiz_attempts_public_id UNIQUE (public_id),
    CONSTRAINT uk_quiz_attempts_quiz_user_number
        UNIQUE (quiz_id, user_id, attempt_number),
    CONSTRAINT uk_quiz_attempts_start_idempotency
        UNIQUE (start_idempotency_key),

    CONSTRAINT fk_quiz_attempts_quiz_id
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_quiz_attempts_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_quiz_attempts_attempt_number
        CHECK (attempt_number > 0),
    CONSTRAINT chk_quiz_attempts_status
        CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED')),
    CONSTRAINT chk_quiz_attempts_score_percent
        CHECK (score_percent IS NULL OR score_percent BETWEEN 0 AND 100),
    CONSTRAINT chk_quiz_attempts_counts
        CHECK (
            total_questions >= 0
            AND correct_answers >= 0
            AND score_points >= 0
            AND xp_awarded >= 0
            AND (time_spent_seconds IS NULL OR time_spent_seconds >= 0)
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempt_questions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    attempt_id BIGINT NOT NULL,
    source_question_id BIGINT NULL,

    question_text VARCHAR(1500) NOT NULL,
    question_image_url VARCHAR(500) NULL,
    question_type VARCHAR(30) NOT NULL,
    explanation TEXT NULL,

    points INT NOT NULL,
    question_time_limit_seconds INT NULL,
    display_order INT NOT NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_quiz_attempt_questions PRIMARY KEY (id),
    CONSTRAINT uk_quiz_attempt_questions_attempt_order
        UNIQUE (attempt_id, display_order),

    CONSTRAINT fk_quiz_attempt_questions_attempt_id
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_quiz_attempt_questions_source_question_id
        FOREIGN KEY (source_question_id) REFERENCES quiz_questions(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_quiz_attempt_questions_question_type
        CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK')),
    CONSTRAINT chk_quiz_attempt_questions_points
        CHECK (points > 0),
    CONSTRAINT chk_quiz_attempt_questions_time_limit
        CHECK (question_time_limit_seconds IS NULL OR question_time_limit_seconds > 0),
    CONSTRAINT chk_quiz_attempt_questions_display_order
        CHECK (display_order >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempt_options (
    id BIGINT NOT NULL AUTO_INCREMENT,
    attempt_question_id BIGINT NOT NULL,
    source_option_id BIGINT NULL,

    option_key VARCHAR(20) NULL,
    option_text VARCHAR(1000) NOT NULL,
    normalized_text VARCHAR(1000) NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_quiz_attempt_options PRIMARY KEY (id),
    CONSTRAINT uk_quiz_attempt_options_question_order
        UNIQUE (attempt_question_id, display_order),

    CONSTRAINT fk_quiz_attempt_options_attempt_question_id
        FOREIGN KEY (attempt_question_id) REFERENCES quiz_attempt_questions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_quiz_attempt_options_source_option_id
        FOREIGN KEY (source_option_id) REFERENCES quiz_question_options(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_quiz_attempt_options_display_order
        CHECK (display_order >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_answers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    attempt_id BIGINT NOT NULL,
    attempt_question_id BIGINT NOT NULL,
    selected_attempt_option_id BIGINT NULL,

    answer_text VARCHAR(1500) NULL,
    normalized_answer_text VARCHAR(1500) NULL,

    is_correct BOOLEAN NULL,
    points_awarded INT NOT NULL DEFAULT 0,
    time_taken_seconds INT NULL,
    answered_at DATETIME(6) NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_quiz_answers PRIMARY KEY (id),
    CONSTRAINT uk_quiz_answers_attempt_question
        UNIQUE (attempt_id, attempt_question_id),

    CONSTRAINT fk_quiz_answers_attempt_id
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_quiz_answers_attempt_question_id
        FOREIGN KEY (attempt_question_id) REFERENCES quiz_attempt_questions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_quiz_answers_selected_attempt_option_id
        FOREIGN KEY (selected_attempt_option_id) REFERENCES quiz_attempt_options(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_quiz_answers_points
        CHECK (points_awarded >= 0),
    CONSTRAINT chk_quiz_answers_time
        CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V11__create_daily_learning_activities.sql =====
-- V11: Daily activity aggregate for heatmap, goals and streaks

CREATE TABLE daily_learning_activities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    activity_date DATE NOT NULL,
    timezone VARCHAR(64) NOT NULL,

    review_count INT NOT NULL DEFAULT 0,
    cards_learned INT NOT NULL DEFAULT 0,
    quiz_count INT NOT NULL DEFAULT 0,
    minutes_spent INT NOT NULL DEFAULT 0,
    xp_earned INT NOT NULL DEFAULT 0,
    goal_met BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_daily_learning_activities PRIMARY KEY (id),
    CONSTRAINT uk_daily_learning_activities_user_date
        UNIQUE (user_id, activity_date),

    CONSTRAINT fk_daily_learning_activities_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_daily_learning_activities_non_negative
        CHECK (
            review_count >= 0
            AND cards_learned >= 0
            AND quiz_count >= 0
            AND minutes_spent >= 0
            AND xp_earned >= 0
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V12__create_notifications.sql =====
-- V12: Multi-channel notifications with deduplication

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,

    type VARCHAR(40) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    title VARCHAR(200) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    action_url VARCHAR(500) NULL,

    related_entity_type VARCHAR(50) NULL,
    related_entity_id BIGINT NULL,
    deduplication_key VARCHAR(190) NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(6) NULL,

    scheduled_at DATETIME(6) NULL,
    delivered_at DATETIME(6) NULL,
    failed_at DATETIME(6) NULL,
    failure_reason VARCHAR(500) NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT uk_notifications_user_dedup
        UNIQUE (user_id, deduplication_key),

    CONSTRAINT fk_notifications_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_notifications_type
        CHECK (type IN (
            'REVIEW_DUE',
            'STREAK_REMINDER',
            'QUIZ_RESULT',
            'ACHIEVEMENT',
            'SYSTEM',
            'NEW_CONTENT',
            'SUBSCRIPTION'
        )),
    CONSTRAINT chk_notifications_channel
        CHECK (channel IN ('IN_APP', 'EMAIL', 'PUSH')),
    CONSTRAINT chk_notifications_status
        CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED'))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V13__create_leaderboard_snapshots.sql =====
-- V13: Leaderboard metric snapshots
-- Rank is calculated with MySQL 8 window functions instead of stored manually.

CREATE TABLE leaderboard_snapshots (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,

    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    xp_score BIGINT NOT NULL DEFAULT 0,
    quiz_score BIGINT NOT NULL DEFAULT 0,
    streak_days INT NOT NULL DEFAULT 0,
    cards_mastered INT NOT NULL DEFAULT 0,
    total_score BIGINT NOT NULL DEFAULT 0,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_leaderboard_snapshots PRIMARY KEY (id),
    CONSTRAINT uk_leaderboard_snapshots_user_period
        UNIQUE (user_id, period_type, period_start),

    CONSTRAINT fk_leaderboard_snapshots_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_leaderboard_snapshots_period_type
        CHECK (period_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME')),
    CONSTRAINT chk_leaderboard_snapshots_period_dates
        CHECK (period_end >= period_start),
    CONSTRAINT chk_leaderboard_snapshots_scores
        CHECK (
            xp_score >= 0
            AND quiz_score >= 0
            AND streak_days >= 0
            AND cards_mastered >= 0
            AND total_score >= 0
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V14__create_audit_idempotency_and_outbox.sql =====
-- V14: Production support tables

CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT NULL,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NULL,

    before_data JSON NULL,
    after_data JSON NULL,

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(1000) NULL,
    request_id VARCHAR(100) NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_audit_logs PRIMARY KEY (id),

    CONSTRAINT fk_audit_logs_actor_user_id
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE idempotency_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,

    scope VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(190) NOT NULL,
    request_hash CHAR(64) NOT NULL,

    processing_status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    response_status_code INT NULL,
    response_body JSON NULL,

    locked_until DATETIME(6) NULL,
    expires_at DATETIME(6) NOT NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_idempotency_records PRIMARY KEY (id),
    CONSTRAINT uk_idempotency_records_scope_key
        UNIQUE (scope, idempotency_key),

    CONSTRAINT fk_idempotency_records_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_idempotency_records_status
        CHECK (processing_status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_idempotency_records_response_status
        CHECK (
            response_status_code IS NULL
            OR response_status_code BETWEEN 100 AND 599
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE outbox_events (
    id BIGINT NOT NULL AUTO_INCREMENT,

    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(150) NOT NULL,
    payload JSON NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    available_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    processed_at DATETIME(6) NULL,
    retry_count INT NOT NULL DEFAULT 0,
    last_error VARCHAR(2000) NULL,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_outbox_events PRIMARY KEY (id),

    CONSTRAINT chk_outbox_events_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),
    CONSTRAINT chk_outbox_events_retry_count
        CHECK (retry_count >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ===== V15__create_performance_indexes.sql =====
-- V15: Composite indexes based on production query patterns
-- Unique constraints and FK indexes already exist; only add useful query indexes.

CREATE INDEX idx_users_status_deleted
    ON users(status, deleted_at);

CREATE INDEX idx_refresh_token_sessions_user_revoked_expires
    ON refresh_token_sessions(user_id, revoked_at, expires_at);

CREATE INDEX idx_refresh_token_sessions_family
    ON refresh_token_sessions(token_family_id);

CREATE INDEX idx_user_subscriptions_user_status_expires
    ON user_subscriptions(user_id, status, expires_at);

CREATE INDEX idx_payments_user_created
    ON payments(user_id, created_at);

CREATE INDEX idx_decks_language_status_visibility
    ON decks(language_id, status, visibility);

CREATE INDEX idx_decks_owner_status_deleted
    ON decks(owner_id, status, deleted_at);

CREATE INDEX idx_decks_featured_status
    ON decks(is_featured, status);

CREATE INDEX idx_decks_title
    ON decks(title);

CREATE INDEX idx_flashcards_deck_active_order
    ON flashcards(deck_id, is_active, card_order);

CREATE INDEX idx_flashcards_deck_deleted
    ON flashcards(deck_id, deleted_at);

CREATE INDEX idx_deck_enrollments_user_status_due
    ON deck_enrollments(user_id, status, next_review_at);

CREATE INDEX idx_deck_enrollments_deck_status
    ON deck_enrollments(deck_id, status);

CREATE INDEX idx_card_progress_user_due
    ON card_progress(user_id, due_at);

CREATE INDEX idx_card_progress_user_state_due
    ON card_progress(user_id, state, due_at);

CREATE INDEX idx_card_progress_card
    ON card_progress(card_id);

CREATE INDEX idx_review_sessions_user_status_started
    ON review_sessions(user_id, status, started_at);

CREATE INDEX idx_review_sessions_deck_started
    ON review_sessions(deck_id, started_at);

CREATE INDEX idx_srs_reviews_user_reviewed
    ON srs_reviews(user_id, reviewed_at);

CREATE INDEX idx_srs_reviews_card_reviewed
    ON srs_reviews(card_id, reviewed_at);

CREATE INDEX idx_srs_reviews_session
    ON srs_reviews(review_session_id, reviewed_at);

CREATE INDEX idx_quizzes_deck_active_deleted
    ON quizzes(deck_id, is_active, deleted_at);

CREATE INDEX idx_quiz_questions_quiz_active_order
    ON quiz_questions(quiz_id, is_active, display_order);

CREATE INDEX idx_quiz_question_options_question_order
    ON quiz_question_options(question_id, display_order);

CREATE INDEX idx_quiz_attempts_user_quiz_status
    ON quiz_attempts(user_id, quiz_id, status);

CREATE INDEX idx_quiz_attempts_quiz_submitted
    ON quiz_attempts(quiz_id, submitted_at);

CREATE INDEX idx_quiz_attempt_questions_attempt
    ON quiz_attempt_questions(attempt_id, display_order);

CREATE INDEX idx_quiz_answers_attempt
    ON quiz_answers(attempt_id);

CREATE INDEX idx_daily_learning_activities_user_date
    ON daily_learning_activities(user_id, activity_date);

CREATE INDEX idx_notifications_user_read_created
    ON notifications(user_id, is_read, created_at);

CREATE INDEX idx_notifications_status_scheduled
    ON notifications(status, scheduled_at);

CREATE INDEX idx_leaderboard_period_xp
    ON leaderboard_snapshots(period_type, period_start, xp_score DESC);

CREATE INDEX idx_leaderboard_period_total
    ON leaderboard_snapshots(period_type, period_start, total_score DESC);

CREATE INDEX idx_audit_logs_entity_created
    ON audit_logs(entity_type, entity_id, created_at);

CREATE INDEX idx_audit_logs_actor_created
    ON audit_logs(actor_user_id, created_at);

CREATE INDEX idx_idempotency_records_expiration
    ON idempotency_records(expires_at);

CREATE INDEX idx_outbox_events_status_available
    ON outbox_events(status, available_at);

-- ===== V16__seed_reference_data.sql =====
-- V16: Stable reference data only
-- Demo users/decks/cards should be kept outside production migrations.

INSERT INTO languages (
    language_code,
    name,
    native_name,
    flag_url,
    is_active
) VALUES
    ('en', 'Tiếng Anh',   'English',    'flags/en.svg', TRUE),
    ('vi', 'Tiếng Việt',  'Tiếng Việt', 'flags/vi.svg', TRUE);

INSERT INTO roles (
    role_code,
    name,
    description,
    is_active
) VALUES
    ('ADMIN', 'Quản trị viên', 'Toàn quyền quản trị hệ thống', TRUE),
    ('LEARNER', 'Người học', 'Học deck, ôn tập SRS và làm quiz', TRUE),
    ('CONTENT_CREATOR', 'Người tạo nội dung', 'Tạo và quản lý nội dung học của mình', TRUE),
    ('MODERATOR', 'Kiểm duyệt viên', 'Kiểm duyệt nội dung và hỗ trợ quản lý người dùng', TRUE);

INSERT INTO subscription_plans (
    plan_code,
    name,
    description,
    price,
    currency_code,
    billing_cycle,
    billing_interval_count,
    max_owned_decks,
    max_cards_per_deck,
    max_daily_reviews,
    quiz_enabled,
    leaderboard_enabled,
    offline_enabled,
    display_order,
    is_active
) VALUES
    (
        'FREE',
        'Gói Miễn Phí',
        'Các tính năng học cơ bản',
        0,
        'VND',
        'FREE',
        0,
        3,
        50,
        100,
        FALSE,
        FALSE,
        FALSE,
        1,
        TRUE
    ),
    (
        'PLUS',
        'Gói Plus',
        'Quiz, bảng xếp hạng và giới hạn nội dung cao hơn',
        79000,
        'VND',
        'MONTHLY',
        1,
        -1,
        500,
        1000,
        TRUE,
        TRUE,
        TRUE,
        2,
        TRUE
    ),
    (
        'PREMIUM',
        'Gói Premium',
        'Toàn bộ tính năng hiện có',
        149000,
        'VND',
        'MONTHLY',
        1,
        -1,
        -1,
        -1,
        TRUE,
        TRUE,
        TRUE,
        3,
        TRUE
    );

