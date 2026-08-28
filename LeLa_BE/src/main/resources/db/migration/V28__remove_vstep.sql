-- V28__remove_vstep.sql
-- Direct ANSI/MySQL/TiDB compatible cleanup of VSTEP exam type and related resources without stored procedures

-- 1. Create helper tables with explicit schemas for VSTEP cleanup targeting IDs
DROP TABLE IF EXISTS _mig_temp_vstep_levels;
CREATE TABLE _mig_temp_vstep_levels (
    id BIGINT NOT NULL,
    PRIMARY KEY (id)
);
INSERT INTO _mig_temp_vstep_levels (id)
SELECT id FROM proficiency_levels WHERE exam_type_id IN (SELECT id FROM exam_types WHERE code = 'VSTEP');

DROP TABLE IF EXISTS _mig_temp_vstep_decks;
CREATE TABLE _mig_temp_vstep_decks (
    id BIGINT NOT NULL,
    PRIMARY KEY (id)
);
INSERT INTO _mig_temp_vstep_decks (id)
SELECT id FROM decks WHERE exam_type_id IN (SELECT id FROM exam_types WHERE code = 'VSTEP');

DROP TABLE IF EXISTS _mig_temp_vstep_quizzes;
CREATE TABLE _mig_temp_vstep_quizzes (
    id BIGINT NOT NULL,
    PRIMARY KEY (id)
);
INSERT INTO _mig_temp_vstep_quizzes (id)
SELECT id FROM quizzes 
WHERE exam_type_id IN (SELECT id FROM exam_types WHERE code = 'VSTEP') 
   OR deck_id IN (SELECT id FROM _mig_temp_vstep_decks);

-- 2. Reset Users current exam and level
UPDATE users 
SET current_exam_type_id = NULL, current_level_id = NULL 
WHERE current_exam_type_id IN (SELECT id FROM exam_types WHERE code = 'VSTEP') 
   OR current_level_id IN (SELECT id FROM _mig_temp_vstep_levels);

-- 3. Delete VSTEP Quizzes and Dependencies
DELETE FROM quiz_answers 
WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id IN (SELECT id FROM _mig_temp_vstep_quizzes));

DELETE FROM quiz_attempt_options 
WHERE attempt_question_id IN (SELECT id FROM quiz_attempt_questions WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id IN (SELECT id FROM _mig_temp_vstep_quizzes)));

DELETE FROM quiz_attempt_questions 
WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id IN (SELECT id FROM _mig_temp_vstep_quizzes));

DELETE FROM quiz_attempts 
WHERE quiz_id IN (SELECT id FROM _mig_temp_vstep_quizzes);

DELETE FROM quiz_question_options 
WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id IN (SELECT id FROM _mig_temp_vstep_quizzes));

DELETE FROM quiz_questions 
WHERE quiz_id IN (SELECT id FROM _mig_temp_vstep_quizzes);

DELETE FROM quizzes 
WHERE id IN (SELECT id FROM _mig_temp_vstep_quizzes);

-- 4. Delete VSTEP Decks and Dependencies
DELETE FROM srs_reviews 
WHERE review_session_id IN (
    SELECT id FROM review_sessions WHERE deck_id IN (SELECT id FROM _mig_temp_vstep_decks)
) 
OR card_id IN (
    SELECT id FROM flashcards WHERE deck_id IN (SELECT id FROM _mig_temp_vstep_decks)
);

DELETE FROM review_sessions WHERE deck_id IN (SELECT id FROM _mig_temp_vstep_decks);

DELETE FROM card_progress 
WHERE card_id IN (
    SELECT id FROM flashcards WHERE deck_id IN (SELECT id FROM _mig_temp_vstep_decks)
);

DELETE FROM flashcard_tags WHERE flashcard_id IN (SELECT id FROM flashcards WHERE deck_id IN (SELECT id FROM _mig_temp_vstep_decks));

DELETE FROM flashcards WHERE deck_id IN (SELECT id FROM _mig_temp_vstep_decks);

DELETE FROM deck_enrollments WHERE deck_id IN (SELECT id FROM _mig_temp_vstep_decks);

DELETE FROM decks WHERE id IN (SELECT id FROM _mig_temp_vstep_decks);

-- 5. Delete VSTEP Levels and Exam Type
DELETE FROM proficiency_levels WHERE exam_type_id IN (SELECT id FROM exam_types WHERE code = 'VSTEP');
DELETE FROM exam_types WHERE code = 'VSTEP';

-- 6. Clean up temporary tables
DROP TABLE IF EXISTS _mig_temp_vstep_quizzes;
DROP TABLE IF EXISTS _mig_temp_vstep_decks;
DROP TABLE IF EXISTS _mig_temp_vstep_levels;
