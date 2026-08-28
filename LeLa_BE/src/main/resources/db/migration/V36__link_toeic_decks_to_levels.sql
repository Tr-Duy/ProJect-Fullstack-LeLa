-- V36__link_toeic_decks_to_levels.sql
-- Gán exam_type_id và level_id chính xác cho 50 TOEIC Decks để phân quyền trình độ

SET @toeic_exam_id = (SELECT id FROM exam_types WHERE code = 'TOEIC' LIMIT 1);

-- 1. TOEIC Dưới 500 (TOEIC_BASIC)
UPDATE decks 
SET exam_type_id = @toeic_exam_id,
    level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_BASIC' LIMIT 1)
WHERE deck_code LIKE 'DECK-TOEIC-U500%';

-- 2. TOEIC 500-650 (TOEIC_INTERMEDIATE)
UPDATE decks 
SET exam_type_id = @toeic_exam_id,
    level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_INTERMEDIATE' LIMIT 1)
WHERE deck_code LIKE 'DECK-TOEIC-500-650%';

-- 3. TOEIC 650-800 (TOEIC_ADVANCED)
UPDATE decks 
SET exam_type_id = @toeic_exam_id,
    level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_ADVANCED' LIMIT 1)
WHERE deck_code LIKE 'DECK-TOEIC-650-800%';

-- 4. TOEIC 800+ (TOEIC_EXCELLENT)
UPDATE decks 
SET exam_type_id = @toeic_exam_id,
    level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_EXCELLENT' LIMIT 1)
WHERE deck_code LIKE 'DECK-TOEIC-800P%' OR deck_code LIKE 'DECK-TOEIC-800%';

-- 5. Seed default level for learner1 (TOEIC Dưới 500)
UPDATE users 
SET current_exam_type_id = @toeic_exam_id, 
    current_level_id = (SELECT id FROM proficiency_levels WHERE code = 'TOEIC_BASIC' LIMIT 1) 
WHERE username = 'learner1';

