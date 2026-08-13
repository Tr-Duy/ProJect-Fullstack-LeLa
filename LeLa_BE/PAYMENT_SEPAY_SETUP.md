# PAYMENT SEPAY SETUP

## 1. Architecture
- Backend sử dụng Spring Boot tích hợp cơ chế Webhook (S2S - Server to Server) của SePay.
- Khi Learner Checkout thành công, Backend tự động trả về một QR động (VietQR) chứa số tiền và mã `paymentCode` riêng biệt (VD: `LELA123456`).
- SePay theo dõi ngân hàng, khi nhận được biến động số dư, SePay tự động bắn Webhook chứa `paymentCode` ngược về Backend để xác thực (Verify API Key & Exact Amount).

## 2. Payment Flow
1. Learner gọi API `POST /payments/checkout` với `planId`.
2. Backend kiểm tra Gói (FREE bị chặn), tạo Payment trạng thái `PENDING`, trả về QR Code URL.
3. Learner dùng App Ngân hàng quét QR và chuyển khoản.
4. Giao dịch thành công, SePay nhận diện và gửi POST Request về `/payments/webhook/sepay`.
5. `SepayWebhookValidator` kiểm tra Authorization Header.
6. Backend tìm Payment bằng `paymentCode`, xác minh `Amount`.
7. Đổi trạng thái `Payment` -> `SUCCEEDED` và kích hoạt `UserSubscription` -> `ACTIVE`.
8. Hệ thống tính `expiresAt` dựa trên Billing Cycle của gói và gửi Notification.

## 3. FREE/PLUS/PREMIUM
- **FREE**: Gói mặc định, mức giá `0` hoặc không có giá. Flow Checkout sẽ chặn ngay tại bước đầu tiên.
- **PLUS / PREMIUM**: Có giá trị `> 0`. Giá tiền được Backend lấy trực tiếp từ `SubscriptionPlan` trong CSDL, không phụ thuộc Frontend, đảm bảo Learner không thể gian lận số tiền.

## 4. API endpoints
- **POST** `/payments/checkout` : (Yêu cầu JWT Token) - Bắt đầu quy trình thanh toán.
- **GET** `/payments/{id}/status` : (Yêu cầu JWT Token) - Lấy trạng thái thanh toán hiện hành (PENDING, SUCCEEDED).
- **POST** `/payments/webhook/sepay` : (Yêu cầu API Key qua Header `Authorization`) - Endpoint độc quyền cho SePay gọi vào.

## 5. Database changes
- **Version**: V26
- **Bảng `payments`**: Thêm cột `payment_code` (UNIQUE), `expires_at` và cấu hình UNIQUE cho `provider_transaction_id` để chống duplicate transaction. 

## 6. Environment variables
Bạn cần cấu hình những biến sau trên máy chủ thật:
- `SEPAY_API_KEY`: Key bảo vệ Webhook.
- `PAYMENT_BANK_CODE`: Mã ngân hàng của bạn (VD: `MB`, `VCB`).
- `PAYMENT_BANK_ACCOUNT_NUMBER`: STK nhận tiền.
- `PAYMENT_BANK_ACCOUNT_NAME`: Tên in hoa không dấu (VD: `NGUYEN VAN A`).

## 7. SePay setup
1. Đăng ký tài khoản tại [SePay.vn](https://sepay.vn).
2. Thêm số tài khoản ngân hàng của bạn vào SePay.
3. Truy cập vào mục "Cấu hình Tích Hợp".

## 8. Webhook setup
1. Trong SePay, điền URL Webhook: `https://[Domain_Cua_Ban]/payments/webhook/sepay`
2. Tại phần xác thực (Header), thêm Header có tên `Authorization` và giá trị `Apikey [SEPAY_API_KEY]`.
3. Lưu lại.

## 9. Local development
- Để test local, bạn dùng ngrok: `ngrok http 8080`.
- Lấy link ngrok cấu hình vào Webhook SePay, sau đó thực hiện chuyển khoản thật 10k hoặc dùng Postman giả lập gửi request Webhook.

## 10. Production deployment
- Đảm bảo HTTPS được cấu hình hợp lệ để SePay có thể gửi được payload tới.
- Set biến môi trường đầy đủ như ở mục 6.

## 11. Testing
- Test đã được viết sẵn trong `PaymentServiceImplTest` đảm bảo: Gói FREE văng Exception, gói trả phí lấy chuẩn giá từ DB, webhook Idempotency, xác thực Amount == Price.

## 12. Security
- Webhook không yêu cầu JWT nhưng bị chặn nghiêm ngặt bởi `SepayWebhookValidator` đứng trước logic nghiệp vụ.
- DB có `Unique Constraint` ở `payment_code` và `provider_transaction_id` kết hợp với Check Status ở Business Logic đảm bảo tuyệt đối không bị race condition / Idempotency.

## 13. Troubleshooting
- **Lỗi 401 Webhook**: Do thiết lập API Key ở phía SePay không khớp với file `.env` hoặc Backend chưa reload.
- **Thanh toán nhưng chưa kích hoạt gói**: Có thể Learner sửa nội dung chuyển khoản nên SePay gửi thiếu `LELAxxx`. Hãy check trong lịch sử SePay.
- **Learner chuyển dư/thiếu tiền**: Log sẽ ghi lại `Số tiền chuyển không khớp` và giữ nguyên trạng thái PENDING/FAILED. Learner cần liên hệ Admin xử lý hoàn tiền thủ công.
