ALTER TABLE deck_enrollments
ADD COLUMN max_new_cards_per_day INT NOT NULL DEFAULT 20,
ADD COLUMN max_reviews_per_day INT NOT NULL DEFAULT 100;
