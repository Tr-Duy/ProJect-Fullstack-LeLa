package com.lela.notification;

import com.lela.common.ApiResponse;
import com.lela.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.lela.notification.dto.NotificationRequest;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SseService sseService;
    private final com.lela.users.UsersRepository usersRepository;

    private static final String MSG_FETCH_ALL_SUCCESS = "Tải danh sách tất cả thông báo thành công.";
    private static final String MSG_FETCH_UNREAD_SUCCESS = "Tải danh sách thông báo chưa đọc thành công.";
    private static final String MSG_MARK_READ_SUCCESS = "Đã đánh dấu đọc thông báo thành công.";
    private static final String MSG_MARK_ALL_READ_SUCCESS = "Đã đánh dấu đọc toàn bộ thông báo thành công.";

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getAll(Pageable pageable) {
        Page<NotificationResponse> data = notificationService.getAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_FETCH_ALL_SUCCESS));
    }

    @GetMapping("/stream")
    public SseEmitter stream() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId = usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
        return sseService.subscribe(userId);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getAllAdmin(Pageable pageable) {
        Page<NotificationResponse> data = notificationService.getAllAdmin(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_FETCH_ALL_SUCCESS));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getUnread(Pageable pageable) {
        Page<NotificationResponse> data = notificationService.getUnread(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_FETCH_UNREAD_SUCCESS));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.successMessage(MSG_MARK_READ_SUCCESS));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.successMessage(MSG_MARK_ALL_READ_SUCCESS));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Xóa thông báo thành công."));
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<ApiResponse<Void>> deleteAllNotifications() {
        notificationService.deleteAllNotifications();
        return ResponseEntity.ok(ApiResponse.successMessage("Xóa tất cả thông báo thành công."));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> broadcast(@RequestBody NotificationRequest request) {
        notificationService.broadcast(request);
        return ResponseEntity.ok(ApiResponse.successMessage("Gửi thông báo toàn hệ thống thành công."));
    }
}