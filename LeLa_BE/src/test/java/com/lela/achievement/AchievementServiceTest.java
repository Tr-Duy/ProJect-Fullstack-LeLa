package com.lela.achievement;

import com.lela.achievement.domain.Achievement;
import com.lela.achievement.domain.UserAchievement;
import com.lela.dailylearningactivity.DailyLearningActivityRepository;
import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.notification.SseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock private AchievementRepository achievementRepository;
    @Mock private UserAchievementRepository userAchievementRepository;
    @Mock private DailyLearningActivityRepository dailyActivityRepository;
    @Mock private DeckEnrollmentRepository deckEnrollmentRepository;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private UsersRepository usersRepository;
    @Mock private SseService sseService;

    @InjectMocks
    private AchievementService achievementService;

    private Users user;
    private Achievement dec1Achievement;

    @BeforeEach
    void setUp() {
        user = new Users();
        user.setId(99L);
        user.setUsername("testlearner");
        user.setXpTotal(50L);

        dec1Achievement = Achievement.builder()
                .id(5L)
                .code("DECKS_1")
                .title("Người mới bắt đầu")
                .description("Học bộ thẻ đầu tiên")
                .xpReward(150)
                .isActive(true)
                .conditionType("DECKS_LEARNED")
                .conditionValue(1)
                .build();
    }

    @Test
    @DisplayName("Mở thành tựu mới phải tăng users.xp_total và daily_learning_activities.xp_earned đúng 150")
    void testGrantAchievementIncreasesUsersXpTotal() {
        when(userAchievementRepository.existsByUserIdAndAchievementId(99L, 5L)).thenReturn(false);
        when(dailyActivityRepository.findByUserIdAndActivityDate(eq(99L), any(LocalDate.class))).thenReturn(Optional.empty());
        when(usersRepository.findById(99L)).thenReturn(Optional.of(user));

        achievementService.unlockAchievement(user, dec1Achievement);

        // Verify UserAchievement saved
        verify(userAchievementRepository, times(1)).save(any(UserAchievement.class));

        // Verify DailyLearningActivity saved with 150 XP
        verify(dailyActivityRepository, times(1)).save(argThat(dla -> dla.getXpEarned() == 150));

        // Verify users.xp_total increased from 50 to 200 (50 + 150)
        assertEquals(200L, user.getXpTotal());
        verify(usersRepository, times(1)).save(user);

        // Verify SSE emitted
        verify(sseService, times(1)).emitToUser(eq(99L), eq("badge_unlocked"), anyMap());
    }

    @Test
    @DisplayName("Idempotent: Mở lại thành tựu đã có không được cộng thêm XP")
    void testGrantAchievementIdempotentWhenAlreadyUnlocked() {
        when(userAchievementRepository.existsByUserIdAndAchievementId(99L, 5L)).thenReturn(true);

        achievementService.unlockAchievement(user, dec1Achievement);

        // Verify no saves and no XP additions
        verify(userAchievementRepository, never()).save(any());
        verify(dailyActivityRepository, never()).save(any());
        verify(usersRepository, never()).save(any());
        verify(sseService, never()).emitToUser(anyLong(), anyString(), anyMap());

        assertEquals(50L, user.getXpTotal());
    }
}
