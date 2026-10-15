package com.lela.voice.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.voice.domain.ConversationSession;
import com.lela.voice.repository.ConversationSessionRepository;
import com.lela.voice.service.VoiceAiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test tích hợp toàn trình start -> turn -> finish trên môi trường thật (KHÔNG @Transactional bao ngoài test).
 * Chứng minh lỗi LazyInitializationException hoàn toàn được khắc phục khi session Hibernate đã đóng ở tầng Controller.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class VoiceConversationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private ConversationSessionRepository sessionRepository;

    @Autowired
    private CardProgressRepository cardProgressRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @MockBean
    private VoiceAiService voiceAiService;

    private Users testUser;

    @BeforeEach
    void setUp() {
        testUser = usersRepository.findByUsername("admin")
                .orElseThrow(() -> new IllegalStateException("Test user admin not found"));

        // Hủy bất kỳ session IN_PROGRESS nào trước đó để không bị kẹt hạn mức
        sessionRepository.findInProgressSessionByUserId(testUser.getId())
                .ifPresent(s -> {
                    s.setStatus("ABANDONED");
                    s.setEndedAt(LocalDateTime.now());
                    sessionRepository.save(s);
                });

        // Đảm bảo user có ít nhất 20 thẻ đã học trong card_progress để thỏa điều kiện mở khóa & chọn từ
        List<CardProgress> existing = cardProgressRepository.findAllByUserId(testUser.getId());
        if (existing.size() < 20) {
            List<Flashcard> cards = flashcardRepository.findAll();
            for (int i = 0; i < Math.min(25, cards.size()); i++) {
                Flashcard card = cards.get(i);
                if (cardProgressRepository.findByUserIdAndCardId(testUser.getId(), card.getId()).isEmpty()) {
                    CardProgress cp = new CardProgress();
                    cp.setUser(testUser);
                    cp.setCard(card);
                    cp.setState(CardProgressState.REVIEW);
                    cp.setLapseCount(1);
                    cp.setAgainCount(0);
                    cardProgressRepository.save(cp);
                }
            }
        }

        // Mock VoiceAiService để phản hồi ngay lập tức mà không phụ thuộc network API Gemini bên ngoài
        when(voiceAiService.generateTurnResponse(any(), anyInt(), anyString(), anyList(), anySet(), anyList()))
                .thenReturn(VoiceAiService.TurnAiOutput.builder()
                        .aiReply("Welcome to Grand LeLa Hotel! How may I assist you with your booking today?")
                        .grammarErrors(Collections.emptyList())
                        .correctedSentence("I would like to reserve a hotel room.")
                        .quickSuggestion("Could you tell me the room rate?")
                        .tokensUsed(120)
                        .build());
    }

    @Test
    @WithMockUser(username = "admin")
    @DisplayName("E2E không có @Transactional: start -> turn -> finish hoàn thành trơn tru không bị LazyInitializationException")
    void testFullConversationFlowWithoutLazyInitializationException() throws Exception {

        // 1. POST /api/v1/voice-conversations/sessions/start
        MvcResult startResult = mockMvc.perform(post("/api/v1/voice-conversations/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicId").exists())
                .andExpect(jsonPath("$.targetWords").isArray())
                .andReturn();

        JsonNode startNode = objectMapper.readTree(startResult.getResponse().getContentAsString());
        String publicId = startNode.get("publicId").asText();
        assertThat(publicId).isNotBlank();
        assertThat(startNode.get("targetWords").size()).isGreaterThanOrEqualTo(3);

        // Kiểm tra DTO của từng target word được map đầy đủ thông tin từ Flashcard
        JsonNode firstWord = startNode.get("targetWords").get(0);
        assertThat(firstWord.get("flashcardId").asLong()).isPositive();
        assertThat(firstWord.get("word").asText()).isNotBlank();
        assertThat(firstWord.get("meaning")).isNotNull();

        // 2. GET /api/v1/voice-conversations/status
        mockMvc.perform(get("/api/v1/voice-conversations/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasInProgressSession").value(true))
                .andExpect(jsonPath("$.inProgressPublicId").value(publicId));

        // 3. POST /api/v1/voice-conversations/sessions/{publicId}/turns
        String turnPayload = """
                {
                    "transcript": "Hello, I want to reserve a deluxe room for two nights.",
                    "sttConfidence": 0.96,
                    "isRetry": false
                }
                """;

        MvcResult turnResult = mockMvc.perform(post("/api/v1/voice-conversations/sessions/" + publicId + "/turns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(turnPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.turnNumber").value(1))
                .andExpect(jsonPath("$.aiReply").isNotEmpty())
                .andExpect(jsonPath("$.updatedTargetWords").isArray())
                .andExpect(jsonPath("$.sessionEnded").value(false))
                .andReturn();

        JsonNode turnNode = objectMapper.readTree(turnResult.getResponse().getContentAsString());
        assertThat(turnNode.get("updatedTargetWords").size()).isGreaterThanOrEqualTo(3);
        assertThat(turnNode.get("updatedTargetWords").get(0).get("meaning")).isNotNull();

        // 4. POST /api/v1/voice-conversations/sessions/{publicId}/finish
        String finishPayload = """
                {
                    "feedback": "COMFORTABLE"
                }
                """;

        MvcResult finishResult = mockMvc.perform(post("/api/v1/voice-conversations/sessions/" + publicId + "/finish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(finishPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicId").value(publicId))
                .andExpect(jsonPath("$.targetWords").isArray())
                .andExpect(jsonPath("$.overallScore").isNumber())
                .andReturn();

        JsonNode finishNode = objectMapper.readTree(finishResult.getResponse().getContentAsString());
        assertThat(finishNode.get("targetWords").size()).isGreaterThanOrEqualTo(3);
        assertThat(finishNode.get("targetWords").get(0).get("flashcardId").asLong()).isPositive();

        // 5. Kiểm tra session trong DB đã chuyển sang COMPLETED
        ConversationSession saved = sessionRepository.findByPublicId(publicId).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo("COMPLETED");
    }
}
