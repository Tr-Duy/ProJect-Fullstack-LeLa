# Thiết Kế Migration Flyway Cho Bài Thi Theo Chủ Đề (V58+)

> **Trạng thái tài liệu:** Tài liệu thiết kế kỹ thuật (Design Doc only). **Chưa** tạo migration SQL cho đến khi người dùng phê duyệt các bản nháp CSV.

---

## 1. Bối Cảnh & Mục Tiêu

### 1.1. Bối cảnh
- Hệ thống Bài thi theo chủ đề (Topic-based Tests) yêu cầu mỗi bộ thẻ phải có tối thiểu **8 thẻ hợp lệ** (không phải placeholder rác, có nghĩa và từ loại hợp lệ theo `DeckCardFilter`).
- Hiện tại:
  - **Lô 1 (Đã áp dụng live)**: 4 bộ TOEIC gần ngưỡng (1001, 1010, 1016, 1020) với 11 thẻ đã được chuẩn hóa trong DB dev.
  - **Lô 1b (Đang chờ duyệt)**: 3 bộ từ vựng cơ bản gần ngưỡng (Bộ 8 Numbers, Bộ 9 Family, Bộ 10 Food) thiếu 3 thẻ mỗi bộ để đạt ngưỡng 8 thẻ -> Cần **INSERT 9 thẻ mới**.
  - **Lô 2 (Đang chờ duyệt)**: 88 bộ TOEIC Oxford hiện có 0 thẻ hợp lệ (toàn bộ là placeholder) -> Cần **UPDATE 704 thẻ** (8 thẻ/bộ).

### 1.2. Mục tiêu
- Khi người dùng chính thức phê duyệt các bản nháp (Lô 1b và Lô 2), các thay đổi dữ liệu sẽ được đóng gói thành các phiên bản Flyway migration (V58+).
- Đảm bảo migration:
  1. An toàn tuyệt đối: Không xóa dữ liệu, không đè lên thẻ đã được người dùng/admin biên tập thủ công.
  2. Idempotent: Chạy lại nhiều lần không sinh dữ liệu trùng lặp.
  3. Hoạt động hoàn hảo trên cả **Database trống (Clean DB)** và **Database hiện có (Existing DB)**.

---

## 2. Quy Tắc & Mẫu SQL Migration Chuẩn

### 2.1. Pattern 1: Conditional UPDATE (Cập nhật nghĩa thẻ có sẵn)
Áp dụng cho Lô 2 (chuẩn hóa nghĩa của các thẻ placeholder có sẵn).

```sql
-- Pattern UPDATE có điều kiện an toàn:
-- Chỉ cập nhật nếu thẻ đang là placeholder theo định nghĩa DeckCardFilter.
-- Nếu thẻ đã được người dùng/admin sửa trước đó (nghĩa hợp lệ), giữ nguyên, không đè.

UPDATE flashcards
SET
    back_text = 'Nhà tư vấn, chuyên gia tư vấn',
    part_of_speech = 'n',
    updated_at = NOW()
WHERE id = 10016
  AND (
      back_text LIKE '%từ vựng thuộc nhóm%'
      OR back_text LIKE '%đang cập nhật%'
      OR back_text REGEXP '^[[:space:]]*(ad|adv|adj|n|v)\\.?[[:space:]]*$'
  );
```

### 2.2. Pattern 2: Idempotent INSERT (Thêm thẻ mới cho bộ gần ngưỡng)
Áp dụng cho Lô 1b (thêm 3 thẻ mới cho mỗi bộ 8, 9, 10).

```sql
-- Pattern INSERT an toàn, tránh trùng lặp:
-- Dùng INSERT INTO ... SELECT ... WHERE NOT EXISTS
-- Không hardcode ID để tránh xung đột AUTO_INCREMENT.
-- card_order tự động tính tiếp nối (MAX + 1).

INSERT INTO flashcards (
    deck_id,
    front_text,
    back_text,
    part_of_speech,
    phonetic,
    example_text,
    card_order,
    is_active,
    created_by,
    version,
    created_at,
    updated_at
)
SELECT
    8,
    'Six',
    'Số sáu',
    'n',
    '/sɪks/',
    'There are six eggs in the carton.',
    COALESCE((SELECT MAX(card_order) FROM flashcards f2 WHERE f2.deck_id = 8), 0) + 1,
    1,
    COALESCE((SELECT created_by FROM flashcards f3 WHERE f3.deck_id = 8 AND f3.created_by IS NOT NULL LIMIT 1), 2),
    1,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards f4
    WHERE f4.deck_id = 8
      AND LOWER(TRIM(f4.front_text)) = 'six'
      AND f4.deleted_at IS NULL
);
```

---

## 3. Phân Tích Rủi Ro Kỹ Thuật & Giải Pháp

