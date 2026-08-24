-- V44__add_tags_and_achievements_system.sql
-- Migration for Tags and Achievements System

-- 1. Tags Table Adjustments
SET @tags_description_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tags'
      AND COLUMN_NAME = 'description'
);
SET @tags_description_ddl = IF(
    @tags_description_exists = 0,
    'ALTER TABLE tags ADD COLUMN description VARCHAR(500) AFTER slug',
    'SELECT 1'
);
PREPARE stmt_tags_description FROM @tags_description_ddl;
EXECUTE stmt_tags_description;
DEALLOCATE PREPARE stmt_tags_description;

SET @uk_tags_slug_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tags'
      AND CONSTRAINT_NAME = 'uk_tags_slug'
      AND CONSTRAINT_TYPE = 'UNIQUE'
);
SET @uk_tags_slug_ddl = IF(
    @uk_tags_slug_exists = 0,
    'ALTER TABLE tags ADD CONSTRAINT uk_tags_slug UNIQUE (slug)',
    'SELECT 1'
);
PREPARE stmt_uk_tags_slug FROM @uk_tags_slug_ddl;
EXECUTE stmt_uk_tags_slug;
DEALLOCATE PREPARE stmt_uk_tags_slug;

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
SET @achievements_category_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'achievements'
      AND COLUMN_NAME = 'category'
);
SET @achievements_category_ddl = IF(
    @achievements_category_exists = 0,
    'ALTER TABLE achievements ADD COLUMN category VARCHAR(50) AFTER condition_value',
    'SELECT 1'
);
PREPARE stmt_achievements_category FROM @achievements_category_ddl;
EXECUTE stmt_achievements_category;
DEALLOCATE PREPARE stmt_achievements_category;

SET @achievements_is_active_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'achievements'
      AND COLUMN_NAME = 'is_active'
);
SET @achievements_is_active_ddl = IF(
    @achievements_is_active_exists = 0,
    'ALTER TABLE achievements ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER category',
    'SELECT 1'
);
PREPARE stmt_achievements_is_active FROM @achievements_is_active_ddl;
EXECUTE stmt_achievements_is_active;
DEALLOCATE PREPARE stmt_achievements_is_active;

SET @uk_achievements_code_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'achievements'
      AND CONSTRAINT_NAME = 'uk_achievements_code'
      AND CONSTRAINT_TYPE = 'UNIQUE'
);
SET @uk_achievements_code_ddl = IF(
    @uk_achievements_code_exists = 0,
    'ALTER TABLE achievements ADD CONSTRAINT uk_achievements_code UNIQUE (code)',
    'SELECT 1'
);
PREPARE stmt_uk_achievements_code FROM @uk_achievements_code_ddl;
EXECUTE stmt_uk_achievements_code;
DEALLOCATE PREPARE stmt_uk_achievements_code;

-- 5. User Achievements UNIQUE Index (Protects against duplicate XP awards)
SET @uk_user_achievement_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_achievements'
      AND CONSTRAINT_NAME = 'uk_user_achievement'
      AND CONSTRAINT_TYPE = 'UNIQUE'
);
SET @uk_user_achievement_ddl = IF(
    @uk_user_achievement_exists = 0,
    'ALTER TABLE user_achievements ADD CONSTRAINT uk_user_achievement UNIQUE (user_id, achievement_id)',
    'SELECT 1'
);
PREPARE stmt_uk_user_achievement FROM @uk_user_achievement_ddl;
EXECUTE stmt_uk_user_achievement;
DEALLOCATE PREPARE stmt_uk_user_achievement;
