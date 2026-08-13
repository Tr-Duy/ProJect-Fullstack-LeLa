package com.lela.notification;

import com.lela.common.exception.NotFoundExeception;
import com.lela.notification.domain.Notification;
import com.lela.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final com.lela.users.UsersRepository usersRepository;
    private final ModelMapper modelMapper;
    private final SseService sseService;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getAll(Pageable pageable) {
        Long userId = getCurrentUserId();
        return repository.findAllByUserId(userId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getAllAdmin(Pageable pageable) {
        return repository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUnread(Pageable pageable) {
        Long userId = getCurrentUserId();
        return repository.findUnreadByUserId(userId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void markAsRead(Long id) {
        Long userId = getCurrentUserId();

        Notification notification = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy thông tin thông báo hoặc bạn không có quyền sở hữu."));

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            repository.save(notification);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        Long userId = getCurrentUserId();
        repository.markAllAllAsReadByUserId(userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        Long userId = getCurrentUserId();
        Notification notification = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy thông tin thông báo hoặc bạn không có quyền sở hữu."));
        repository.delete(notification);
    }

    @Override
    @Transactional
    public void deleteAllNotifications() {
        Long userId = getCurrentUserId();
        repository.deleteAllByUserId(userId);
    }

    @Override
    @Transactional
    public void broadcast(com.lela.notification.dto.NotificationRequest request) {
        java.util.List<com.lela.users.domain.Users> allUsers = usersRepository.findAll();
        java.util.List<Notification> notifications = allUsers.stream().map(user -> {
            Notification notif = new Notification();
            notif.setUser(user);
            notif.setType(request.getType() != null ? request.getType() : com.lela.notification.domain.NotificationType.SYSTEM);
            notif.setChannel(com.lela.notification.domain.NotificationChannel.IN_APP);
            notif.setStatus(com.lela.notification.domain.NotificationStatus.SENT);
            notif.setTitle(request.getTitle());
            notif.setMessage(request.getMessage());
            notif.setActionUrl(request.getActionUrl());
            notif.setDeliveredAt(LocalDateTime.now());
            notif.setIsRead(false);
            
            // Emit SSE for real-time notification
            sseService.emitToUser(user.getId(), "notification", mapToResponse(notif));
            
            return notif;
        }).collect(java.util.stream.Collectors.toList());
        repository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void sendToUser(Long userId, com.lela.notification.dto.NotificationRequest request) {
        com.lela.users.domain.Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new NotFoundExeception("User không tồn tại"));
                
        Notification notif = new Notification();
        notif.setUser(user);
        notif.setType(request.getType() != null ? request.getType() : com.lela.notification.domain.NotificationType.SYSTEM);
        notif.setChannel(com.lela.notification.domain.NotificationChannel.IN_APP);
        notif.setStatus(com.lela.notification.domain.NotificationStatus.SENT);
        notif.setTitle(request.getTitle());
        notif.setMessage(request.getMessage());
        notif.setActionUrl(request.getActionUrl());
        notif.setDeliveredAt(LocalDateTime.now());
        notif.setIsRead(false);
        
        repository.save(notif);
        
        // Emit SSE for real-time notification
        sseService.emitToUser(user.getId(), "notification", mapToResponse(notif));
    }

    private NotificationResponse mapToResponse(Notification entity) {
        if (entity == null) return null;

        NotificationResponse response = modelMapper.map(entity, NotificationResponse.class);

        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
        }

        return response;
    }
}