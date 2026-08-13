# LeLa Backend (LeLa-BE)

## 📌 Giới thiệu dự án
LeLa là một nền tảng học tập ngôn ngữ ứng dụng các phương pháp khoa học vào việc ghi nhớ (như Spaced Repetition System - SRS) kết hợp với các yếu tố Gamification (Quizzes, Leaderboards, Thành tựu). 
Dự án Backend đóng vai trò cung cấp API an toàn, xử lý logic nghiệp vụ, quản lý dữ liệu người dùng, tiến độ học tập và hệ thống thanh toán.

## 🛠️ Công nghệ sử dụng
Backend được xây dựng theo kiến trúc monolithic hiện đại trên nền tảng Spring Boot.
- **Ngôn ngữ**: Java 21
- **Framework**: Spring Boot 3.5.15
- **Bảo mật**: Spring Security & JSON Web Token (JJWT 0.12.6)
- **Truy cập dữ liệu**: Spring Data JPA
- **Cơ sở dữ liệu**: MySQL 8.0
- **Database Migration**: Flyway
- **API Documentation**: Springdoc OpenAPI (Swagger UI 2.8.9)
- **Tiện ích**: Lombok, ModelMapper 3.2.6

---

## 🏗️ Kiến trúc & Modules chính

Dự án được chia thành các domain driven packages (thay vì layered architecture thuần túy), giúp đóng gói logic theo từng tính năng:

### 1. Hệ thống Auth & Users (`auth`, `users`, `role`)
- Sử dụng **JWT (JSON Web Token)** để xác thực. 
- Bao gồm phân quyền (Role-based access control) cho Admin và Learner.
- Quản lý phiên làm việc thông qua `refreshtokensession`.

### 2. Spaced Repetition System - Thuật toán SRS (`srsreview`)
Hệ thống ôn tập ngắt quãng (SRS) là trái tim của việc học từ vựng.
- **Thuật toán sử dụng**: **SM-2 Advanced** (SuperMemo-2 có cải tiến).
- **Cách thức hoạt động**:
  - Dựa trên phản hồi của người dùng (1 = AGAIN, 2 = HARD, 3 = GOOD, 4 = EASY), thuật toán sẽ tính toán `easeFactor` (độ dễ) và `intervalDays` (số ngày đến lần lặp tiếp theo).
  - **Fuzzing (Nhiễu ngẫu nhiên)**: Khi `intervalDays` > 4, hệ thống thêm một độ nhiễu (khoảng ±5%) để ngăn chặn tình trạng "clumping" (nhiều thẻ cùng đến hạn vào một ngày).
  - Quản lý trạng thái thẻ linh hoạt: `NEW` -> `LEARNING` -> `REVIEW`. Nếu sai thẻ ở trạng thái REVIEW (Lapse), thẻ sẽ quay về `LEARNING` để học lại nhưng `easeFactor` bị giảm (phạt).

### 3. Hệ thống Học tập & Thẻ bài (`deck`, `flashcard`, `cardprogress`)
- Quản lý bộ thẻ (Deck) và các thẻ (Flashcard).
- `deckenrollment`: Theo dõi việc người dùng tham gia học các bộ thẻ.
- `cardprogress`: Lưu trữ trạng thái và chỉ số (số lần học, rating gần nhất) của từng thẻ cho từng người dùng, là đầu vào cho thuật toán SRS.

### 4. Hệ thống Trắc nghiệm (`Quiz`, `QuizAttempt`, `QuizQuestion`)
- Cho phép tạo các bài Quiz với nhiều câu hỏi (`QuizQuestion`) và các lựa chọn (`QuizQuestionOption`).
- Theo dõi lịch sử làm bài của người dùng (`QuizAttempt`), chấm điểm và lưu trữ câu trả lời chi tiết để người dùng xem lại.

### 5. Gamification (`leaderboardsnapshot`, `achievement`)
- Tính toán và lưu trữ Snapshot của bảng xếp hạng.
- Khuyến khích người dùng học tập mỗi ngày (`dailylearningactivity`) và trao thưởng/thành tựu.

### 6. Thanh toán & Đăng ký (`payment`, `subscriptionplan`)
- Quản lý các gói đăng ký Premium.
- Tích hợp thanh toán linh hoạt thông qua module `payment`, hỗ trợ các Provider khác nhau, lưu vết giao dịch.

---

## 🚀 Hướng dẫn cài đặt và chạy dự án

### 1. Yêu cầu hệ thống
- JDK 21
- Maven 3.8+
- MySQL 8.0+

### 2. Cấu hình Database
Tạo database trong MySQL:
```sql
CREATE DATABASE lela_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Cấu hình file `src/main/resources/application.properties` hoặc `.env`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/lela_db
spring.datasource.username=root
spring.datasource.password=your_password
```

### 3. Chạy Database Migration
Dự án sử dụng **Flyway** để quản lý version của database. Khi khởi động ứng dụng, Flyway sẽ tự động chạy các file `.sql` trong `src/main/resources/db/migration` để tạo bảng và seed dữ liệu.

### 4. Khởi động ứng dụng
Chạy lệnh sau tại thư mục gốc của project (LeLa-BE):
```bash
# Bằng Maven Wrapper
./mvnw spring-boot:run
```

- **API Base URL**: `http://localhost:8080`
- **Swagger UI (Tài liệu API)**: `http://localhost:8080/swagger-ui.html`

---

## 📜 Coding Conventions & Rules
- Tuân thủ nguyên tắc SOLID.
- Trả về DTO thay vì Entity trực tiếp cho Client. Dùng `ModelMapper` để map dữ liệu.
- Xử lý lỗi tập trung thông qua `@RestControllerAdvice` (vd: `NotFoundException`).