# Thiết Kế Migration Flyway Cho Bài Thi Theo Chủ Đề (V58+)

> **Trạng thái tài liệu:** Tài liệu thiết kế kỹ thuật (Design Doc only). **Chưa** tạo migration SQL cho đến khi người dùng phê duyệt các bản nháp CSV.

---

## 1. Bối Cảnh & Mục Tiêu

### 1.1. Bối cảnh
- Hệ thống Bài thi theo chủ đề (Topic-based Tests) yêu cầu mỗi bộ thẻ phải có tối thiểu **8 thẻ hợp lệ** (không phải placeholder rác, có nghĩa và từ loại hợp lệ theo `DeckCardFilter`).
- Hiện tại:
  - **Lô 1 (Đã áp dụng live)**: 4 bộ TOEIC gần ngưỡng (1001, 1010, 1016, 1020) với 11 thẻ đã được chuẩn hóa trong DB dev.
  - **Lô 1b (Đã áp dụng live trên dev)**: 3 bộ từ vựng cơ bản gần ngưỡng (Bộ 8 Numbers, Bộ 9 Family, Bộ 10 Food) đã chèn thành công 9 thẻ mới (`Six`, `Seven`, `Eight`, `Grandfather`, `Grandmother`, `Child`, `Egg`, `Fish`, `Vegetable`), đưa cả 3 bộ đạt 8/8 thẻ hợp lệ.
  - **Lô 2 (Đang chờ duyệt)**: 88 bộ TOEIC Oxford hiện có 0 thẻ hợp lệ (toàn bộ là placeholder) -> Cần **UPDATE 704 thẻ** (8 thẻ/bộ).

### 1.2. Mục tiêu
- Khi người dùng chính thức phê duyệt các bản nháp (Lô 1b và Lô 2), các thay đổi dữ liệu sẽ được đóng gói thành các phiên bản Flyway migration (V58+).
- Đảm bảo migration:
  1. An toàn tuyệt đối: Không xóa dữ liệu, không đè lên thẻ đã được người dùng/admin biên tập thủ công.
  2. Idempotent: Chạy lại nhiều lần không sinh dữ liệu trùng lặp.
  3. Hoạt động hoàn hảo trên cả **Database trống (Clean DB)** và **Database hiện có (Existing DB)**.

---

## 2. Quy Tắc & Mẫu SQL Migration Chuẩn (Khớp theo deck_code và front_text)

> [!IMPORTANT]
> **Nguyên tắc cốt lõi:** Tuyệt đối **KHÔNG** dùng `id` của thẻ (`flashcards.id`) hay `id` của bộ thẻ (`decks.id`) làm khóa định danh trong migration. ID tự tăng (`AUTO_INCREMENT`) có thể khác biệt giữa DB máy cá nhân, staging, và production (do thứ tự import, seed, hoặc các lần thử nghiệm trước đó). Thay vào đó, toàn bộ lệnh `UPDATE` và `INSERT` phải khớp qua cặp định danh nghiệp vụ bất biến: **`(deck_code, front_text)`**.

### 2.1. Pattern 1: Conditional UPDATE qua (deck_code, front_text)
Áp dụng cho Lô 2 (chuẩn hóa nghĩa của các thẻ placeholder có sẵn).

```sql
-- Pattern UPDATE an toàn theo (deck_code, front_text):
-- Khớp thẻ qua mã bộ thẻ nghiệp vụ (decks.code) và từ vựng tiếng Anh (flashcards.front_text).
-- Chỉ cập nhật nếu thẻ đang là placeholder theo định nghĩa DeckCardFilter.
-- Nếu thẻ đã được người dùng/admin sửa trước đó (nghĩa hợp lệ), giữ nguyên, không đè.

UPDATE flashcards f
JOIN decks d ON f.deck_id = d.id
SET
    f.back_text = 'Nhà tư vấn, chuyên gia tư vấn',
    f.part_of_speech = 'n',
    f.updated_at = NOW()
WHERE d.code = 'OXFORD-5000-TOEIC-L2-01'
  AND LOWER(TRIM(f.front_text)) = 'consultant'
  AND (
      f.back_text LIKE '%từ vựng thuộc nhóm%'
      OR f.back_text LIKE '%đang cập nhật%'
      OR f.back_text REGEXP '^[[:space:]]*(ad|adv|adj|n|v)\\.?[[:space:]]*$'
  );
```

