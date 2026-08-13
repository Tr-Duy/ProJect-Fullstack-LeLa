# Kế hoạch công việc tiếp theo - Thành viên A (Backend: Auth/Core)

Dựa trên tiến độ hiện tại, phần lớn các Entity cơ bản của Domain Auth/Core (`Users`, `Role`, `Language`, `SubscriptionPlan`, `UserRoleAssignment`, `RefreshTokenSession`) đã được tạo. Bước tiếp theo sẽ tập trung vào luồng xác thực (Authentication) và phân quyền (Authorization).

Dưới đây là chi tiết các công việc bạn cần làm:

## 1. Xây dựng API Contract & `AuthController`
Tạo REST Controller chuyên biệt để xử lý các nghiệp vụ đăng nhập, đăng ký và quản lý phiên.
* **`POST /api/auth/register`**: Tạo tài khoản người dùng mới.
  - Nhận DTO `RegisterRequest` (username, email, password, fullName).
  - Băm mật khẩu bằng `BCryptPasswordEncoder`.
  - Gán Role mặc định (VD: `USER`) qua bảng `UserRoleAssignment`.
* **`POST /api/auth/login`**: Xử lý đăng nhập.
  - Nhận DTO `LoginRequest` (username/email, password).
  - Xác thực thông tin qua Spring Security (`AuthenticationManager`).
  - Gọi `JwtService` để sinh `AccessToken` (thời gian sống ngắn).
  - Sinh `RefreshToken` (thời gian sống dài) và lưu vào bảng `RefreshTokenSession`.
  - Trả về DTO `AuthResponse` (access token, refresh token, thông tin cơ bản của user).
* **`POST /api/auth/refresh-token`**: Cấp lại Access Token.
  - Nhận `RefreshToken` từ request.
  - Kiểm tra tính hợp lệ và thời hạn trong cơ sở dữ liệu (`RefreshTokenSession`).
  - Sinh `AccessToken` mới và trả về.
* **`POST /api/auth/logout`**: Xử lý đăng xuất.
  - Xóa hoặc vô hiệu hóa bản ghi `RefreshTokenSession` tương ứng với token hiện tại để chặn việc xin cấp lại.

## 2. Hoàn thiện Logic Xác thực & Security Configuration
* **Tích hợp Password Encoder**: Định nghĩa `@Bean PasswordEncoder` trong `SecurityConfig`.
* **Tùy chỉnh `UserDetailsService`**:
  - Implement interface `UserDetailsService` để load thông tin người dùng từ `UsersRepository` phục vụ cho việc kiểm tra thông tin đăng nhập của Spring Security.
* **Cấu hình lại `SecurityConfig.java`**:
  - Tắt CSRF (không cần thiết đối với API stateless dùng JWT).
  - Mở khóa (permit all) cho các route `/api/auth/**` và các route giao diện Swagger.
  - Yêu cầu xác thực (authenticated) cho các request nghiệp vụ còn lại.
  - Cấu hình Filter Chain để chèn `JwtAuthenticationFilter` chạy trước bộ lọc mặc định của Spring.

## 3. Hoàn thiện Logic Phân quyền (RBAC)
* **Thiết lập Granted Authorities**: Khi load thông tin user từ `UserDetailsService`, cần truy vấn cả danh sách các Role (từ bảng `UserRoleAssignment` & `Role`) và chuyển đổi chúng thành các `SimpleGrantedAuthority`.
* **Bảo vệ API (Method Security)**: 
  - Bật tính năng `@EnableMethodSecurity` trong cấu hình Spring.
  - Bắt đầu áp dụng các annotation như `@PreAuthorize("hasRole('ADMIN')")` lên các API cần phân quyền gắt gao (ví dụ: các API CRUD xóa/sửa dữ liệu dùng chung trong các Controller khác).

## 4. Viết Test Cases (Tối thiểu 8 Cases theo yêu cầu đồ án)
Sử dụng `MockMvc` kết hợp JUnit 5/Mockito để đảm bảo luồng Auth hoạt động bảo mật, không có lỗ hổng:
* [ ] **Case 1**: Đăng ký tài khoản thành công.
* [ ] **Case 2**: Đăng ký thất bại do email/username bị trùng lặp.
* [ ] **Case 3**: Đăng nhập thành công, trả về đúng định dạng token.
* [ ] **Case 4**: Đăng nhập thất bại do sai mật khẩu.
* [ ] **Case 5**: Refresh token thành công, sinh ra Access Token hợp lệ.
* [ ] **Case 6**: Refresh token thất bại do token đã quá hạn sử dụng.
* [ ] **Case 7**: Gọi API được bảo vệ (ví dụ: lấy thông tin profile) với Access Token hợp lệ -> Trả về 200 OK.
* [ ] **Case 8**: Gọi API được bảo vệ khi không có token -> Trả về lỗi 401 Unauthorized.
* [ ] **Case 9**: Gọi API yêu cầu quyền ADMIN với token của một user thường -> Trả về lỗi 403 Forbidden.

## 5. Cập nhật Swagger/OpenAPI
* Thêm component bảo mật cho OpenAPI để giao diện Swagger UI hiển thị nút **"Authorize"** (cho phép người test nhập Bearer Token).
* Viết rõ `@Operation` và các `@ApiResponse` (như lỗi 400, 401, 403) trong code của `AuthController` để người làm Frontend (Thành viên B, C, D) hiểu rõ API Contract.
