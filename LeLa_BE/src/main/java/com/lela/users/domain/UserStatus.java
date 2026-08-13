package com.lela.users.domain;

// Enum trạng thái tài khoản người dùng.
public enum UserStatus {
    PENDING, // Tài khoản mới tạo, chờ xác thực hoặc kích hoạt.
    ACTIVE, // Tài khoản đang hoạt động bình thường.
    SUSPENDED, // Tài khoản bị tạm khóa.
    DEACTIVATED // Tài khoản đã bị vô hiệu hóa.
}