### 2.2. Pattern 2: Idempotent INSERT qua (deck_code, front_text)
Áp dụng cho Lô 1b (thêm 3 thẻ mới cho mỗi bộ 8 Numbers, 9 Family, 10 Food).

```sql
-- Pattern INSERT an toàn theo (deck_code, front_text):
-- Tìm deck_id tự động qua decks.code ('DECK-NUMBERS').
-- Không hardcode ID thẻ; để MySQL tự cấp phát qua AUTO_INCREMENT.
-- card_order tự động tính tiếp nối (MAX + 1) theo từng deck.
-- Idempotent: Kiểm tra NOT EXISTS theo (d.id, front_text).

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
    d.id,
    'Six',
    'Số sáu',
    'n',
    '/sɪks/',
    'There are six eggs in the carton.',
    COALESCE((SELECT MAX(f2.card_order) FROM flashcards f2 WHERE f2.deck_id = d.id), 0) + 1,
    1,
    COALESCE((SELECT f3.created_by FROM flashcards f3 WHERE f3.deck_id = d.id AND f3.created_by IS NOT NULL LIMIT 1), 2),
    1,
    NOW(),
    NOW()
FROM decks d
WHERE d.code = 'DECK-NUMBERS'
  AND NOT EXISTS (
      SELECT 1 FROM flashcards f4
      WHERE f4.deck_id = d.id
        AND LOWER(TRIM(f4.front_text)) = 'six'
        AND f4.deleted_at IS NULL
  );
```

---

## 3. Phân Tích Rủi Ro Kỹ Thuật & Giải Pháp

| Rủi ro | Nguy cơ | Giải pháp kiểm soát |
| :--- | :--- | :--- |
| **Lệch ID tự tăng (AUTO_INCREMENT) giữa các môi trường** | DB dev, staging và production có ID thẻ và ID bộ thẻ khác nhau do sequence tự tăng. Hardcode `id` sẽ gây lỗi Foreign Key, Duplicate Key hoặc cập nhật nhầm thẻ của bộ khác! | **Khớp 100% qua `(decks.code, flashcards.front_text)`.** Để MySQL tự cấp phát `flashcards.id`. Truy vấn `d.id` qua `WHERE d.code = ...`. |
| **Trùng lặp hoặc thiếu deck_code** | Mã bộ thẻ không đồng nhất giữa các môi trường dẫn đến lệnh UPDATE/INSERT không khớp dòng nào. | **Quy trình kiểm tra tính duy nhất trước khi migrate**: Chạy script kiểm tra `SELECT code, count(*) FROM decks GROUP BY code HAVING count(*) > 1` (đảm bảo `code` là duy nhất). |
| **Xung đột sửa đổi (Overwrite Conflict)** | Thẻ đã được giáo viên/admin cập nhật nghĩa tốt hơn từ trước bị migration đè lại bằng nghĩa máy dịch. | **Mệnh đề WHERE bảo vệ**: Chỉ cập nhật khi `back_text` khớp pattern placeholder (`từ vựng thuộc nhóm...` hoặc `đang cập nhật`). |
| **Xung đột thứ tự thẻ (card_order)** | Thẻ mới bị trùng số thứ tự với thẻ có sẵn trong giao diện học. | Sử dụng subquery `COALESCE(MAX(f2.card_order) FROM flashcards f2 WHERE f2.deck_id = d.id, 0) + 1` theo từng lệnh INSERT. |
| **Kích thước file migration quá lớn** | 704 thẻ Lô 2 trong một file migration SQL duy nhất có thể gây timeout hoặc khó review / rollback. | **Chia nhỏ migration**: <br>- `V58__add_missing_cards_batch1b.sql` (9 thẻ)<br>- `V59__update_toeic_batch2_part1.sql` (352 thẻ)<br>- `V60__update_toeic_batch2_part2.sql` (352 thẻ) |
| **Mã hóa ký tự tiếng Việt** | Ký tự tiếng Việt có dấu bị lỗi font / mojibake khi Flyway thực thi trên hệ điều hành khác nhau. | File migration phải lưu định dạng **UTF-8 without BOM**. Cấu hình Flyway datasource với tham số `characterEncoding=UTF-8&useUnicode=true`. |

