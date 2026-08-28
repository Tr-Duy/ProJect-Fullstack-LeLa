-- V29__add_level_snapshot_to_quiz_attempt.sql

ALTER TABLE quiz_attempts ADD COLUMN level_id_at_attempt BIGINT NULL;
ALTER TABLE quiz_attempts ADD CONSTRAINT fk_quiz_attempts_level FOREIGN KEY (level_id_at_attempt) REFERENCES proficiency_levels(id);

UPDATE quiz_attempts qa
JOIN users u ON qa.user_id = u.id
SET qa.level_id_at_attempt = u.current_level_id
WHERE qa.level_id_at_attempt IS NULL;
