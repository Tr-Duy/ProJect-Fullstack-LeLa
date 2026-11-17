package com.lela.dailylearningactivity;

import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyXpBudgetTest {

    @Mock private UsersRepository usersRepository;
    @Mock private DailyLearningActivityRepository activityRepository;
    @Mock private EntityManager entityManager;

    @InjectMocks
    private DailyXpBudget dailyXpBudget;

    @Test
    @DisplayName("Remaining budget: Thành tựu 150 XP không được cắn vào trần ngày 150 XP của phần luyện tập")
    void testAchievementXpDoesNotConsumeDailyPracticeBudget() {
        Users user = new Users();
        user.setId(10L);
        when(usersRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(user));

        // Người dùng đã mở thành tựu 150 XP hôm nay:
        // xp_earned = 150, achievement_xp = 150, practice spent = 150 - 150 = 0
        DailyLearningActivity activity = new DailyLearningActivity();
        activity.setUser(user);
        activity.setActivityDate(LocalDate.now());
        activity.setXpEarned(150);
        activity.setAchievementXp(150);

        when(activityRepository.findForUpdate(eq(10L), any(LocalDate.class))).thenReturn(Optional.of(activity));

        int remaining = dailyXpBudget.remaining(10L, LocalDate.now(), 150);

        // Trần ngày 150 vẫn còn nguyên 150 cho bài luyện tập!
        assertEquals(150, remaining);
    }

    @Test
    @DisplayName("Remaining budget: Khi đã làm quiz 40 XP + thành tựu 150 XP -> remaining = 150 - 40 = 110")
    void testPracticeXpCorrectlyConsumesBudgetWithAchievementPresent() {
        Users user = new Users();
        user.setId(10L);
        when(usersRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(user));

        DailyLearningActivity activity = new DailyLearningActivity();
        activity.setUser(user);
        activity.setActivityDate(LocalDate.now());
        activity.setXpEarned(190); // 150 achievement + 40 quiz
        activity.setAchievementXp(150);

        when(activityRepository.findForUpdate(eq(10L), any(LocalDate.class))).thenReturn(Optional.of(activity));

        int remaining = dailyXpBudget.remaining(10L, LocalDate.now(), 150);

        assertEquals(110, remaining);
    }
}