---

## 4. Quy Trình Kiểm Chứng Hai Môi Trường

### 4.1. Kiểm Tra Tính Hợp Lệ Dữ Liệu Trước Khi Migrate (Pre-check)
1. **Kiểm tra tính duy nhất của mã bộ thẻ (`decks.code`)**:
   ```sql
   SELECT code, count(*) FROM decks GROUP BY code HAVING count(*) > 1;
   ```
   *Yêu cầu:* Phải trả về 0 dòng (mỗi bộ thẻ chỉ có duy nhất một `code`).
2. **Kiểm tra tính tồn tại của các bộ thẻ mục tiêu**:
   ```sql
   SELECT code, title FROM decks WHERE code IN ('DECK-NUMBERS', 'DECK-FAMILY', 'DECK-FOOD');
   ```
   *Yêu cầu:* Đủ 3 bộ.
3. **Kiểm tra tính duy nhất của cặp `(deck_code, front_text)`**:
   ```sql
   SELECT d.code, f.front_text, count(*)
   FROM flashcards f
   JOIN decks d ON f.deck_id = d.id
   WHERE f.deleted_at IS NULL
   GROUP BY d.code, LOWER(TRIM(f.front_text))
   HAVING count(*) > 1;
   ```

### 4.2. Môi trường A: Database Trống (Clean DB / CI/CD Pipeline)
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
   SELECT d.code, count(*)
   FROM flashcards f
   JOIN decks d ON f.deck_id = d.id
   WHERE d.code IN ('DECK-NUMBERS', 'DECK-FAMILY', 'DECK-FOOD') AND f.is_active = 1
   GROUP BY d.code;
   ```

### 4.3. Môi trường B: Database Hiện Tại (Existing Dev/Production DB)
1. **Tạo snapshot sao lưu bảng trước khi chạy migration**:
   ```sql
   CREATE TABLE flashcards_backup_pre_v58 AS SELECT * FROM flashcards;
   ```
2. Thực thi migration:
   ```bash
   mvn flyway:migrate
   ```
3. Xác minh tính Idempotent:
   - Chạy lại lệnh migrate:
   - Kết quả trả về phải là `0 rows affected` / `Schema is up to date`.
4. Kiểm tra API live:
   - Gọi `GET /api/v1/deck-tests/8/status` -> `eligible = true`, `totalValidCards = 8`.
   - Gọi `GET /api/v1/deck-tests/1001/status` -> `totalValidCards = 8`.

---

## 5. Kế Hoạch Rollback & Khôi Phục Thảm Họa (DR)

Nếu cần rollback:
1. Đối với INSERT (Lô 1b):
   ```sql
   DELETE f FROM flashcards f
   JOIN decks d ON f.deck_id = d.id
   WHERE d.code IN ('DECK-NUMBERS', 'DECK-FAMILY', 'DECK-FOOD')
     AND f.front_text IN ('Six', 'Seven', 'Eight', 'Grandfather', 'Grandmother', 'Child', 'Egg', 'Fish', 'Vegetable')
     AND f.created_at >= '<migration_timestamp>';
   ```
2. Đối với UPDATE (Lô 2):
   Khôi phục từ bảng snapshot:
   ```sql
   UPDATE flashcards f
   JOIN flashcards_backup_pre_v58 b ON f.id = b.id
   SET f.back_text = b.back_text, f.part_of_speech = b.part_of_speech, f.updated_at = b.updated_at;
   ```
