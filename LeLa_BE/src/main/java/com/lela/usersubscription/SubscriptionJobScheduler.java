package com.lela.usersubscription;

import com.lela.notification.NotificationService;
import com.lela.notification.dto.NotificationRequest;
import com.lela.notification.domain.NotificationType;
import com.lela.usersubscription.domain.UserSubscription;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.logging.Logger;

@Component
@RequiredArgsConstructor
public class SubscriptionJobScheduler {

    private static final Logger logger = Logger.getLogger(SubscriptionJobScheduler.class.getName());
    
    private final UserSubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;

    // Run every day at midnight (00:00:00)
    // @Scheduled(cron = "0 0 0 * * *")
    // For testing purposes during development, we can also run it every hour or on startup.
    // Here we use the standard midnight cron.
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void processSubscriptionExpirations() {
        logger.info("Bắt đầu tiến trình kiểm tra hết hạn gói cước...");
        
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // 1. Cảnh báo sắp hết hạn (5 ngày tới)
        LocalDateTime fiveDaysFromNowStart = now.plusDays(5).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime fiveDaysFromNowEnd = fiveDaysFromNowStart.plusDays(1);
        
        List<UserSubscription> expiringSoon = subscriptionRepository.findActiveSubscriptionsExpiringBetween(
            fiveDaysFromNowStart, fiveDaysFromNowEnd
        );
        
        for (UserSubscription sub : expiringSoon) {
            String expireDateStr = sub.getExpiresAt().format(formatter);
            String planName = sub.getPlan() != null ? sub.getPlan().getName() : "Cao cấp";
            
            NotificationRequest request = new NotificationRequest();
            request.setTitle("Gói cước sắp hết hạn");
            request.setMessage("Vào ngày " + expireDateStr + ", gói cước " + planName + " của bạn sẽ hết hạn. Vui lòng gia hạn thêm để không bị gián đoạn học tập!");
            request.setType(NotificationType.SYSTEM);
            request.setActionUrl("/pricing");
            
            notificationService.sendToUser(sub.getUser().getId(), request);
            logger.info("Đã gửi cảnh báo hết hạn cho User ID: " + sub.getUser().getId());
        }

        // 2. Xử lý gói cước đã hết hạn
        List<UserSubscription> expiredSubs = subscriptionRepository.findActiveSubscriptionsExpiredBefore(now);
        
        for (UserSubscription sub : expiredSubs) {
            // Đổi trạng thái sang EXPIRED
            sub.setStatus(com.lela.usersubscription.domain.UserSubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
            
            NotificationRequest request = new NotificationRequest();
            request.setTitle("Gói cước đã hết hạn");
            request.setMessage("Gói cước của bạn vừa hết hạn, bạn đã quay về gói Free! Vui lòng nâng cấp để tiếp tục sử dụng các tính năng cao cấp.");
            request.setType(NotificationType.SYSTEM);
            request.setActionUrl("/pricing");
            
            notificationService.sendToUser(sub.getUser().getId(), request);
            logger.info("Đã chuyển trạng thái EXPIRED và gửi thông báo cho User ID: " + sub.getUser().getId());
        }
        
        logger.info("Hoàn tất tiến trình kiểm tra gói cước.");
    }
}
