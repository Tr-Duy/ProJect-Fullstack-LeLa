package com.lela.common.exception;

import com.lela.common.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.security.access.AccessDeniedException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalException {
    private void logError(Exception ex) {
        try {
            java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("global_error.log", true));
            pw.println("--- GLOBAL ERROR: " + ex.getClass().getName() + " ---");
            ex.printStackTrace(pw);
            pw.close();
        } catch (Exception ignored) {}
    }

    @ExceptionHandler(NotFoundExeception.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NotFoundExeception e){
        logError(e);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
    }
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException e) {
        logError(e);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException e){
        logError(e);
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        logError(ex);
        Map<String, String> errors = new LinkedHashMap<>();
        String primaryMessage = "Dữ liệu nhập vào không hợp lệ";
        if (!ex.getBindingResult().getFieldErrors().isEmpty()) {
            FieldError firstError = ex.getBindingResult().getFieldErrors().get(0);
            primaryMessage = firstError.getDefaultMessage();
        }
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", false);
        payload.put("message", primaryMessage);
        payload.put("errors", errors);
        return ResponseEntity.badRequest().body(payload);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(jakarta.validation.ConstraintViolationException ex) {
        logError(ex);
        String msg = ex.getConstraintViolations().isEmpty() ? "Dữ liệu không hợp lệ" 
                : ex.getConstraintViolations().iterator().next().getMessage();
        return ResponseEntity.badRequest().body(ApiResponse.error(msg));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Tên đăng nhập/email hoặc mật khẩu không chính xác"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Truy cập bị từ chối"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        logError(ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("Dữ liệu đã tồn tại hoặc vi phạm ràng buộc cơ sở dữ liệu."));
    }

    @ExceptionHandler(com.lela.ai.exception.AiException.class)
    public ResponseEntity<ApiResponse<Void>> handleAiException(com.lela.ai.exception.AiException ex) {
        logError(ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException ex) {
        logError(ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception ex) {
        logError(ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error: " + ex.getMessage()));
    }

}
