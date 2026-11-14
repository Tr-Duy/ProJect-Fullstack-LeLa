-- Additive types; retain every existing value and row.
ALTER TABLE quizzes DROP CHECK chk_quizzes_quiz_type;
ALTER TABLE quizzes ADD CONSTRAINT chk_quizzes_quiz_type CHECK
 (quiz_type IN ('MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK','MIXED','MULTIPLE_CHOICE_MEANING','MATCHING_PAIRS'));
ALTER TABLE quiz_questions DROP CHECK chk_quiz_questions_question_type;
ALTER TABLE quiz_questions ADD CONSTRAINT chk_quiz_questions_question_type CHECK
 (question_type IN ('MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK','MULTIPLE_CHOICE_MEANING','MATCHING_PAIRS'));
ALTER TABLE quiz_attempt_questions DROP CHECK chk_quiz_attempt_questions_question_type;
ALTER TABLE quiz_attempt_questions ADD CONSTRAINT chk_quiz_attempt_questions_question_type CHECK
 (question_type IN ('MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK','MULTIPLE_CHOICE_MEANING','MATCHING_PAIRS'));

SET @timed_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='quiz_attempts' AND column_name='precise_score')=0, 'ALTER TABLE quiz_attempts ADD COLUMN precise_score DECIMAL(12,4) NULL', 'SELECT 1');
PREPARE timed_stmt FROM @timed_ddl; EXECUTE timed_stmt; DEALLOCATE PREPARE timed_stmt;
SET @timed_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='quiz_attempts' AND column_name='precise_max_score')=0, 'ALTER TABLE quiz_attempts ADD COLUMN precise_max_score DECIMAL(12,4) NULL', 'SELECT 1');
PREPARE timed_stmt FROM @timed_ddl; EXECUTE timed_stmt; DEALLOCATE PREPARE timed_stmt;
CREATE TABLE IF NOT EXISTS timed_quiz_states (
 attempt_id BIGINT NOT NULL PRIMARY KEY,
 payload LONGTEXT NOT NULL,
 CONSTRAINT fk_timed_quiz_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
);

-- Hidden templates: legacy catalog queries exclude deleted/inactive rows.
-- New clients discover the two modes through the capability endpoint only.
INSERT INTO quizzes (quiz_code,title,quiz_type,quiz_category,pass_score,max_attempts,
 shuffle_questions,shuffle_options,total_questions,is_active,deleted_at,version,created_by,created_at,updated_at)
VALUES
 ('VOCAB-MEANING-V1','Chọn đáp án đúng','MULTIPLE_CHOICE_MEANING','NORMAL',60,2147483647,1,1,20,0,NOW(),0,(SELECT id FROM users WHERE username='admin'),NOW(),NOW()),
 ('VOCAB-MATCHING-V1','Ghép cặp từ - Định nghĩa','MATCHING_PAIRS','NORMAL',60,2147483647,1,1,5,0,NOW(),0,(SELECT id FROM users WHERE username='admin'),NOW(),NOW());
