# 🔑 HƯỚNG DẪN CẤU HÌNH GOOGLE OAUTH 2.0 CLIENT ID CHO LELA

Tài liệu này hướng dẫn chi tiết từng bước tạo và cấu hình **Google OAuth 2.0 Client ID** trên **Google Cloud Console** để tính năng **"Đăng nhập bằng Google"** hoạt động hoàn hảo trên ứng dụng LeLa (Localhost: 5173 / 8080).

---

## 📌 BƯỚC 1: TRUY CẬP GOOGLE CLOUD CONSOLE

1. Truy cập vào trang quản lý Google Cloud Credentials:  
   👉 **[https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)**
2. Đăng nhập bằng tài khoản Google của bạn.
3. Nếu chưa có Project, hãy chọn **"Select a project"** ở góc trên cùng → Bấm **"NEW PROJECT"** (Tạo dự án mới), đặt tên ví dụ: `LeLa-Fullstack-App` → Bấm **CREATE**.

---

## 📌 BƯỚC 2: CẤU HÌNH OAUTH CONSENT SCREEN (MÀN HÌNH XÁC THỰC)

*(Nếu bạn đã cấu hình OAuth Consent Screen trước đó, có thể bỏ qua bước này)*

1. Vào menu bên trái: **OAuth consent screen** (Màn hình đồng ý OAuth).
2. Chọn **User Type**: `External` (Bên ngoài) → Bấm **CREATE**.
3. Điền thông tin cơ bản:
   - **App name**: `LeLa Learning App`
   - **User support email**: Chọn email của bạn
   - **Developer contact information**: Nhập email của bạn
4. Bấm **SAVE AND CONTINUE** đến hết và hoàn tất.

---

## 📌 BƯỚC 3: TẠO OAUTH 2.0 CLIENT ID FOR WEB APPLICATION

1. Truy cập lại menu: **Credentials** (Thông tin xác thực).
2. Ở menu trên cùng, bấm **+ CREATE CREDENTIALS** → Chọn **OAuth client ID**.
3. Tại ô **Application type**, chọn:  
   👉 **`Web application`** (Ứng dụng Web)
4. Đặt tên: `LeLa Web Localhost`

---

## 📌 BƯỚC 4: CẤU HÌNH ORIGINS VÀ REDIRECT URIS (RẤT QUAN TRỌNG)

Google yêu cầu khai báo chính xác Origin và Redirect URI để tránh lỗi `Error 401: invalid_client` hoặc `redirect_uri_mismatch`.

### 1. Authorized JavaScript origins (Nguồn gốc JavaScript được phép):
Thêm 2 URL sau:
- `http://localhost:5173`
- `http://localhost:8080`

### 2. Authorized redirect URIs (URI chuyển hướng được phép):
Thêm **chính xác** Redirect URI của backend Spring Boot LeLa:
- **`http://localhost:8080/api/v1/login/oauth2/code/google`**

> ⚠️ **LƯU Ý:** Không bỏ sót `/api/v1` vì backend LeLa chạy context-path `/api/v1`.

5. Bấm **CREATE** (Tạo).

---

## 📌 BƯỚC 5: LẤY CLIENT ID & CLIENT SECRET CẬP NHẬT VÀO .ENV

Sau khi bấm CREATE, Google sẽ hiển thị hộp thoại chứa:
- **Client ID**: Ví dụ dạng `123456789012-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: Ví dụ dạng `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`

### Cập nhật vào Backend (`LeLa_BE/.env`):
Mở file `f:\ProJectLeLa\LeLa_BE\.env` và điền:
```env
GOOGLE_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Cập nhật vào Frontend (`LeLa_FE/.env`):
Mở file `f:\ProJectLeLa\LeLa_FE\.env` và điền:
```env
VITE_GOOGLE_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

---

## 📌 BƯỚC 6: KHỞI ĐỘNG LẠI BACKEND & FRONTEND

Sau khi cập nhật file `.env`:

1. Khởi động lại Backend Spring Boot (`.\mvnw.cmd spring-boot:run -DskipTests`).
   - Kiểm tra log Backend xuất hiện dòng:
     ```text
     Google Client ID Configured Status: PASS
     Google Client ID Hint: 123456789012...apps.googleusercontent.com
     Authorized Redirect URI: http://localhost:8080/api/v1/login/oauth2/code/google
     ```
2. Khởi động lại Frontend Vite (`npm run dev`).
3. Truy cập **`http://localhost:5173/login`** → Click **"Đăng nhập bằng Google"**.
4. Màn hình chọn tài khoản Google xuất hiện → Chọn tài khoản → Hệ thống tự động tạo tài khoản `LEARNER` (hoặc đăng nhập tài khoản trùng email) → Chuyển hướng thành công vào Dashboard! 🎉
