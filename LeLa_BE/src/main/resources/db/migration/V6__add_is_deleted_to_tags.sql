-- V6: Add soft delete to tags table
ALTER TABLE tags
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
