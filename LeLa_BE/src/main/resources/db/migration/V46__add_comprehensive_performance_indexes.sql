-- V46__add_comprehensive_performance_indexes.sql
-- Indexes to speed up critical list and filtering queries safely

-- 1. Decks Filtering Indexes
SET @idx_decks_active_lvl_exam_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'decks'
      AND INDEX_NAME = 'idx_decks_active_lvl_exam'
);
SET @idx_decks_active_lvl_exam_ddl = IF(
    @idx_decks_active_lvl_exam_exists = 0,
    'CREATE INDEX idx_decks_active_lvl_exam ON decks (is_active, level_id, exam_type_id)',
    'SELECT 1'
);
PREPARE stmt_decks_active_lvl_exam FROM @idx_decks_active_lvl_exam_ddl;
EXECUTE stmt_decks_active_lvl_exam;
DEALLOCATE PREPARE stmt_decks_active_lvl_exam;

SET @idx_decks_topic_active_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'decks'
      AND INDEX_NAME = 'idx_decks_topic_active'
);
SET @idx_decks_topic_active_ddl = IF(
    @idx_decks_topic_active_exists = 0,
    'CREATE INDEX idx_decks_topic_active ON decks (topic_id, is_active)',
    'SELECT 1'
);
PREPARE stmt_decks_topic_active FROM @idx_decks_topic_active_ddl;
EXECUTE stmt_decks_topic_active;
DEALLOCATE PREPARE stmt_decks_topic_active;

-- 2. Quizzes Filtering Indexes
SET @idx_quizzes_cat_lvl_active_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'quizzes'
      AND INDEX_NAME = 'idx_quizzes_cat_lvl_active'
);
SET @idx_quizzes_cat_lvl_active_ddl = IF(
    @idx_quizzes_cat_lvl_active_exists = 0,
    'CREATE INDEX idx_quizzes_cat_lvl_active ON quizzes (quiz_category, level_id, is_active)',
    'SELECT 1'
);
PREPARE stmt_quizzes_cat_lvl_active FROM @idx_quizzes_cat_lvl_active_ddl;
EXECUTE stmt_quizzes_cat_lvl_active;
DEALLOCATE PREPARE stmt_quizzes_cat_lvl_active;

-- 3. Tag Lookup Composite Reverse Indexes
SET @idx_dt_tag_deck_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'deck_tags'
      AND INDEX_NAME = 'idx_deck_tags_tag_id'
);
SET @idx_dt_tag_deck_ddl = IF(
    @idx_dt_tag_deck_exists = 0,
    'CREATE INDEX idx_deck_tags_tag_id ON deck_tags (tag_id, deck_id)',
    'SELECT 1'
);
PREPARE stmt_dt_tag_deck FROM @idx_dt_tag_deck_ddl;
EXECUTE stmt_dt_tag_deck;
DEALLOCATE PREPARE stmt_dt_tag_deck;

SET @idx_ft_tag_card_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flashcard_tags'
      AND INDEX_NAME = 'idx_flashcard_tags_tag_id'
);
SET @idx_ft_tag_card_ddl = IF(
    @idx_ft_tag_card_exists = 0,
    'CREATE INDEX idx_flashcard_tags_tag_id ON flashcard_tags (tag_id, flashcard_id)',
    'SELECT 1'
);
PREPARE stmt_ft_tag_card FROM @idx_ft_tag_card_ddl;
EXECUTE stmt_ft_tag_card;
DEALLOCATE PREPARE stmt_ft_tag_card;
