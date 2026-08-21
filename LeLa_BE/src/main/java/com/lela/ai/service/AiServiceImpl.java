package com.lela.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.AiChatRequest;
import com.lela.ai.dto.GeminiRequest;
import com.lela.ai.dto.GeminiResponse;
import com.lela.ai.exception.AiException;
import com.lela.ai.prompt.LearningContextBuilder;
import com.lela.ai.prompt.PromptValidator;
import com.lela.ai.prompt.SystemPromptBuilder;
import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final PromptValidator promptValidator;
    private final SystemPromptBuilder systemPromptBuilder;
    private final LearningContextBuilder contextBuilder;
    private final GeminiClient geminiClient;
    private final UsersRepository usersRepository;
    private final ObjectMapper objectMapper;

    @Override
    public SseEmitter chat(AiChatRequest request) {
        // 1. Pre-validate Topic
        promptValidator.validatePrompt(request.getMessage());

        // 2. Fetch User & Build Context
        Users user = getCurrentUser();
        com.lela.ai.dto.AiContextDto contextDto = contextBuilder.buildContextObjectForUser(user);
        String contextJson = contextBuilder.buildContextForUser(user);
        String systemPrompt = systemPromptBuilder.buildPrompt();

        // 3. Build Gemini Request
        GeminiRequest.SystemInstruction instruction = GeminiRequest.SystemInstruction.builder()
                .parts(List.of(new GeminiRequest.Part(systemPrompt + "\n\nLearning Context:\n" + contextJson)))
                .build();
        
        GeminiRequest.Content userContent = GeminiRequest.Content.builder()
                .role("user")
                .parts(List.of(new GeminiRequest.Part(request.getMessage())))
                .build();

        GeminiRequest geminiReq = GeminiRequest.builder()
                .systemInstruction(instruction)
                .contents(List.of(userContent))
                .generationConfig(GeminiRequest.GenerationConfig.builder()
                        .temperature(0.7)
                        .maxOutputTokens(1024)
                        .build())
                .build();

        // 4. Setup SSE
        SseEmitter emitter = new SseEmitter(60000L); // 1 min timeout
        
        CompletableFuture.runAsync(() -> {
            boolean sentAnyChunk = false;
            try {
                var response = geminiClient.streamGenerateContent(geminiReq).join();

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body()))) {
                    String line;
                    StringBuilder jsonBuffer = new StringBuilder();
                    while ((line = reader.readLine()) != null) {
                        if (line.startsWith("data: ")) {
                            jsonBuffer.append(line.substring(6));
                        }
                        if (line.isBlank() && !jsonBuffer.isEmpty()) {
                            try {
                                String jsonStr = jsonBuffer.toString();
                                log.info("Gemini SSE Chunk: {}", jsonStr);
                                GeminiResponse geminiRes = objectMapper.readValue(jsonStr, GeminiResponse.class);
                                if (geminiRes.getCandidates() != null && !geminiRes.getCandidates().isEmpty()) {
                                    String text = geminiRes.getCandidates().get(0).getContent().getParts().get(0).getText();
                                    if (text != null) {
                                        emitter.send(SseEmitter.event().name("message").data(text));
                                        sentAnyChunk = true;
                                    }
                                }
                            } catch (Exception e) {
                                log.warn("Failed to parse chunk", e);
                            }
                            jsonBuffer.setLength(0);
                        }
                    }
                }
                emitter.complete();
            } catch (Exception e) {
                log.error("Streaming error from Gemini API: {}", e.getMessage());
                if (!sentAnyChunk) {
                    sendDataDrivenFallback(emitter, contextDto, request.getMessage());
                } else {
                    emitter.complete();
                }
            }
        });

        return emitter;
    }

    private void sendDataDrivenFallback(SseEmitter emitter, com.lela.ai.dto.AiContextDto context, String message) {
        try {
            String reply = generateResponseFromContext(context, message);
            String[] tokens = reply.split("(?<=\\s|\\n)");
            for (String token : tokens) {
                if (!token.isEmpty()) {
                    emitter.send(SseEmitter.event().name("message").data(token));
                    Thread.sleep(15);
                }
            }
            emitter.complete();
        } catch (Exception e) {
            log.error("Error sending data-driven fallback response", e);
            try {
                emitter.send(SseEmitter.event().name("message").data("AI Tutor đang gặp sự cố kết nối. Vui lòng thử lại sau!"));
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        }
    }

    private String generateResponseFromContext(com.lela.ai.dto.AiContextDto context, String prompt) {
        if (prompt == null) prompt = "";
        String lower = prompt.toLowerCase();

        // 1. Points / XP today or total
        if (lower.contains("điểm") || lower.contains("diem") || lower.contains("xp")) {
            if (lower.contains("hôm nay") || lower.contains("hom nay") || lower.contains("ngày hôm nay")) {
                int xp = (context.getToday() != null && context.getToday().getXpEarned() != null) ? context.getToday().getXpEarned() : 0;
                int cards = (context.getToday() != null && context.getToday().getCardsLearned() != null) ? context.getToday().getCardsLearned() : 0;
                return String.format("Hôm nay bạn đã tích lũy được **%d XP** trên LeLa! %s", 
                    xp, 
                    cards > 0 ? String.format("Bạn cũng đã học được **%d thẻ** từ vựng trong ngày.", cards) : "Hãy tiếp tục hoàn thành các bộ thẻ và bài test để ghi thêm điểm nhé!");
            } else {
                int totalXp = (context.getUser() != null && context.getUser().getTotalXp() != null) ? context.getUser().getTotalXp() : 0;
                int todayXp = (context.getToday() != null && context.getToday().getXpEarned() != null) ? context.getToday().getXpEarned() : 0;
                return String.format("Tổng điểm tích lũy của bạn trên LeLa hiện tại là **%d XP** (Trong đó hôm nay bạn đã kiếm được **%d XP**). Streak hiện tại: **%d ngày**.", 
                    totalXp, todayXp, (context.getUser() != null && context.getUser().getStreakDays() != null) ? context.getUser().getStreakDays() : 0);
            }
        }

        // 2. Cards learned today / total
        if (lower.contains("thẻ") || lower.contains("the") || lower.contains("flashcard") || lower.contains("từ vựng") || lower.contains("tu vung")) {
            if (lower.contains("hôm nay") || lower.contains("hom nay")) {
                int cards = (context.getToday() != null && context.getToday().getCardsLearned() != null) ? context.getToday().getCardsLearned() : 0;
                return String.format("Hôm nay bạn đã ghi nhớ được **%d thẻ từ vựng**. Cố gắng duy trì thói quen học mỗi ngày nhé!", cards);
            } else {
                int mastered = (context.getLearning() != null && context.getLearning().getMasteredCards() != null) ? context.getLearning().getMasteredCards() : 0;
                return String.format("Bạn đã thành thạo tổng cộng **%d thẻ từ vựng** ở trình độ hiện tại.", mastered);
            }
        }

        // 3. Level questions
        if (lower.contains("level") || lower.contains("trình độ") || lower.contains("trinh do") || lower.contains("mức độ") || lower.contains("muc do")) {
            String levelName = context.getLevel() != null ? context.getLevel().getName() : "Chưa xác định";
            String scoreRange = context.getLevel() != null ? context.getLevel().getScoreRange() : "TOEIC";
            return String.format("Trình độ hiện tại của bạn là **%s** (Thang điểm %s).", levelName, scoreRange);
        }

        // 4. Decks completed
        if (lower.contains("bộ thẻ") || lower.contains("bo the") || lower.contains("deck") || lower.contains("tiến độ") || lower.contains("tien do")) {
            int completed = (context.getLearning() != null && context.getLearning().getCompletedDecks() != null) ? context.getLearning().getCompletedDecks() : 0;
            int total = (context.getLearning() != null && context.getLearning().getTotalDecksInLevel() != null) ? context.getLearning().getTotalDecksInLevel() : 0;
            String currentDeck = context.getLearning() != null ? context.getLearning().getCurrentActiveDeck() : "Chưa có";
            return String.format("Bạn đã hoàn thành **%d/%d bộ thẻ** ở trình độ hiện tại. Bộ thẻ đang học tiếp theo: **%s**.", completed, total, currentDeck);
        }

        // 5. Exam eligibility & score
        if (lower.contains("thi") || lower.contains("kết thúc level") || lower.contains("ket thuc level") || lower.contains("điều kiện") || lower.contains("dieu kien")) {
            boolean eligible = context.getExam() != null && Boolean.TRUE.equals(context.getExam().getIsEligibleForExam());
            int completed = (context.getLearning() != null && context.getLearning().getCompletedDecks() != null) ? context.getLearning().getCompletedDecks() : 0;
            int required = (context.getExam() != null && context.getExam().getRequiredDecks() != null) ? context.getExam().getRequiredDecks() : 15;
            Integer recentScore = context.getExam() != null ? context.getExam().getRecentScorePercent() : null;
            String result = context.getExam() != null ? context.getExam().getRecentExamResult() : "NOT_TAKEN";

            StringBuilder sb = new StringBuilder();
            if (eligible) {
                sb.append(String.format("Chúc mừng! Bạn **ĐÃ ĐỦ ĐIỀU KIỆN** làm bài Thi Kết Thúc Level! (Đã học %d/%d bộ thẻ).\n", completed, required));
            } else {
                sb.append(String.format("Bạn **chưa đủ điều kiện** thi. Bạn đã hoàn thành %d/%d bộ thẻ yêu cầu. Hãy hoàn thành thêm %d bộ thẻ nữa nhé!\n", completed, required, Math.max(0, required - completed)));
            }
            if (recentScore != null) {
                sb.append(String.format("Kết quả bài thi gần nhất của bạn: **%d%%** (%s).", recentScore, "PASSED".equals(result) ? "ĐẠT" : "CHƯA ĐẠT"));
            }
            return sb.toString();
        }

        // 6. Generic response fallback
        String userName = (context.getUser() != null && context.getUser().getFullName() != null) ? context.getUser().getFullName() : "bạn";
        String levelName = context.getLevel() != null ? context.getLevel().getName() : "Chưa xác định";
        int todayXp = (context.getToday() != null && context.getToday().getXpEarned() != null) ? context.getToday().getXpEarned() : 0;
        int completed = (context.getLearning() != null && context.getLearning().getCompletedDecks() != null) ? context.getLearning().getCompletedDecks() : 0;
        int total = (context.getLearning() != null && context.getLearning().getTotalDecksInLevel() != null) ? context.getLearning().getTotalDecksInLevel() : 0;

        return String.format("Chào %s! Tôi là LeLa AI Tutor.\n\n" +
            "📊 **Thống kê học tập của bạn:**\n" +
            "- Trình độ: **%s**\n" +
            "- Điểm XP hôm nay: **%d XP**\n" +
            "- Tiến độ bộ thẻ: **%d/%d bộ**\n\n" +
            "Tôi có thể giúp bạn giải thích từ vựng, sửa lỗi câu, luyện ngữ pháp, dịch thuật hoặc theo dõi tiến độ học tập trên LeLa!", 
            userName, levelName, todayXp, completed, total);
    }

    private Users getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("====== AiServiceImpl.getCurrentUser() ======");
        log.info("Extracted username from SecurityContext: {}", username);
        
        return usersRepository.findByUsername(username)
                .or(() -> usersRepository.findByEmail(username))
                .orElseThrow(() -> new AiException("User not found: " + username));
    }
}