| Rủi ro | Nguy cơ | Giải pháp kiểm soát |
| :--- | :--- | :--- |
| **Lệch ID tự tăng (AUTO_INCREMENT)** | DB dev và DB production có thể có ID hiện tại khác nhau; hardcode ID khi INSERT sẽ gây lỗi Duplicate Key hoặc đè thẻ khác. | **Không hardcode ID khi INSERT.** Để MySQL tự cấp phát qua `AUTO_INCREMENT`. Mọi liên kết tham chiếu theo `(deck_id, front_text)`. |
| **Xung đột sửa đổi (Overwrite Conflict)** | Thẻ đã được giáo viên/admin cập nhật nghĩa tốt hơn từ trước bị migration đè lại bằng nghĩa máy dịch. | **Mệnh đề WHERE bảo vệ**: Chỉ cập nhật khi `back_text` khớp pattern placeholder (`từ vựng thuộc nhóm...` hoặc `đang cập nhật`). |
| **Xung đột thứ tự thẻ (card_order)** | Thẻ mới bị trùng số thứ tự với thẻ có sẵn trong giao diện học. | Sử dụng subquery `COALESCE(MAX(card_order), 0) + 1` theo từng lệnh INSERT. |
| **Kích thước file migration quá lớn** | 704 thẻ Lô 2 trong một file migration SQL duy nhất có thể gây timeout hoặc khó review / rollback. | **Chia nhỏ migration**: <br>- `V58__add_missing_cards_batch1b.sql` (9 thẻ)<br>- `V59__update_toeic_batch2_part1.sql` (352 thẻ)<br>- `V60__update_toeic_batch2_part2.sql` (352 thẻ) |
| **Mã hóa ký tự tiếng Việt** | Ký tự tiếng Việt có dấu bị lỗi font / mojibake khi Flyway thực thi trên hệ điều hành khác nhau. | File migration phải lưu định dạng **UTF-8 without BOM**. Cấu hình Flyway datasource với tham số `characterEncoding=UTF-8&useUnicode=true`. |

---

## 4. Quy Trình Kiểm Chứng Hai Môi Trường

### 4.1. Môi trường A: Database Trống (Clean DB / CI/CD Pipeline)
1. Khởi động DB MySQL sạch hoặc schema test trống:
   ```bash
   mvn clean flyway:clean flyway:migrate
   ```
2. Xác nhận toàn bộ migration từ V1 đến V60+ thành công không lỗi:
   ```sql
   SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;
   ```
3. Chạy test hồi quy kiểm tra bộ lọc:
   ```bash
   mvn test -Dtest=DeckTestServiceTest,DeckTestQuestionGeneratorTest,DeckTestIntegrationTest
   ```
4. Kiểm tra số thẻ hợp lệ của các bộ thẻ mục tiêu:
   ```sql
   -- Xác nhận Decks 8, 9, 10 có 8 thẻ
   SELECT deck_id, count(*) FROM flashcards WHERE deck_id IN (8, 9, 10) AND is_active = 1 GROUP BY deck_id;
   ```

### 4.2. Môi trường B: Database Hiện Tại (Existing Dev/Production DB)
1. **Tạo snapshot sao lưu bảng trước khi chạy migration**:
   ```sql
   CREATE TABLE flashcards_backup_pre_v58 AS SELECT * FROM flashcards;
   ```
2. Thực thi migration:
   ```bash
   mvn flyway:migrate
   ```
3. Xác minh tính Idempotent:
   - Chạy lại lệnh migrate hoặc gọi lại các câu lệnh SQL mẫu:
   - Kết quả trả về phải là `0 rows affected` (không thay đổi gì thêm).
4. Kiểm tra API live:
   - Gọi `GET /api/v1/deck-tests/8/status` -> `isEligible = true`, `validCardsCount = 8`.
   - Gọi `GET /api/v1/deck-tests/1001/status` -> `validCardsCount = 8`.

---

## 5. Kế Hoạch Rollback & Khôi Phục Thảm Họa (DR)

Nếu cần rollback:
1. Đối với INSERT (Lô 1b):
   ```sql
   DELETE FROM flashcards
   WHERE deck_id IN (8, 9, 10)
     AND front_text IN ('Six', 'Seven', 'Eight', 'Grandfather', 'Grandmother', 'Child', 'Egg', 'Fish', 'Vegetable')
     AND created_at >= '<migration_timestamp>';
   ```
2. Đối với UPDATE (Lô 2):
   Khôi phục từ bảng snapshot:
   ```sql
   UPDATE flashcards f
   JOIN flashcards_backup_pre_v58 b ON f.id = b.id
   SET f.back_text = b.back_text, f.part_of_speech = b.part_of_speech, f.updated_at = b.updated_at;
   ```
