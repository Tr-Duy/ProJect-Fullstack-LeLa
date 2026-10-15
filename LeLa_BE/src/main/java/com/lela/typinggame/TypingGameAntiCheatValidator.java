package com.lela.typinggame;

import com.lela.common.exception.BadRequestException;
import com.lela.typinggame.domain.TypingGameRun;
import com.lela.typinggame.domain.TypingWordResult;
import com.lela.typinggame.dto.TypingWordEventDto;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class TypingGameAntiCheatValidator {

    public static class StageValidationResult {
        private final boolean flaggedCheat;
        private final int calculatedScore;
        private final int currentCombo;
        private final int maxCombo;
        private final int wordsCleared;
        private final int wordsMissed;
        private final int totalKeystrokes;
        private final int wrongKeystrokes;
        private final int livesDelta;

        public StageValidationResult(boolean flaggedCheat, int calculatedScore, int currentCombo, int maxCombo,
                                     int wordsCleared, int wordsMissed, int totalKeystrokes,
                                     int wrongKeystrokes, int livesDelta) {
            this.flaggedCheat = flaggedCheat;
            this.calculatedScore = calculatedScore;
            this.currentCombo = currentCombo;
            this.maxCombo = maxCombo;
            this.wordsCleared = wordsCleared;
            this.wordsMissed = wordsMissed;
            this.totalKeystrokes = totalKeystrokes;
            this.wrongKeystrokes = wrongKeystrokes;
            this.livesDelta = livesDelta;
        }

        public boolean isFlaggedCheat() { return flaggedCheat; }
        public int getCalculatedScore() { return calculatedScore; }
        public int getCurrentCombo() { return currentCombo; }
        public int getMaxCombo() { return maxCombo; }
        public int getWordsCleared() { return wordsCleared; }
        public int getWordsMissed() { return wordsMissed; }
        public int getTotalKeystrokes() { return totalKeystrokes; }
        public int getWrongKeystrokes() { return wrongKeystrokes; }
        public int getLivesDelta() { return livesDelta; }
    }

    public StageValidationResult validateAndCalculateStage(
            TypingGameRun run,
            List<TypingWordEventDto> events,
            Map<Long, String> expectedWords,
            Map<Long, Boolean> heartWordsMap,
            long spawnIntervalMs,
            LocalDateTime now
    ) {
        if (run.getCurrentStageServedAt() == null) {
            throw new BadRequestException("Mốc thời gian phát mốc của server không tồn tại");
        }

        long elapsedServerMs = Math.max(0, Duration.between(run.getCurrentStageServedAt(), now).toMillis());
        int wordCount = events.size();

        // 1. Kiểm tra thời gian tối thiểu của mốc: hỗ trợ 2-4 làn rơi song song
        long minAllowedServerMs = (long) Math.max(0, wordCount - 1) * (spawnIntervalMs / 2) + 1L;
        if (elapsedServerMs < minAllowedServerMs) {
            throw new BadRequestException("Thời gian hoàn thành mốc quá nhanh so với tốc độ rơi của từ");
        }

        // 2. Kiểm tra tổng clientDurationMs <= elapsedServerMs * 4L + 5000ms (cho phép 4 làn rơi song song)
        long totalClientDurationMs = 0;
        for (TypingWordEventDto evt : events) {
            int duration = evt.getClientDurationMs() != null ? evt.getClientDurationMs() : 0;
            totalClientDurationMs += duration;
        }

        if (totalClientDurationMs > (elapsedServerMs * 4L + 5000L)) {
            throw new BadRequestException("Tổng thời lượng client báo cáo vượt quá thời gian thực của server");
        }

        int combo = run.getCurrentCombo();
        int maxCombo = run.getMaxCombo();
        int stageScore = 0;
        int wordsCleared = 0;
        int wordsMissed = 0;
        int totalKeystrokes = 0;
        int wrongKeystrokes = 0;
        int currentLives = run.getLivesLeft();
        int initialLives = currentLives;

        for (TypingWordEventDto evt : events) {
            String wordText = expectedWords.get(evt.getFlashcardId());
            if (wordText == null) {
                throw new BadRequestException("Thẻ ID " + evt.getFlashcardId() + " không thuộc mốc hiện tại");
            }

            int wordLen = wordText.length();
            int duration = evt.getClientDurationMs() != null ? evt.getClientDurationMs() : 0;
            int wrong = evt.getWrongKeystrokes() != null ? evt.getWrongKeystrokes() : 0;
            List<Integer> wrongIdxs = evt.getWrongAtIndexes() != null ? evt.getWrongAtIndexes() : List.of();

            // Validate wrongAtIndexes size and range
            if (wrongIdxs.size() != wrong) {
                throw new BadRequestException("Số lượng vị trí gõ sai không khớp với wrongKeystrokes");
            }
            for (Integer idx : wrongIdxs) {
                if (idx < 0 || idx >= wordLen) {
                    throw new BadRequestException("Chỉ số gõ sai " + idx + " nằm ngoài độ dài từ " + wordLen);
                }
            }

            boolean isHeartWord = Boolean.TRUE.equals(heartWordsMap.get(evt.getFlashcardId()));

            if (evt.getResult() == TypingWordResult.CLEARED) {
                // Check ultra-fast duration
                if (duration < 200) {
                    throw new BadRequestException("Thời gian gõ từ ngắn bất thường (< 200ms)");
                }

                // Check typing speed > 15 chars/sec
                double durationSec = duration / 1000.0;
                double speedCharsPerSec = wordLen / durationSec;
                if (speedCharsPerSec > 15.0) {
                    throw new BadRequestException("Tốc độ gõ từ vượt ngưỡng tối đa cho phép (> 15 ký tự/giây)");
                }

                wordsCleared++;
                totalKeystrokes += (wordLen + wrong);
                wrongKeystrokes += wrong;

                // Tái tạo combo theo ký tự
                for (int i = 0; i < wordLen; i++) {
                    if (wrongIdxs.contains(i)) {
                        combo = 0;
                    } else {
                        combo++;
                        if (combo > maxCombo) {
                            maxCombo = combo;
                        }
                    }
                }

                // Điểm cơ bản cho từ: wordLen * 10
                int wordBaseScore = wordLen * 10;
                // Thưởng combo: combo >= 20 -> x3, combo >= 10 -> x2, else x1
                double multiplier = 1.0;
                if (combo >= 20) {
                    multiplier = 3.0;
                } else if (combo >= 10) {
                    multiplier = 2.0;
                }
                stageScore += (int) Math.round(wordBaseScore * multiplier);

                // Thưởng gõ hoàn hảo không lỗi: +50
                if (wrong == 0) {
                    stageScore += 50;
                }

                // Xử lý từ mang tim khi hạ thành công:
                if (isHeartWord) {
                    if (currentLives < 5) {
                        currentLives++;
                    } else {
                        stageScore += 100; // Đã đủ 5 tim -> thưởng 100 điểm
                    }
                }

            } else if (evt.getResult() == TypingWordResult.MISSED) {
                wordsMissed++;
                wrongKeystrokes += wrong;
                totalKeystrokes += wrong;
                // Từ chạm đáy: reset combo
                combo = 0;
                // Mất 1 tim bất kể có mang tim hay không
                if (currentLives > 0) {
                    currentLives--;
                }
            }
        }

        int livesDelta = currentLives - initialLives;

        return new StageValidationResult(
                false,
                stageScore,
                combo,
                maxCombo,
                wordsCleared,
                wordsMissed,
                totalKeystrokes,
                wrongKeystrokes,
                livesDelta
        );
    }
}
