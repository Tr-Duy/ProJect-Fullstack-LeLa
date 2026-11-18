# Hướng Dẫn Triển Khai Production (Production Deployment Guide)

Tài liệu này mô tả các yêu cầu cấu hình, các biến môi trường bắt buộc, và cơ chế bảo vệ tài khoản quản trị/seed khi triển khai hệ thống LeLa lên môi trường Production.

---

## 1. Biến Môi Trường Bắt Buộc (Required Environment Variables)

Khi khởi chạy backend với profile production (`-Dspring.profiles.active=prod` hoặc `SPRING_PROFILES_ACTIVE=prod`), các biến môi trường sau **bắt buộc** phải được cấu hình đầy đủ:

| Tên biến | Kiểu dữ liệu | Ý nghĩa & Mô tả |
| :--- | :--- | :--- |
| `YOEDU_DB_URL` | String (JDBC URL) | Chuỗi kết nối JDBC tới cơ sở dữ liệu MySQL production (ví dụ: `jdbc:mysql://db.production.local:3306/lela_prod?useSSL=true&serverTimezone=UTC`). |
| `YOEDU_DB_USER` | String | Tên người dùng cơ sở dữ liệu MySQL trên production. |
| `YOEDU_DB_PASSWORD` | String | Mật khẩu truy cập cơ sở dữ liệu MySQL trên production. |
| `YOEDU_JWT_SECRET` | String | Khóa bí mật dùng để ký và giải mã JSON Web Token (JWT). Phải có độ dài và entropy cao (tối thiểu 32 ký tự / 256-bit). |
| `FRONTEND_URL` | String (URL) | URL của ứng dụng Frontend (Next.js / React) phục vụ thiết lập CORS whitelist (ví dụ: `https://lela.edu.vn`). |
| `ADMIN_INITIAL_PASSWORD` | String | Mật khẩu khởi tạo cho tài khoản quản trị viên (`admin`) khi hệ thống khởi động lần đầu trên DB có sẵn seed V31. **Độ dài tối thiểu 12 ký tự**. |

---

## 2. Cơ Chế Bảo Vệ Tài Khoản Seed Trên Production (`ProductionSeedAccountSecurityRunner`)

Để loại bỏ hoàn toàn rủi ro an ninh từ các tài khoản thử nghiệm tạo sẵn trong các bản migration Flyway (đặc biệt là `V31__seed_demo_users.sql` với mật khẩu mặc định `123456`), hệ thống tích hợp `ProductionSeedAccountSecurityRunner` (chỉ chạy duy nhất tại profile `prod`).

### 2.1. Tài khoản Quản trị (`admin`)
- Khi backend production khởi động, runner kiểm tra xem tài khoản `admin` có đang mang mật khẩu mặc định (`123456`) hay không.
- **Trường hợp hợp lệ**:
  - Nếu `ADMIN_INITIAL_PASSWORD` được cung cấp và có độ dài $\ge 12$ ký tự, hệ thống sẽ tự động băm (BCrypt) và cập nhật mật khẩu mới cho `admin`, đồng thời duy trì trạng thái `ACTIVE`.
- **Trường hợp vi phạm / Thiếu cấu hình**:
  - Nếu `ADMIN_INITIAL_PASSWORD` bị bỏ trống, hoặc có độ dài **dưới 12 ký tự**:
    - Hệ thống lập tức ghi nhật ký cảnh báo `log.error`: `"Production security: ADMIN_INITIAL_PASSWORD must be at least 12 characters long. Provided length: ... Admin account remains deactivated."`
    - Tài khoản `admin` bị chuyển sang trạng thái `DEACTIVATED`.
    - `password_hash` bị ghi đè bằng chuỗi không thể đảo ngược (`DISABLED_<UUID>`).
    - **Hậu quả**: Không ai có thể đăng nhập bằng tài khoản `admin` cho tới khi quản trị viên hệ thống can thiệp cập nhật trực tiếp trong cơ sở dữ liệu.

### 2.2. Tài khoản Học viên Seed (`learner1`, `learner2`)
- Runner kiểm tra mật khẩu hiện tại của `learner1` và `learner2`.
- **Nếu tài khoản vẫn dùng mật khẩu mặc định `123456`**:
  - Tự động bị khóa (`status = DEACTIVATED`) và xáo trộn password hash (`DISABLED_<UUID>`), ghi nhận `log.warn`.
- **Nếu tài khoản đã được đổi mật khẩu riêng (khác `123456`)**:
  - Hệ thống tôn trọng dữ liệu của người dùng, giữ nguyên trạng thái hoạt động (`ACTIVE`) và không can thiệp.

---

## 3. Khởi Chạy Production (Production Startup Command)

Ví dụ câu lệnh chạy Docker container hoặc Java application trên máy chủ:

```bash
export SPRING_PROFILES_ACTIVE=prod
export YOEDU_DB_URL="jdbc:mysql://mysql-server:3306/lela_prod?useSSL=true&characterEncoding=UTF-8"
export YOEDU_DB_USER="lela_app_user"
export YOEDU_DB_PASSWORD="StrongProductionDbPassword_2026!"
export YOEDU_JWT_SECRET="SuperSecureJwtSecretKeyWithHighEntropyAtLeast256Bits_2026!"
export FRONTEND_URL="https://lela.edu.vn"
export ADMIN_INITIAL_PASSWORD="AdminInitialStrongPassword@2026!"

java -jar app.jar
```
