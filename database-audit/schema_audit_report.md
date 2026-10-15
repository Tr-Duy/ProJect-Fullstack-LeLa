# BÁO CÁO KIỂM TOÁN CƠ SỞ DỮ LIỆU & ĐỐI SOÁT KIẾN TRÚC LELA PLATFORM
## (DATABASE SCHEMA & BACKEND JPA AUDIT REPORT)

> **Dự án**: Nền tảng học thông minh LeLa (LeLa Fullstack Learning Platform)  
> **Cơ sở dữ liệu đích**: MySQL 8.x (`ENGINE=InnoDB`, `DEFAULT CHARSET=utf8mb4`, `COLLATE=utf8mb4_unicode_ci`)  
> **Framework Backend**: Java 21, Spring Boot 3.x, Hibernate 6 / Spring Data JPA  
> **Công cụ Migration**: Flyway Migration Engine  
> **Ngày thực hiện kiểm toán**: 12/10/2026  
> **Kiểm toán viên**: Senior Database Architect & Backend Database Auditor  

---

## 1. TỔNG QUAN CHỈ SỐ HỆ THỐNG (AUDIT EXECUTIVE SUMMARY)

Qua quá trình rà soát toàn diện đệ quy toàn bộ workspace (bao gồm 46 migration SQL, 34 lớp Entity JPA, các cấu hình Spring Boot `application.yaml` và repository queries):

1. **Tổng số bảng cơ sở dữ liệu cuối cùng**: **38 bảng**.
2. **Tổng số lớp JPA Entity đã phát hiện**: **34 lớp Entity**.
3. **Tổng số tập tin Migration**: **46 tập tin** (`V1` đến `V46`).
4. **Phiên bản Migration cuối cùng tìm thấy**: **V46** (`V46__add_comprehensive_performance_indexes.sql`).
5. **Tổng số Khóa chính (Primary Keys)**: **38 PK** (35 PK đơn Auto-increment, 3 PK phức hợp Composite Key).
6. **Tổng số Khóa ngoại (Foreign Keys)**: **64 FK Constraints** (tất cả đều có bảng đích xác định).
7. **Tổng số Ràng buộc Duy nhất (Unique Constraints / Unique Keys)**: **28 Unique Constraints**.
8. **Tổng số Chỉ mục độc lập (Standalone Performance Indexes)**: **45 Indexes** (bao gồm 37 index gốc từ V1 và 8 index bổ sung từ V10, V44, V46).
9. **Tổng số Ràng buộc Kiểm tra (Check Constraints)**: **57 Check Constraints** (bảo vệ miền giá trị enum, số dương, quan hệ ngày tháng).
10. **Đối tượng Database ngoài bảng (View, Trigger, Procedure, Function, Event)**: **0**. Hệ thống không sử dụng View hay Stored Procedure, toàn bộ nghiệp vụ được xử lý ở Service Layer Spring Boot.

---

## 2. MA TRẬN ĐỐI SOÁT MIGRATION VÀ ENTITY/MODEL

### 2.1. Chiều A — Từ Migration sang Entity

