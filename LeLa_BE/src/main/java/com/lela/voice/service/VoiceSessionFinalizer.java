package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.dailylearningactivity.DailyLearningActivityService;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.*;
import com.lela.voice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceSessionFinalizer {

    private final ConversationSessionRepository sessionRepository;
    private final ConversationTurnRepository turnRepository;
    private final ConversationTargetWordRepository targetWordRepository;
    private final UserConversationLevelRepository levelRepository;
    private final ConversationLevelService levelService;
    private final CardProgressRepository cardProgressRepository;
    private final DailyLearningActivityService dailyLearningActivityService;
    private final UsersRepository usersRepository;
    private final VoiceConfigurationProperties props;
    private final UsageLedgerRepository usageLedgerRepository;

    /**
     * Chốt phiên hội thoại và chấm điểm (Idempotent transaction)
     */
    @Transactional
    public ConversationSession finalizeSession(String publicId, Long userId, String userFeedback) {
        ConversationSession session = sessionRepository.findByPublicId(publicId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy phiên hội thoại"));

        if (!session.getUser().getId().equals(userId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy phiên hội thoại");
        }

        // Idempotent: Nếu đã hoàn thành trước đó, trả về kết quả
        if (!"IN_PROGRESS".equals(session.getStatus())) {
            log.info("Session {} already finalized with status {}", publicId, session.getStatus());
            return session;
        }

        LocalDateTime now = LocalDateTime.now();
        session.setEndedAt(now);
        session.setFinishedAt(now);

        // 1. Tính toán điểm số từ turns và target words
        List<ConversationTurn> turns = turnRepository.findBySessionIdOrderByTurnNumberAsc(session.getId());
        List<ConversationTargetWord> targetWords = targetWordRepository.findBySessionId(session.getId());

        int grammarScore = calculateGrammarScore(turns);
        int vocabScore = calculateVocabularyScore(targetWords, turns);
        int fluencyScore = calculateFluencyScore(session.getValidTurnCount(), session.getDurationSeconds());

        // Điểm tổng: Grammar (40%) + Vocab (40%) + Fluency (20%)
        int overallScore = Math.round(grammarScore * 0.40f + vocabScore * 0.40f + fluencyScore * 0.20f);
        overallScore = Math.max(0, Math.min(100, overallScore));

        session.setGrammarScore(grammarScore);
        session.setVocabularyScore(vocabScore);
        session.setFluencyScore(fluencyScore);
        session.setOverallScore(overallScore);
        session.setUserFeedback(userFeedback != null ? userFeedback.toUpperCase() : "COMFORTABLE");

        // Đề xuất hệ thống (Tăng/Giữ/Hạ)
        long correctTargetWords = targetWords.stream().filter(ConversationTargetWord::getUsedCorrectly).count();
        if (overallScore >= 80 && correctTargetWords >= 2) {
            session.setSystemRecommendation("INCREASE");
        } else if (overallScore < 50) {
            session.setSystemRecommendation("DECREASE");
        } else {
            session.setSystemRecommendation("KEEP");
        }

        session.setStatus("COMPLETED");

        // 2. Cập nhật Level người học (Server-enforced logic)
        UserConversationLevel userLvl = levelRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> levelService.getOrCreateLevel(userId, session.getUser()));
        levelService.applySessionLevelAdjustment(userLvl, session.getUserFeedback(), overallScore, session.getId());

        // 3. Cập nhật SRS cho Target Words
        // Quy tắc: dùng đúng KHÔNG đổi due_date/interval; dùng sai thì lapse_count++ (tối đa 1 lần / từ / phiên)
        for (ConversationTargetWord tw : targetWords) {
            if ("USED_WRONG".equals(tw.getStatus())) {
                cardProgressRepository.findByUserIdAndCardId(userId, tw.getFlashcard().getId())
                        .ifPresent(cp -> {
                            cp.setLapseCount((cp.getLapseCount() != null ? cp.getLapseCount() : 0) + 1);
                            cardProgressRepository.save(cp);
                        });
            }
        }

        // 4. Trao thưởng Gamification (XP & Streak)
        // Điều kiện nhận XP: phiên COMPLETED, >= 3 lượt hợp lệ & >= 2 target words dùng đúng
        if (session.getValidTurnCount() >= 3 && correctTargetWords >= 2) {
            ZoneId zone = ZoneId.of(props.getTimezone());
            LocalDate today = LocalDate.now(zone);
            int todayXpUsed = sessionRepository.sumDailyXpAwarded(userId, today);
            int remainingCap = Math.max(0, props.getDailyXpCap() - todayXpUsed);
            int xpToAward = Math.min(props.getXpPerCompletedSession(), remainingCap);

            if (xpToAward > 0) {
                session.setXpAwarded(xpToAward);
                // Ghi nhận hoạt động vào DailyLearningActivity để kích hoạt streak & gamification
                DailyLearningActivityRequest actReq = new DailyLearningActivityRequest();
                actReq.setActivityDate(today);
                actReq.setXpEarned(xpToAward);
                actReq.setMinutesSpent(Math.max(1, session.getDurationSeconds() / 60));
                actReq.setVoiceSessionCount(1);
                dailyLearningActivityService.logActivity(actReq);
            }
        }

        // 5. Ghi nhận bút toán vào Sổ Ghi Hạn Mức (SO_GHI_HAN_MUC)
        try {
            ZoneId zone = ZoneId.of(props.getTimezone());
            LocalDate today = LocalDate.now(zone);
            int minutesUsed = Math.max(1, (int) Math.ceil((session.getDurationSeconds() != null ? session.getDurationSeconds() : 0) / 60.0));
            UsageLedger ledger = UsageLedger.builder()
                    .user(session.getUser())
                    .session(session)
                    .entryType("SESSION")
                    .minutesUsed(minutesUsed)
                    .usageDate(today)
                    .reason(session.getScenario() != null ? "Hội thoại AI Voice: " + session.getScenario().getTitle() : "Hội thoại AI Voice")
                    .build();
            usageLedgerRepository.save(ledger);
        } catch (Exception e) {
            log.error("Failed to record usage ledger for session {}: {}", session.getPublicId(), e.getMessage());
        }

        return sessionRepository.save(session);
    }

    private int calculateGrammarScore(List<ConversationTurn> turns) {
        long userTurns = turns.stream().filter(t -> "USER".equalsIgnoreCase(t.getRole()) && t.getIsValid()).count();
        if (userTurns == 0) return 60;

        long errorTurns = turns.stream()
                .filter(t -> "USER".equalsIgnoreCase(t.getRole()) && t.getIsValid())
                .filter(t -> t.getGrammarErrorsJson() != null && !t.getGrammarErrorsJson().equals("[]") && !t.getGrammarErrorsJson().isBlank())
                .count();

        double errorRate = (double) errorTurns / userTurns;
        return (int) Math.round((1.0 - errorRate) * 100);
    }

    private int calculateVocabularyScore(List<ConversationTargetWord> targetWords, List<ConversationTurn> turns) {
        if (targetWords.isEmpty()) return 70;
        long correct = targetWords.stream().filter(ConversationTargetWord::getUsedCorrectly).count();
        int base = (int) Math.round(((double) correct / targetWords.size()) * 70);
        int bonus = turns.size() >= 5 ? 30 : turns.size() * 6;
        return Math.min(100, base + bonus);
    }

    private int calculateFluencyScore(int validTurnCount, int durationSeconds) {
        if (validTurnCount >= 8) return 95;
        if (validTurnCount >= 5) return 80;
        if (validTurnCount >= 3) return 65;
        return 50;
    }
}
