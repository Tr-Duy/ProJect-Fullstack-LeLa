-- V7: Chuyển đổi cột xoá mềm sang is_active đồng bộ theo quyết định của team

-- 1. Bảng tags: Xoá cột is_deleted (vừa tạo ở V6) và thêm is_active
ALTER TABLE tags DROP COLUMN is_deleted;
ALTER TABLE tags ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Bảng decks: Thêm cột is_active
ALTER TABLE decks ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Bảng flashcards đã có sẵn cột is_active (BOOLEAN NOT NULL DEFAULT TRUE) trong V1 nên không cần thêm.
