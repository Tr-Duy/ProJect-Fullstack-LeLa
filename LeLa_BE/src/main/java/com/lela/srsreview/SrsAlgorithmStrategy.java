package com.lela.srsreview;

import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Component
public class SrsAlgorithmStrategy {

    public void applySm2(CardProgress progress, int rating, LocalDateTime now) {
        int learningStep = progress.getLearningStep() != null ? progress.getLearningStep() : 0;
        int intervalDays = progress.getIntervalDays() != null ? progress.getIntervalDays() : 0;
        int repetitions = progress.getRepetitions() != null ? progress.getRepetitions() : 0;
        float ease = progress.getEaseFactor() != null ? progress.getEaseFactor().floatValue() : 2.5f;

        LocalDateTime nextDue;

        if (progress.getState() == CardProgressState.NEW || progress.getState() == CardProgressState.LEARNING) {
            // Learning phase
            if (rating == 1) { // AGAIN
                learningStep = 0;
                nextDue = now.plusMinutes(1);
            } else if (rating == 2) { // HARD
                nextDue = now.plusMinutes(5); // Repeat current step but a bit later
            } else if (rating == 3) { // GOOD
                learningStep++;
                if (learningStep > 1) { // Graduated
                    progress.setState(CardProgressState.REVIEW);
                    intervalDays = 1;
                    nextDue = now.plusDays(1).withHour(0).withMinute(0); // Next day start
                    repetitions = 1;
                } else {
                    nextDue = now.plusMinutes(10);
                }
            } else { // EASY
                progress.setState(CardProgressState.REVIEW);
                intervalDays = 4;
                nextDue = now.plusDays(4).withHour(0).withMinute(0);
                repetitions = 1;
            }
        } else {
            // Review phase
            if (rating == 1) { // AGAIN (Lapse)
                progress.setState(CardProgressState.LEARNING);
                learningStep = 0;
                intervalDays = 1; // Reset interval to 1 day for when it graduates again
                repetitions = 0;
                ease = Math.max(1.3f, ease - 0.2f);
                nextDue = now.plusMinutes(1);
                progress.setLapseCount((progress.getLapseCount() != null ? progress.getLapseCount() : 0) + 1);
            } else {
                if (rating == 2) { // HARD
                    ease = Math.max(1.3f, ease - 0.15f);
                    intervalDays = Math.max(intervalDays + 1, Math.round(intervalDays * 1.2f));
                } else if (rating == 3) { // GOOD
                    intervalDays = Math.max(intervalDays + 1, Math.round(intervalDays * ease));
                } else { // EASY
                    ease += 0.15f;
                    intervalDays = Math.max(intervalDays + 1, Math.round(intervalDays * ease * 1.3f));
                }
                
                // Add fuzzing (random noise to prevent clumps) if interval > 4
                if (intervalDays > 4) {
                    float fuzzRange = intervalDays * 0.05f; // 5% fuzz
                    int fuzz = Math.round((float) (Math.random() * fuzzRange * 2) - fuzzRange);
                    intervalDays = Math.max(intervalDays + fuzz, intervalDays); 
                }
                
                nextDue = now.plusDays(intervalDays).withHour(0).withMinute(0);
                repetitions++;
            }
        }

        progress.setEaseFactor(new BigDecimal(String.valueOf(ease)).setScale(2, RoundingMode.HALF_UP));
        progress.setIntervalDays(intervalDays);
        progress.setRepetitions(repetitions);
        progress.setLearningStep(learningStep);
        progress.setDueAt(nextDue);
        progress.setAlgorithmVersion("SM2_ADVANCED");

        progress.setLastReviewedAt(now);
        progress.setLastRating(rating);
        progress.setTotalReviews((progress.getTotalReviews() != null ? progress.getTotalReviews() : 0) + 1);

        switch (rating) {
            case 1 -> progress.setAgainCount((progress.getAgainCount() != null ? progress.getAgainCount() : 0) + 1);
            case 2 -> progress.setHardCount((progress.getHardCount() != null ? progress.getHardCount() : 0) + 1);
            case 3 -> {
                progress.setGoodCount((progress.getGoodCount() != null ? progress.getGoodCount() : 0) + 1);
                progress.setCorrectCount((progress.getCorrectCount() != null ? progress.getCorrectCount() : 0) + 1);
            }
            case 4 -> {
                progress.setEasyCount((progress.getEasyCount() != null ? progress.getEasyCount() : 0) + 1);
                progress.setCorrectCount((progress.getCorrectCount() != null ? progress.getCorrectCount() : 0) + 1);
            }
        }
    }
}
