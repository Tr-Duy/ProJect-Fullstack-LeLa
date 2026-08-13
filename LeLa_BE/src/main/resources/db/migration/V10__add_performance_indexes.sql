-- Tối ưu hóa hiệu suất (Performance Optimization Indexes)
-- Các Index này giúp tăng tốc độ truy vấn trên các bảng thường xuyên được filter hoặc join
-- Lưu ý: MySQL đã tự động tạo Index cho các cột Foreign Key (owner_id, deck_id, language_id, user_id...)
-- Vì vậy chúng ta chỉ tạo Index cho các cột thường dùng trong mệnh đề WHERE mà chưa phải là FK.

-- 1. Index cho bảng decks
CREATE INDEX idx_decks_status_visibility ON decks(status, visibility);

-- 2. Index cho bảng flashcards
CREATE INDEX idx_flashcards_is_active ON flashcards(is_active);

-- 3. Index cho bảng payments
CREATE INDEX idx_payments_status ON payments(status);
