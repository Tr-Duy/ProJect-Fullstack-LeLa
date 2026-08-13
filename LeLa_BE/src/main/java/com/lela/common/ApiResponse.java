package com.lela.common;

// File này định nghĩa chuẩn format response trả về cho client — mọi API trong project đều trả về cùng một cấu trúc.
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record ApiResponse<T>(boolean success, T data, String message, String timestamp) {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, LocalDateTime.now().format(FORMATTER));
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, "Success", LocalDateTime.now().format(FORMATTER));
    }

    public static ApiResponse<Void> successMessage(String message) {
        return new ApiResponse<>(true, null, message, LocalDateTime.now().format(FORMATTER));
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(false, null, message, LocalDateTime.now().format(FORMATTER));
    }

    public static <T> ApiResponse<T> error(String message, T data) {
        return new ApiResponse<>(false, data, message, LocalDateTime.now().format(FORMATTER));
    }
}