package com.lela.Quiz.timed;

import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.dailylearningactivity.DailyLearningActivityService;
import com.lela.dailylearningactivity.DailyXpBudget;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.users.UsersRepository;
import com.lela.voice.config.VoiceConfigurationProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;

@Service @RequiredArgsConstructor
public class VocabularyQuizRewards {
    private final DailyXpBudget budget;
    private final DailyLearningActivityService activityService;
    private final UsersRepository users;
    private final VoiceConfigurationProperties voiceConfig;
    private final TimedQuizProperties config;

    // Invoked only on first submission under the timed state lock, in the submit transaction.
    // submittedAt and the ledger/user updates commit or roll back together.
    @Transactional(propagation = Propagation.MANDATORY)
    public void award(QuizAttempt attempt, int rawXp, boolean participated) {
        attempt.setXpAwarded(0);
        if (!participated) return;
        LocalDate today = LocalDate.now(ZoneId.of(voiceConfig.getTimezone()));
        if (config.getXpPerMeaning() < 0 || config.getXpPerPair() < 0 || config.getMaxXpPerAttempt() < 0)
            throw new IllegalStateException("Invalid vocabulary XP configuration");
        int awarded = Math.min(Math.min(rawXp, config.getMaxXpPerAttempt()), budget.remaining(attempt.getUser().getId(), today, voiceConfig.getDailyXpCap()));
        var request = new DailyLearningActivityRequest();
        request.setActivityDate(today); request.setXpEarned(awarded); request.setQuizCount(1);
        request.setMinutesSpent(Math.max(1, (attempt.getTimeSpentSeconds() == null ? 0 : attempt.getTimeSpentSeconds()) / 60));
        var activity = activityService.logActivity(request); // also called when the daily cap gives zero XP
        var user = users.findById(attempt.getUser().getId()).orElseThrow();
        int streak = Math.max(1, activity.getCurrentStreak() == null ? 0 : activity.getCurrentStreak());
        int previous = user.getStreakCurrent() == null ? 0 : user.getStreakCurrent();
        if (today.equals(user.getLastActivityDate())) streak = Math.max(streak, previous);
        else if (today.minusDays(1).equals(user.getLastActivityDate())) streak = Math.max(streak, previous + 1);
        user.setStreakCurrent(streak);
        user.setStreakLongest(Math.max(streak, user.getStreakLongest() == null ? 0 : user.getStreakLongest()));
        user.setLastActivityDate(today); users.save(user);
        attempt.setXpAwarded(awarded);
    }
    public int rawXp(int meaningCorrect, int pairsCorrect, int legacyCorrect) {
        return Math.addExact(Math.addExact(Math.multiplyExact(meaningCorrect, config.getXpPerMeaning()),
                Math.multiplyExact(pairsCorrect, config.getXpPerPair())), Math.multiplyExact(legacyCorrect, 10));
    }
}
