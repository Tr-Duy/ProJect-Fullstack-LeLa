package com.lela.typinggame;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.typinggame.domain.TypingGameMode;
import com.lela.typinggame.domain.TypingGameRunStatus;
import com.lela.typinggame.domain.TypingWordResult;
import com.lela.typinggame.dto.CompleteStageRequest;
import com.lela.typinggame.dto.FinishTypingRunRequest;
import com.lela.typinggame.dto.StartTypingRunRequest;
import com.lela.typinggame.dto.TypingGameDeckDto;
import com.lela.typinggame.dto.TypingLeaderboardEntryDto;
import com.lela.typinggame.dto.TypingRunResponse;
import com.lela.typinggame.dto.TypingRunResultResponse;
import com.lela.typinggame.dto.TypingWordDto;
import com.lela.typinggame.dto.TypingWordEventDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TypingGameController.class)
@AutoConfigureMockMvc(addFilters = false)
public class TypingGameControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TypingGameService typingGameService;

    @MockitoBean
    private JwtService jwtService;

    private TypingRunResponse sampleRunResponse;

    @BeforeEach
    void setUp() {
        sampleRunResponse = TypingRunResponse.builder()
                .publicId("run-test-uuid")
                .deckId(1L)
                .deckTitle("3000 Oxford Words")
                .mode(TypingGameMode.EASY)
                .totalStages(5)
                .livesLeft(3)
                .currentStage(1)
                .currentCombo(0)
                .score(0)
                .spawnIntervalMs(3500L)
                .baseSpeed(1.0)
                .words(List.of(
                        TypingWordDto.builder()
                                .flashcardId(101L)
                                .word("apple")
                                .meaning("quả táo")
                                .phonetic("/ˈæpl/")
                                .wordLength(5)
                                .isHeartWord(false)
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/typing-game/decks - Lấy danh sách bộ thẻ thành công")
    void getDecks_Success() throws Exception {
        TypingGameDeckDto deckDto = TypingGameDeckDto.builder()
                .deckId(1L)
                .title("Oxford 3000")
                .description("Từ vựng thông dụng")
                .slug("oxford-3000")
                .totalCards(100)
                .totalStages(10)
                .requiresPro(false)
                .isLocked(false)
                .bestScoreEasy(500)
                .bestScoreHard(0)
                .build();

        Mockito.when(typingGameService.getDecks()).thenReturn(List.of(deckDto));

        mockMvc.perform(get("/typing-game/decks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].deckId").value(1L))
                .andExpect(jsonPath("$.data[0].title").value("Oxford 3000"));
    }

    @Test
    @DisplayName("POST /api/v1/typing-game/runs - Bắt đầu lượt chơi thành công")
    void startRun_Success() throws Exception {
        StartTypingRunRequest request = StartTypingRunRequest.builder()
                .deckId(1L)
                .mode(TypingGameMode.EASY)
                .build();

        Mockito.when(typingGameService.startRun(any(StartTypingRunRequest.class)))
                .thenReturn(sampleRunResponse);

        mockMvc.perform(post("/typing-game/runs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.publicId").value("run-test-uuid"))
                .andExpect(jsonPath("$.data.mode").value("EASY"))
                .andExpect(jsonPath("$.data.livesLeft").value(3));
    }

    @Test
    @DisplayName("GET /api/v1/typing-game/runs/{publicId} - Lấy chi tiết run thành công")
    void getRun_Success() throws Exception {
        Mockito.when(typingGameService.getRun("run-test-uuid")).thenReturn(sampleRunResponse);

        mockMvc.perform(get("/typing-game/runs/run-test-uuid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.publicId").value("run-test-uuid"));
    }

    @Test
    @DisplayName("POST /api/v1/typing-game/runs/{publicId}/stages/{stageNo}/complete - Hoàn thành mốc")
    void completeStage_Success() throws Exception {
        CompleteStageRequest request = CompleteStageRequest.builder()
                .events(List.of(
                        TypingWordEventDto.builder()
                                .flashcardId(101L)
                                .result(TypingWordResult.CLEARED)
                                .wrongKeystrokes(0)
                                .wrongAtIndexes(List.of())
                                .clientDurationMs(1500)
                                .build()
                ))
                .build();

        Mockito.when(typingGameService.completeStage(eq("run-test-uuid"), eq(1), any(CompleteStageRequest.class)))
                .thenReturn(sampleRunResponse);

        mockMvc.perform(post("/typing-game/runs/run-test-uuid/stages/1/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.publicId").value("run-test-uuid"));
    }

    @Test
    @DisplayName("POST /api/v1/typing-game/runs/{publicId}/finish - Kết thúc lượt chơi và nhận kết quả")
    void finishRun_Success() throws Exception {
        FinishTypingRunRequest request = FinishTypingRunRequest.builder()
                .reason("VICTORY")
                .events(List.of())
                .build();

        TypingRunResultResponse resultResponse = TypingRunResultResponse.builder()
                .publicId("run-test-uuid")
                .deckId(1L)
                .deckTitle("3000 Oxford Words")
                .mode(TypingGameMode.EASY)
                .status(TypingGameRunStatus.COMPLETED)
                .score(1250)
                .stageReached(5)
                .totalStages(5)
                .wordsCleared(50)
                .wordsMissed(0)
                .accuracy(new BigDecimal("98.50"))
                .wpm(new BigDecimal("45.20"))
                .maxCombo(25)
                .xpEarned(120)
                .dailyXpRemaining(30)
                .isNewHighScore(true)
                .reviewWords(List.of())
                .build();

        Mockito.when(typingGameService.finishRun(eq("run-test-uuid"), any(FinishTypingRunRequest.class)))
                .thenReturn(resultResponse);

        mockMvc.perform(post("/typing-game/runs/run-test-uuid/finish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.score").value(1250))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("POST /api/v1/typing-game/runs/{publicId}/abandon - Hủy lượt chơi")
    void abandonRun_Success() throws Exception {
        Mockito.doNothing().when(typingGameService).abandonRun("run-test-uuid");

        mockMvc.perform(post("/typing-game/runs/run-test-uuid/abandon"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã hủy lượt chơi"));
    }

    @Test
    @DisplayName("GET /api/v1/typing-game/high-scores - Xem bảng điểm cao an toàn")
    void getHighScores_Success() throws Exception {
        TypingLeaderboardEntryDto entry = TypingLeaderboardEntryDto.builder()
                .rank(1)
                .userId(99L)
                .displayName("Nguyen Van A")
                .avatarUrl("https://example.com/avatar.jpg")
                .score(2500)
                .stage(10)
                .wpm(new BigDecimal("62.50"))
                .accuracy(new BigDecimal("99.10"))
                .achievedAt(LocalDateTime.now())
                .build();

        Mockito.when(typingGameService.getHighScores(1L, TypingGameMode.EASY))
                .thenReturn(List.of(entry));

        mockMvc.perform(get("/typing-game/high-scores")
                        .param("deckId", "1")
                        .param("mode", "EASY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].rank").value(1))
                .andExpect(jsonPath("$.data[0].displayName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.data[0].score").value(2500));
    }
}
