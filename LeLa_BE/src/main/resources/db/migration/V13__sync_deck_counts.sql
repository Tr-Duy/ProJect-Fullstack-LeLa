-- Fix out-of-sync total_cards in decks table
UPDATE decks d
SET total_cards = (
    SELECT COUNT(*) 
    FROM flashcards f 
    WHERE f.deck_id = d.id AND f.is_active = true
);

-- Fix out-of-sync mastered_cards in deck_enrollment table
UPDATE deck_enrollments de
SET mastered_cards = COALESCE((
    SELECT COUNT(*)
    FROM card_progress cp
    JOIN flashcards f ON cp.card_id = f.id
    WHERE cp.user_id = de.user_id
      AND f.deck_id = de.deck_id
      AND cp.state = 'REVIEW'
), 0);
