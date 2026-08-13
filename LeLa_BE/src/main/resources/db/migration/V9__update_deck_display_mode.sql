-- Add display_mode column
ALTER TABLE decks ADD COLUMN display_mode VARCHAR(20) DEFAULT 'RANDOM' NOT NULL;

-- Migrate data from show_meaning_first
UPDATE decks SET display_mode = 'BACK' WHERE show_meaning_first = true;
UPDATE decks SET display_mode = 'FRONT' WHERE show_meaning_first = false;

-- Drop show_meaning_first column
ALTER TABLE decks DROP COLUMN show_meaning_first;
