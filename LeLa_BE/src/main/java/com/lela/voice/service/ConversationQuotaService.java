package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.domain.Users;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.*;
import com.lela.voice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationQuotaService {

    private final ConversationSessionRepository sessionRepository;
    private final UserConversationLevelRepository levelRepository;
    private final ConversationLevelService levelService;
    private final CardProgressRepository cardProgressRepository;
    private final com.lela.users.UsersRepository usersRepository;
    private final VoiceConfigurationProperties props;

    /**
     * Kiểm tra điều kiện mở khóa:
     * totalMasteredCards (REVIEW) + totalLearningCards (LEARNING/RELEARNING) >= 20
     */
    public boolean isFeatureUnlocked(Long userId) {
        long masteredCount = cardProgressRepository.countByUserIdAndState(userId, CardProgressState.REVIEW);
        long learningCount = cardProgressRepository.countByUserIdAndState(userId, CardProgressState.LEARNING);
        long relearningCount = cardProgressRepository.countByUserIdAndState(userId, CardProgressState.RELEARNING);
        return (masteredCount + learningCount + relearningCount) >= 20;
    }

    public long getLearnedCardsCount(Long userId) {
        long masteredCount = cardProgressRepository.countByUserIdAndState(userId, CardProgressState.REVIEW);
        long learningCount = cardProgressRepository.countByUserIdAndState(userId, CardProgressState.LEARNING);
        long relearningCount = cardProgressRepository.countByUserIdAndState(userId, CardProgressState.RELEARNING);
        return (masteredCount + learningCount + relearningCount);
    }

    public ZoneId getUserZone(Long userId) {
        if (userId != null) {
            try {
                Users u = usersRepository.findById(userId).orElse(null);
                if (u != null && u.getTimezone() != null && !u.getTimezone().isBlank()) {
                    return ZoneId.of(u.getTimezone());
                }
            } catch (Exception ignored) {}
        }
        return ZoneId.of(props.getTimezone());
    }

    public LocalDate getTodayQuotaDate() {
        return LocalDate.now(ZoneId.of(props.getTimezone()));
    }

    public LocalDate getTodayQuotaDate(Long userId) {
        return LocalDate.now(getUserZone(userId));
    }

    public String getNextResetAtIso() {
        ZoneId zone = ZoneId.of(props.getTimezone());
        LocalDate tomorrow = LocalDate.now(zone).plusDays(1);
        ZonedDateTime nextReset = tomorrow.atStartOfDay(zone);
        return nextReset.toOffsetDateTime().toString();
    }

    public String getNextResetAtIso(Long userId) {
        ZoneId zone = getUserZone(userId);
        LocalDate tomorrow = LocalDate.now(zone).plusDays(1);
        ZonedDateTime nextReset = tomorrow.atStartOfDay(zone);
        return nextReset.toOffsetDateTime().toString();
    }

    /**
     * Lấy số lượt còn lại trong ngày (tối đa 3 lượt HOÀN THÀNH)
     * CHỈ ĐẾM CÁC BUỔI ĐÃ HOÀN THÀNH (status = 'COMPLETED')
     */
    public int getRemainingQuota(Long userId) {
        ZoneId zone = getUserZone(userId);
        LocalDate today = LocalDate.now(zone);
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        long completed = sessionRepository.countCompletedSessionsToday(userId, startOfDay, endOfDay);
        return Math.max(0, props.getMaxSessionsPerDay() - (int) completed);
    }

    /**
     * Kiểm tra và giữ chỗ lượt với khóa PESSIMISTIC_WRITE trên hàng user_conversation_levels
     */
    @Transactional
    public ConversationSession startSessionWithLock(
            Users user,
            ConversationScenario scenario,
            List<Flashcard> targetCards
    ) {
        Long userId = user.getId();

        // 1. Kiểm tra mở khóa
        if (!isFeatureUnlocked(userId)) {
            throw new IllegalStateException("Tính năng chưa được mở khóa. Bạn cần học ít nhất 20 thẻ từ vựng.");
        }

        // 2. Khóa PESSIMISTIC_WRITE (SELECT ... FOR UPDATE) trên bản ghi Users để tuần tự hóa các yêu cầu song song
        usersRepository.findByIdForUpdate(userId);
        UserConversationLevel userLvl = levelService.getOrCreateLevel(userId, user);

        // 3. Kiểm tra xem có phiên IN_PROGRESS nào chưa hoàn thành không (khóa FOR UPDATE đọc committed mới nhất)
        List<ConversationSession> inProgressList = sessionRepository.findInProgressSessionsForUpdate(userId);
        if (!inProgressList.isEmpty()) {
            ConversationSession session = inProgressList.get(0);
            // Nếu phiên đã cũ (quá hạn idle timeout), tự động chuyển sang ABANDONED
            LocalDateTime expiredLimit = LocalDateTime.now().minusSeconds(props.getIdleTimeoutSeconds());
            if (session.getLastActivityAt().isBefore(expiredLimit)) {
                session.setStatus("ABANDONED");
                session.setEndedAt(LocalDateTime.now());
                sessionRepository.save(session);
            } else {
                return session; // Trả về lại phiên đang diễn ra
            }
        }

        // 4. Kiểm tra hạn mức 3 lượt / ngày (CHỈ ĐẾM CÁC BUỔI ĐÃ HOÀN THÀNH 'COMPLETED')
        ZoneId zone = getUserZone(userId);
        LocalDate today = LocalDate.now(zone);
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        long completed = sessionRepository.countCompletedSessionsToday(userId, startOfDay, endOfDay);
        if (completed >= props.getMaxSessionsPerDay()) {
            throw new IllegalStateException("Bạn đã hết lượt hội thoại hôm nay (tối đa 3 lượt/ngày). Lượt mới sẽ mở vào 00:00.");
        }

        // 5. Khởi tạo phiên mới
        ConversationSession newSession = ConversationSession.builder()
                .publicId(UUID.randomUUID().toString())
                .user(user)
                .scenario(scenario)
                .quotaDate(today)
                .levelAtStart(userLvl.getCurrentLevel())
                .status("IN_PROGRESS")
                .startedAt(LocalDateTime.now())
                .lastActivityAt(LocalDateTime.now())
                .build();

        return sessionRepository.save(newSession);
    }

    /**
     * Hủy phiên (Abandon)
     * Nếu 0 lượt hợp lệ -> hoàn lại hạn mức (bằng cách xóa session hoặc cờ hoàn lại)
     */
    @Transactional
    public void abandonSession(String publicId, Long userId) {
        ConversationSession session = sessionRepository.findByPublicId(publicId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy phiên hội thoại"));

        if (!session.getUser().getId().equals(userId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy phiên hội thoại");
        }

        if ("IN_PROGRESS".equals(session.getStatus())) {
            session.setStatus("ABANDONED");
            session.setEndedAt(LocalDateTime.now());
            sessionRepository.save(session);
        }
    }

    /**
     * Job dọn dẹp các phiên treo quá thời hạn
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupStaleSessions() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(props.getIdleTimeoutSeconds());
        List<ConversationSession> staleSessions = sessionRepository.findStaleInProgressSessions(threshold);
        for (ConversationSession s : staleSessions) {
            log.info("Auto-abandoning stale voice session: {}", s.getPublicId());
            s.setStatus("ABANDONED");
            s.setEndedAt(LocalDateTime.now());
            sessionRepository.save(s);
        }
    }
}