| Bảng Migration | Trạng thái ánh xạ Entity | Chi tiết sai lệch & Ghi chú kỹ thuật | Nhãn kiểm toán |
|:---|:---|:---|:---:|
| `deck_tags` | Có ánh xạ JPA (`Deck.tags`) | Bảng liên kết Many-to-Many giữa `decks` và `tags` được tạo tại V44. Trong code Java, bảng này được biểu diễn thông qua `@ManyToMany @JoinTable(name = "deck_tags")` bên trong `Deck.java` thay vì tạo lớp Entity riêng biệt. | `[ĐÃ XÁC MINH]` |
| `audit_logs` | Không có Entity tương ứng | Bảng hệ thống ghi log kiểm toán bảo mật do V1 khởi tạo. Không có model Java tương ứng trong source code. Chưa có service Java ghi dữ liệu vào bảng này. | `[KHÔNG CÓ TRONG ENTITY]` |
| `idempotency_records` | Không có Entity tương ứng | Bảng hệ thống lưu trữ idempotency key cho các API tài chính/giao dịch. Hiện chưa có class Entity tương ứng trong JPA context. | `[KHÔNG CÓ TRONG ENTITY]` |
| `outbox_events` | Không có Entity tương ứng | Bảng hỗ trợ mô hình Transactional Outbox Pattern cho event-driven messaging. Hiện chưa có entity JPA. | `[KHÔNG CÓ TRONG ENTITY]` |
| `payments.expires_at` | Entity `Payment.java` thiếu | Migration V26 đã thêm cột `expires_at DATETIME(6)` phục vụ hết hạn đơn SePay, tuy nhiên lớp `Payment.java` chưa khai báo trường `private LocalDateTime expiresAt`. | `[CẢNH BÁO LỆCH KHỚP]` |
| `flashcards.related_words` | Entity `Flashcard.java` thiếu | Migration V45 bổ sung `related_words VARCHAR(500)`, trong khi `Flashcard.java` chỉ mới cập nhật `partOfSpeech`, `definition`, `exampleTranslation` mà quên khai báo trường `relatedWords`. | `[CẢNH BÁO LỆCH KHỚP]` |
| `flashcards.card_color` | Entity `Flashcard.java` thiếu | Migration V8 bổ sung `card_color VARCHAR(50)` cho flashcard, nhưng Entity `Flashcard.java` không có trường tương ứng. | `[CẢNH BÁO LỆCH KHỚP]` |
| `tags.description` | Entity `Tag.java` thiếu | Migration V44 bổ sung `description VARCHAR(500)` cho bảng `tags`, tuy nhiên Entity `Tag.java` chỉ có `id`, `name`, `slug`, `isActive`. | `[CẢNH BÁO LỆCH KHỚP]` |
| `user_roles.assigned_by` | Entity `UserRoleAssignment` thiếu | Cột `assigned_by BIGINT` tồn tại trong Migration V1 nhưng Entity `UserRoleAssignment.java` chỉ ánh xạ `@EmbeddedId UserRoleAssignmentId (userId, roleId)` và `assignedAt`. | `[CẢNH BÁO LỆCH KHỚP]` |

### 2.2. Chiều B — Từ Entity sang Migration

| Entity Java | Thuộc tính Entity | Bảng & Cột Migration | Chi tiết sai lệch & Ghi chú | Nhãn kiểm toán |
|:---|:---|:---|:---|:---:|
| `Deck.java` | `deletedAt` (`LocalDateTime`) | `decks.deletedAt` | Cột `deleted_at` tồn tại từ V1. Đội ngũ phát triển đã chuyển sang dùng `is_active` ở V7, tuy nhiên trường `deletedAt` vẫn được giữ lại trong Entity `Deck.java` kèm comment "Cột cũ". | `[CẦN XÁC MINH]` |
| `Users.java` | `deletedAt` (`LocalDateTime`) | `users.deletedAt` | Tương tự bảng `decks`, cột `deleted_at` vẫn còn trong DB và Entity nhưng hệ thống đã dùng `status = 'SUSPENDED'` hoặc `'DEACTIVATED'`. | `[CẦN XÁC MINH]` |
| `DailyUserGoal.java` | Khóa chính `id` | `daily_user_goals.id` | Entity định nghĩa `@GeneratedValue(strategy = GenerationType.IDENTITY)`. Migration V30 khai báo `id BIGINT AUTO_INCREMENT PRIMARY KEY`. Khớp hoàn toàn. | `[ĐÃ XÁC MINH]` |
| `ChatConversation.java` | Khóa chính `id` | `chat_conversations.id`| Entity định nghĩa `@GeneratedValue(strategy = GenerationType.IDENTITY)`. Migration V25 khai báo `id BIGINT AUTO_INCREMENT PRIMARY KEY`. Khớp hoàn toàn. | `[ĐÃ XÁC MINH]` |

---

## 3. PHÂN TÍCH RỦI RO KIẾN TRÚC & CẢNH BÁO TIỀM ẨN

### 3.1. Rủi ro lệch khớp Schema và Hibernate Mapping (`ddl-auto: none`)
- Trong cấu hình `application.yaml`, Spring Boot được thiết lập:
  ```yaml
  spring:
    jpa:
      hibernate:
        ddl-auto: none
  ```
  Điều này hoàn toàn đúng đắn cho môi trường Production (ngăn Hibernate tự động sửa DB). Tuy nhiên, vì một số trường đã được bổ sung trong Migration (`payments.expires_at`, `flashcards.related_words`, `flashcards.card_color`, `tags.description`, `user_roles.assigned_by`) nhưng **chưa được khai báo trong Entity Java**, các truy vấn JPA / Hibernate khi gọi `save()` hoặc JPQL `SELECT` sẽ **hoàn toàn bỏ qua các cột này**, dẫn đến việc dữ liệu nghiệp vụ không thể đọc hoặc ghi từ tầng ứng dụng.

