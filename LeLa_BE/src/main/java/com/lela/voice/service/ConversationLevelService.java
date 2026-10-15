package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.voice.domain.UserConversationLevel;
import com.lela.voice.repository.ConversationLevelHistoryRepository;
import com.lela.voice.repository.UserConversationLevelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationLevelService {

    private final UserConversationLevelRepository levelRepository;
    private final ConversationLevelHistoryRepository historyRepository;
    private final CardProgressRepository cardProgressRepository;
    private final com.lela.users.UsersRepository usersRepository;

    // Sàn cố định theo band Onboarding ban đầu:
    // A1=100, A2=100 (bậc thấp nhất A2=300), B1=300 (bậc thấp nhất B1=450), B2=450 (bậc thấp nhất B2=650), C1=650 (bậc thấp nhất C1=850)
    private static final Map<Integer, Integer> BAND_FLOORS = Map.of(
            100, 100, // A1
            250, 100, // A2 (hoặc 300 -> sàn 100)
            300, 100,
            400, 300, // B1 -> sàn 300
            450, 300,
            600, 450, // B2 -> sàn 450
            650, 450,
            800, 650, // C1 -> sàn 650
            850, 650
    );

    /**
     * Xác định trần level dựa trên tổng từ vựng người học đã tích lũy (vocabCap)
     */
    public int calculateVocabCap(long totalLearnedCards) {
        if (totalLearnedCards < 50) return 250;
        if (totalLearnedCards < 150) return 400;
        if (totalLearnedCards < 300) return 600;
        if (totalLearnedCards < 600) return 800;
        return 1000;
    }

    /**
     * Lấy sàn cố định dựa trên initialBandMin của user
     */
    public int getFloorLevel(int initialBandMin) {
        return BAND_FLOORS.getOrDefault(initialBandMin, 100);
    }

    /**
     * Đảm bảo hàng user_conversation_levels tồn tại trước khi khóa FOR UPDATE
     */
    @Transactional
    public UserConversationLevel getOrCreateLevel(Long userId, com.lela.users.domain.Users user) {
        return levelRepository.findById(userId).orElseGet(() -> {
            com.lela.users.domain.Users managedUser = (user != null && user.getId() != null)
                    ? usersRepository.findById(user.getId()).orElse(user)
                    : usersRepository.findById(userId).orElse(user);

            int initLevel = 200;
            int initBandMin = 100;

            if (managedUser != null && managedUser.getCurrentLevel() != null && managedUser.getCurrentLevel().getCode() != null) {
                String code = managedUser.getCurrentLevel().getCode().toUpperCase();
                if (code.contains("A2")) {
                    initLevel = 300;
                    initBandMin = 300;
                } else if (code.contains("B1")) {
                    initLevel = 500;
                    initBandMin = 450;
                } else if (code.contains("B2")) {
                    initLevel = 700;
                    initBandMin = 650;
                } else if (code.contains("C1")) {
                    initLevel = 900;
                    initBandMin = 850;
                } else {
                    initLevel = 200;
                    initBandMin = 100;
                }
            }

            UserConversationLevel newLvl = UserConversationLevel.builder()
                    .userId(userId)
                    .user(managedUser)
                    .currentLevel(initLevel)
                    .initialBandMin(initBandMin)
                    .highestLevel(initLevel)
                    .totalSessions(0)
                    .consecutiveHardCount(0)
                    .isNew(true)
                    .build();

            return levelRepository.saveAndFlush(newLvl);
        });
    }

    /**
     * Tính toán cập nhật level sau khi kết thúc buổi thoại (Server-enforced logic)
     */
    @Transactional
    public int applySessionLevelAdjustment(UserConversationLevel userLvl, String feedback, int overallScore, Long sessionId) {
        int oldLevel = userLvl.getCurrentLevel();
        int delta = 0;
        String reason = feedback != null ? feedback : "SKIPPED";

        if ("HARD".equalsIgnoreCase(feedback)) {
            delta = -50;
            userLvl.setConsecutiveHardCount(userLvl.getConsecutiveHardCount() + 1);
        } else if ("EASY".equalsIgnoreCase(feedback)) {
            if (overallScore < 50) {
                // Chặn EASY nếu điểm tổng < 50
                log.warn("User {} selected EASY but overallScore {} < 50. Delta set to 0.", userLvl.getUserId(), overallScore);
                delta = 0;
                reason = "EASY_BLOCKED_LOW_SCORE";
            } else {
                delta = 50;
                userLvl.setConsecutiveHardCount(0);
            }
        } else {
            // COMFORTABLE hoặc SKIPPED
            delta = 0;
            userLvl.setConsecutiveHardCount(0);
        }

        long totalLearned = cardProgressRepository.countByUserId(userLvl.getUserId());
        int vocabCap = calculateVocabCap(totalLearned);
        int floor = getFloorLevel(userLvl.getInitialBandMin());

        // newLevel = clamp(oldLevel + delta, floor, min(oldLevel + 50, vocabCap))
        int target = oldLevel + delta;
        int upperCap = Math.min(oldLevel + 50, vocabCap);
        int newLevel = Math.max(floor, Math.min(target, upperCap));

        // Đảm bảo là bội của 50 và trong khoảng [100, 1000]
        newLevel = (newLevel / 50) * 50;
        newLevel = Math.max(100, Math.min(1000, newLevel));

        userLvl.setCurrentLevel(newLevel);
        if (newLevel > userLvl.getHighestLevel()) {
            userLvl.setHighestLevel(newLevel);
        }
        userLvl.setTotalSessions(userLvl.getTotalSessions() + 1);
        levelRepository.save(userLvl);

        // Ghi nhận lịch sử
        if (delta != 0 || !reason.equals("SKIPPED")) {
            com.lela.voice.domain.ConversationLevelHistory history = com.lela.voice.domain.ConversationLevelHistory.builder()
                    .user(userLvl.getUser())
                    .sessionId(sessionId)
                    .oldLevel(oldLevel)
                    .newLevel(newLevel)
                    .delta(newLevel - oldLevel)
                    .reason(reason)
                    .build();
            historyRepository.save(history);
        }

        return newLevel;
    }
}
