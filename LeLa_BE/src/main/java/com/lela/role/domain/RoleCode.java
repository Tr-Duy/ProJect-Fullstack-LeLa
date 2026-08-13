package com.lela.role.domain;

// Enum mã vai trò chuẩn trong hệ thống RBAC.
public enum RoleCode {
    ADMIN, // Quản trị viên toàn quyền.
    LEARNER, // Người học flashcard, review SRS và làm quiz.
    CONTENT_CREATOR, // Người tạo và quản lý nội dung học.
    MODERATOR // Người kiểm duyệt nội dung và hỗ trợ quản lý.
}
