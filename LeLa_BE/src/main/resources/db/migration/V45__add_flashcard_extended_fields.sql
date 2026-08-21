ALTER TABLE flashcards
ADD COLUMN part_of_speech VARCHAR(100) NULL,
ADD COLUMN definition TEXT NULL,
ADD COLUMN example_translation TEXT NULL,
ADD COLUMN related_words VARCHAR(500) NULL;