### 3.2. Rủi ro về Khóa ngoại vòng & Phụ thuộc lẫn nhau (Circular FK Risks)
- **`refresh_token_sessions` tự tham chiếu**: Cột `replaced_by_session_id` tham chiếu ngược lại chính bảng `refresh_token_sessions(id)`. Để đảm bảo an toàn tuyệt đối khi import schema, ràng buộc này được thiết lập `ON DELETE SET NULL`.
- **Quan hệ giữa `users` và `languages`**: `users.native_language_id` và `users.target_language_id` tham chiếu `languages(id)`. Bảng `languages` không tham chiếu ngược lại `users`. Do đó, `languages` phải luôn được tạo trước `users`.
- **Quan hệ giữa `users`, `exam_types`, và `proficiency_levels`**: 
  - `proficiency_levels` tham chiếu `exam_types(id)`.
  - `users` tham chiếu cả `exam_types(id)` và `proficiency_levels(id)`.
  - Cả hai khóa ngoại trên `users` đều có hành vi `ON DELETE SET NULL`, hoàn toàn triệt tiêu rủi ro deadlock hoặc lỗi phụ thuộc vòng khi cascade delete.

### 3.3. Tối ưu hóa hiệu năng & Đánh giá Index (Index Assessment)
- Migration V46 đã bổ sung các chỉ mục ghép (composite indexes) rất đắt giá:
  - `idx_decks_active_lvl_exam` trên `decks (is_active, level_id, exam_type_id)`: Tối ưu triệt để cho API lọc danh sách bài học theo trình độ học viên.
  - `idx_quizzes_cat_lvl_active` trên `quizzes (quiz_category, level_id, is_active)`: Tối ưu cho API lấy bài thi xếp lớp (Placement Test) và thi nâng bậc (Upgrade Test).
  - `idx_deck_tags_tag_id` và `idx_flashcard_tags_tag_id`: Hỗ trợ đảo ngược tìm kiếm thẻ/deck theo nhãn tag (Reverse Index lookup).
- **Khuyến nghị**: Trên bảng `srs_reviews`, do tần suất ghi dữ liệu cực lớn khi người học lật thẻ ôn tập liên tục, cần cân nhắc chiến lược đánh chỉ mục vừa đủ và định kỳ lưu trữ (archive/partitioning) dữ liệu `srs_reviews` cũ hơn 1 năm để tránh phình to kích thước bảng.

---

## 4. DANH SÁCH ĐỀ XUẤT CẢI THIỆN HỆ THỐNG (RECOMMENDATIONS)

*Lưu ý: Các đề xuất dưới đây được tách riêng độc lập, không làm thay đổi bản mô tả trạng thái hiện tại của cơ sở dữ liệu.*

1. **Cập nhật đồng bộ các lớp Java Entity**:
   - Thêm thuộc tính `private LocalDateTime expiresAt;` vào `Payment.java`.
   - Thêm thuộc tính `private String relatedWords;` vào `Flashcard.java`.
   - Thêm thuộc tính `private String cardColor;` vào `Flashcard.java`.
   - Thêm thuộc tính `private String description;` vào `Tag.java`.
   - Khai báo trường `@ManyToOne @JoinColumn(name = "assigned_by") private Users assignedBy;` vào `UserRoleAssignment.java`.
2. **Xây dựng Entity hoặc cơ chế xử lý cho 3 bảng hệ thống**:
   - Nếu dự án có kế hoạch triển khai kiến trúc Event-Driven, hãy tạo `OutboxEventEntity` và scheduler định kỳ quét `outbox_events`.
   - Nếu áp dụng cơ chế chống trùng lặp thanh toán qua Header `X-Idempotency-Key`, hãy tạo Interceptor/Filter ghi nhận vào bảng `idempotency_records`.
3. **Quản lý kích thước các Migration Seed Data**:
   - Các file `V34`, `V37`, `V38`, `V42`, `V43` chứa hàng triệu dòng dữ liệu từ vựng và câu hỏi trắc nghiệm (kích thước file từ 1MB đến 4MB). Nên tách dữ liệu nội dung từ vựng ra khỏi luồng migration cấu trúc, hoặc sử dụng công cụ nạp dữ liệu chuyên dụng (data ingestion pipeline) khi triển khai môi trường mới.
