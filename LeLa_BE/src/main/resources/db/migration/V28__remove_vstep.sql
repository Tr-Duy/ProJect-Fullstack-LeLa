DELIMITER //

DROP PROCEDURE IF EXISTS RemoveVstep //

CREATE PROCEDURE RemoveVstep()
BEGIN
    DECLARE v_vstep_id BIGINT;

    -- 1. Find VSTEP ID
    SELECT id INTO v_vstep_id FROM exam_types WHERE code = 'VSTEP';

    IF v_vstep_id IS NOT NULL THEN
        -- ==========================================
        -- 2. TẠO CÁC BẢNG TẠM ĐỂ CHỐT DANH SÁCH XÓA
        -- ==========================================
        
        DROP TABLE IF EXISTS _mig_temp_vstep_levels;
        CREATE TABLE _mig_temp_vstep_levels AS
        SELECT id FROM proficiency_levels WHERE exam_type_id = v_vstep_id;

        DROP TABLE IF EXISTS _mig_temp_vstep_decks;
        CREATE TABLE _mig_temp_vstep_decks AS
        SELECT id FROM decks WHERE exam_type_id = v_vstep_id;

        DROP TABLE IF EXISTS _mig_temp_vstep_quizzes;
        CREATE TABLE _mig_temp_vstep_quizzes AS
        SELECT id FROM quizzes 
        WHERE exam_type_id = v_vstep_id 
           OR deck_id IN (SELECT id FROM _mig_temp_vstep_decks);

        -- ==========================================
        -- 3. RESET USERS
        -- ==========================================
        UPDATE users 
        SET current_exam_type_id = NULL, current_level_id = NULL 
        WHERE current_exam_type_id = v_vstep_id 
           OR current_level_id IN (SELECT id FROM _mig_temp_vstep_levels);

        -- ==========================================
        -- 4. XÓA VSTEP QUIZZES VÀ DEPENDENCIES
        -- ==========================================
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

        -- ==========================================
        -- 5. XÓA VSTEP DECKS VÀ DEPENDENCIES
        -- ==========================================
        
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

        -- ==========================================
        -- 6. XÓA VSTEP LEVELS VÀ EXAM TYPE
        -- ==========================================
        DELETE FROM proficiency_levels WHERE exam_type_id = v_vstep_id;
        DELETE FROM exam_types WHERE id = v_vstep_id;

        -- ==========================================
        -- 7. DỌN DẸP BẢNG TẠM
        -- ==========================================
        DROP TABLE IF EXISTS _mig_temp_vstep_quizzes;
        DROP TABLE IF EXISTS _mig_temp_vstep_decks;
        DROP TABLE IF EXISTS _mig_temp_vstep_levels;

    END IF;
END //

DELIMITER ;

CALL RemoveVstep();
DROP PROCEDURE IF EXISTS RemoveVstep;
