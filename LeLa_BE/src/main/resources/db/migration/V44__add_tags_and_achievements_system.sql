-- V44__add_tags_and_achievements_system.sql
-- Migration for Tags and Achievements System

-- 1. Tags Table Adjustments
ALTER TABLE tags ADD COLUMN IF NOT EXISTS description VARCHAR(500) AFTER slug;
ALTER TABLE tags ADD CONSTRAINT uk_tags_slug UNIQUE (slug);

-- 2. Deck Tags Table
CREATE TABLE IF NOT EXISTS deck_tags (
    deck_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (deck_id, tag_id),
    CONSTRAINT fk_dt_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE,
    CONSTRAINT fk_dt_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Flashcard Tags Table
CREATE TABLE IF NOT EXISTS flashcard_tags (
    flashcard_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (flashcard_id, tag_id),
    CONSTRAINT fk_ft_flashcard FOREIGN KEY (flashcard_id) REFERENCES flashcards (id) ON DELETE CASCADE,
    CONSTRAINT fk_ft_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Achievements Table Adjustments
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS category VARCHAR(50) AFTER condition_value;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER category;
ALTER TABLE achievements ADD CONSTRAINT uk_achievements_code UNIQUE (code);

-- 5. User Achievements UNIQUE Index (Protects against duplicate XP awards)
ALTER TABLE user_achievements ADD CONSTRAINT uk_user_achievement UNIQUE (user_id, achievement_id);
