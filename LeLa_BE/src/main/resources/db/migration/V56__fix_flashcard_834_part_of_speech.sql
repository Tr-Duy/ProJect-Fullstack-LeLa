-- V56__fix_flashcard_834_part_of_speech.sql
-- Fix part_of_speech for flashcard 834 ('Specification') from 'v' to 'n'

UPDATE flashcards 
SET part_of_speech = 'n', updated_at = NOW() 
WHERE id = 834 AND front_text = 'Specification' AND part_of_speech = 'v';
