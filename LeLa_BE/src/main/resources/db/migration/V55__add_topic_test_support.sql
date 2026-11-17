-- V55__add_topic_test_support.sql
-- Additive migration for Topic-based tests (Bài thi theo chủ đề/bộ thẻ).

SET @col_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='deck_enrollments' AND column_name='topic_test_passed')=0,
    'ALTER TABLE deck_enrollments ADD COLUMN topic_test_passed BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1');
PREPARE stmt FROM @col_ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='deck_enrollments' AND column_name='topic_test_best_score')=0,
    'ALTER TABLE deck_enrollments ADD COLUMN topic_test_best_score DECIMAL(5,2) NULL',
    'SELECT 1');
PREPARE stmt FROM @col_ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='deck_enrollments' AND column_name='topic_test_last_attempt_at')=0,
    'ALTER TABLE deck_enrollments ADD COLUMN topic_test_last_attempt_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @col_ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
