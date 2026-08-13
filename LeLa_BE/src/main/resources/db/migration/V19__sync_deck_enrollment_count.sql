UPDATE decks d
SET enrollment_count = (
    SELECT COUNT(id)
    FROM deck_enrollments de
    WHERE de.deck_id = d.id
);
