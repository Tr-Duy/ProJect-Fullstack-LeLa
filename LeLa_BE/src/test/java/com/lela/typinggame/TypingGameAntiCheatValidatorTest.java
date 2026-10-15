package com.lela.typinggame;

import com.lela.common.exception.BadRequestException;
import com.lela.typinggame.domain.TypingGameMode;
import com.lela.typinggame.domain.TypingGameRun;
import com.lela.typinggame.domain.TypingWordResult;
import com.lela.typinggame.dto.TypingWordEventDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TypingGameAntiCheatValidatorTest {

    private TypingGameAntiCheatValidator validator;
    private TypingGameRun run;
    private LocalDateTime baseTime;

    @BeforeEach
    void setUp() {
        validator = new TypingGameAntiCheatValidator();
        baseTime = LocalDateTime.of(2026, 10, 13, 10, 0, 0);

        run = TypingGameRun.builder()
                .mode(TypingGameMode.EASY)
                .livesLeft(3)
                .score(0)
                .currentCombo(0)
                .maxCombo(0)
                .currentStageServedAt(baseTime)
                .build();
    }

    @Test
    @DisplayName("Gõ hợp lệ - Tính combo và điểm số chính xác")
    void testValidStageCompletion() {
        LocalDateTime now = baseTime.plusSeconds(10); // 10 giây trôi qua

        Map<Long, String> expectedWords = Map.of(
                1L, "cat",
                2L, "dog"
        );
        Map<Long, Boolean> heartWords = Map.of(
                1L, false,
                2L, false
        );

        List<TypingWordEventDto> events = List.of(
                TypingWordEventDto.builder()
                        .flashcardId(1L)
                        .result(TypingWordResult.CLEARED)
                        .wrongKeystrokes(0)
                        .wrongAtIndexes(List.of())
                        .clientDurationMs(1200)
                        .build(),
                TypingWordEventDto.builder()
                        .flashcardId(2L)
                        .result(TypingWordResult.CLEARED)
                        .wrongKeystrokes(0)
                        .wrongAtIndexes(List.of())
                        .clientDurationMs(1100)
                        .build()
        );

        TypingGameAntiCheatValidator.StageValidationResult result = validator.validateAndCalculateStage(
                run,
                events,
                expectedWords,
                heartWords,
                2000L,
                now
        );

        assertFalse(result.isFlaggedCheat());
        assertEquals(2, result.getWordsCleared());
        assertEquals(0, result.getWordsMissed());
        assertEquals(6, result.getCurrentCombo()); // 'c','a','t' (3) + 'd','o','g' (3) = 6
        assertEquals(6, result.getMaxCombo());
        assertTrue(result.getCalculatedScore() > 0);
    }

    @Test
    @DisplayName("Phát hiện gian lận - Thời gian hoàn thành mốc quá nhanh so với tốc độ spawn")
    void testTooFastStageCompletion() {
        LocalDateTime now = baseTime.plusSeconds(1); // 1 giây cho 2 từ với spawn 2000ms

        Map<Long, String> expectedWords = Map.of(
                1L, "apple",
                2L, "banana"
        );
        Map<Long, Boolean> heartWords = Map.of(1L, false, 2L, false);

        List<TypingWordEventDto> events = List.of(
                TypingWordEventDto.builder()
                        .flashcardId(1L)
                        .result(TypingWordResult.CLEARED)
                        .wrongKeystrokes(0)
                        .wrongAtIndexes(List.of())
                        .clientDurationMs(400)
                        .build(),
                TypingWordEventDto.builder()
                        .flashcardId(2L)
                        .result(TypingWordResult.CLEARED)
                        .wrongKeystrokes(0)
                        .wrongAtIndexes(List.of())
                        .clientDurationMs(400)
                        .build()
        );

        assertThrows(BadRequestException.class, () ->
                validator.validateAndCalculateStage(run, events, expectedWords, heartWords, 2000L, now)
        );
    }

    @Test
    @DisplayName("Phát hiện gõ siêu tốc > 15 ký tự / giây")
    void testSpeedExceedsMaxCharsPerSecond() {
        LocalDateTime now = baseTime.plusSeconds(5);

        Map<Long, String> expectedWords = Map.of(1L, "congratulations"); // 15 ký tự
        Map<Long, Boolean> heartWords = Map.of(1L, false);

        List<TypingWordEventDto> events = List.of(
                TypingWordEventDto.builder()
                        .flashcardId(1L)
                        .result(TypingWordResult.CLEARED)
                        .wrongKeystrokes(0)
                        .wrongAtIndexes(List.of())
                        .clientDurationMs(300) // 15 ký tự trong 300ms = 50 ký tự/giây
                        .build()
        );

        assertThrows(BadRequestException.class, () ->
                validator.validateAndCalculateStage(run, events, expectedWords, heartWords, 1000L, now)
        );
    }

    @Test
    @DisplayName("Kiểm tra hạ từ mang tim khi chưa đủ 5 tim -> được cộng tim")
    void testHeartWordIncreasesLife() {
        LocalDateTime now = baseTime.plusSeconds(5);

        Map<Long, String> expectedWords = Map.of(1L, "love");
        Map<Long, Boolean> heartWords = Map.of(1L, true);

        List<TypingWordEventDto> events = List.of(
                TypingWordEventDto.builder()
                        .flashcardId(1L)
                        .result(TypingWordResult.CLEARED)
                        .wrongKeystrokes(0)
                        .wrongAtIndexes(List.of())
                        .clientDurationMs(1500)
                        .build()
        );

        TypingGameAntiCheatValidator.StageValidationResult result = validator.validateAndCalculateStage(
                run, events, expectedWords, heartWords, 1000L, now
        );

        assertEquals(1, result.getLivesDelta());
    }

    @Test
    @DisplayName("Từ chạm đáy MISSED -> trừ 1 tim và reset combo")
    void testMissedWordDecreasesLifeAndResetsCombo() {
        run.setCurrentCombo(15);
        LocalDateTime now = baseTime.plusSeconds(5);

        Map<Long, String> expectedWords = Map.of(1L, "missed");
        Map<Long, Boolean> heartWords = Map.of(1L, false);

        List<TypingWordEventDto> events = List.of(
                TypingWordEventDto.builder()
                        .flashcardId(1L)
                        .result(TypingWordResult.MISSED)
                        .wrongKeystrokes(1)
                        .wrongAtIndexes(List.of(0))
                        .clientDurationMs(2000)
                        .build()
        );

        TypingGameAntiCheatValidator.StageValidationResult result = validator.validateAndCalculateStage(
                run, events, expectedWords, heartWords, 1000L, now
        );

        assertEquals(-1, result.getLivesDelta());
        assertEquals(0, result.getCurrentCombo());
        assertEquals(1, result.getWordsMissed());
    }
}
