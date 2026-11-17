package com.lela.dailylearningactivity;

import com.lela.users.UsersRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

/** The daily activity ledger is the shared source of credited XP. */
@Service @RequiredArgsConstructor
public class DailyXpBudget {
    private final UsersRepository users;
    private final DailyLearningActivityRepository activities;
    private final EntityManager entityManager;

    @Transactional(propagation = Propagation.MANDATORY)
    public int remaining(Long userId, LocalDate date, int cap) {
        var user = users.findByIdForUpdate(userId).orElseThrow();
        // Refresh an entity that may have been loaded before waiting for another award.
        entityManager.refresh(user, LockModeType.PESSIMISTIC_WRITE);
        var activity = activities.findForUpdate(userId, date);
        activity.ifPresent(a -> entityManager.refresh(a, LockModeType.PESSIMISTIC_WRITE));
        int totalSpent = activity.map(a -> a.getXpEarned() == null ? 0 : a.getXpEarned()).orElse(0);
        int achievementXp = activity.map(a -> a.getAchievementXp() == null ? 0 : a.getAchievementXp()).orElse(0);
        int practiceSpent = Math.max(0, totalSpent - achievementXp);
        return Math.max(0, cap - practiceSpent);
    }
}
