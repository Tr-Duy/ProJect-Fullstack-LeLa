# Kế Hoạch Xử Lý Làm Sạch Dữ Liệu 34 Thẻ Có Hậu Tố "(a.)" Trong front_text

> [!NOTE]
> Tài liệu này chỉ phác thảo kế hoạch và phân tích kỹ thuật. **Tuyệt đối KHÔNG áp dụng trực tiếp vào cơ sở dữ liệu** khi chưa có sự xác nhận và phê duyệt chính thức.

---

## 1. Hiện Trạng Khảo Sát
Qua truy vấn thực tế trên cơ sở dữ liệu `flashcards` (`is_active = 1 AND deleted_at IS NULL AND front_text LIKE '%(%)%'`):
- Có đúng **34 thẻ đang hoạt động** thuộc các bộ TOEIC 22–36 mang hậu tố `(a.)` trong cột `front_text`.
- Toàn bộ 34 thẻ này khi seed trước đây đều bị gán giá trị cột `part_of_speech` là `'phr'`.
- Tình trạng này gây rò rỉ gợi ý loại từ trên giao diện học tập và giao diện thi chủ đề.

---

## 2. Kết Quả Chạy Thử Nghiệm Dry-Run (`scripts/dry_run_pos_front_text_cleanup.py`)

Chạy script dry-run đối chiếu với từng bộ thẻ tương ứng:
- **Nguy cơ trùng lặp từ sau khi bỏ `(a.)`**: **0 thẻ bị trùng (100% an toàn)**. Không có bất kỳ thẻ nào trong cùng bộ chứa từ trùng sau khi loại bỏ hậu tố.
- **Phân loại từ đề xuất (`proposed_part_of_speech`)**:
  - **Cụm từ (`phr`)**:
    - ID 939: `Out of (a.)` $\rightarrow$ `Out of` (`phr`)
    - ID 1018: `On track (a.)` $\rightarrow$ `On track` (`phr`)
    - ID 1101: `On hand (a.)` $\rightarrow$ `On hand` (`phr`)
  - **Trạng từ (`adv`)**:
    - ID 1003: `Constantly (a.)` $\rightarrow$ `Constantly` (`adv`)
  - **Danh từ (`n`)**:
    - ID 1094: `Catalog (a.)` $\rightarrow$ `Catalog` (`n`)
  - **Tính từ (`adj`)**: 29 thẻ còn lại (như `Overcrowded`, `Compatible`, `Affordable`, `Durable`, `Physical`, `Casual`, `Outdated`, `Verbal`, `Sharp`, `Technical`, `Complicated`, `Express`, `Registered`, `Abundant`, `Commensurate`, `Time-consuming`, `Loyal`, `Obvious`, `Productive`, `Mandatory`, `Strict`, `Diverse`, `Essential`, `Everyday`, `Smooth`, `Accurate`, `Integral`, `Sufficient`, `Efficient`).

---

## 3. Quy Trình Thực Hiện Đề Xuất (Khi Được Phê Duyệt)

1. **Bước 1 — Tạo bản sao lưu bảng `flashcards`**:
   ```sql
   CREATE TABLE flashcards_backup_pos_cleanup_YYYYMMDD AS SELECT * FROM flashcards;
   ```
2. **Bước 2 — Thực thi migration hoặc script có kiểm soát**:
   - Sử dụng lệnh `REGEXP_REPLACE` hoặc cập nhật có chỉ định từng ID.
   - Cập nhật đồng thời `front_text` và `part_of_speech`.
3. **Bước 3 — Xác minh Idempotency và Integrity**:
   - Kiểm tra `COUNT(*)` các thẻ còn chứa dấu ngoặc trong `front_text` = 0.
   - Kiểm tra các bộ 22–36 không phát sinh trùng lặp `(deck_id, LOWER(TRIM(front_text)))`.
   - Chạy đề thi thử nghiệm và kiểm chứng giao diện thi.
