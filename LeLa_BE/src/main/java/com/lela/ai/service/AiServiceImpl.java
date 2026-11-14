package com.lela.ai.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.*;
import com.lela.ai.exception.AiException;
import com.lela.ai.prompt.*;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.chat.*;
import com.lela.chat.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {
    private final PromptValidator promptValidator;
    private final SystemPromptBuilder systemPromptBuilder;
    private final LearningContextBuilder contextBuilder;
    private final TutorGenerationService generator;
    private final UsersRepository usersRepository;
    private final ObjectMapper objectMapper;
    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private record Turn(String text, CompletableFuture<AiChatResponse> result) {}
    private final ConcurrentHashMap<String, Turn> turns = new ConcurrentHashMap<>();
    @Value("${gemini.tutor-max-output-tokens:8192}")
    int maxOutputTokens = 8192;

    @Override
    public AiChatResponse chat(AiChatRequest request) {
        promptValidator.validatePrompt(request.getMessage());
        Users user = getCurrentUser();
        String clientId = request.getClientMessageId() == null ? UUID.randomUUID().toString() : request.getClientMessageId();
        String key = user.getId() + ":" + clientId;
        Turn turn = new Turn(request.getMessage(), new CompletableFuture<>());
        Turn existing = turns.putIfAbsent(key, turn);
        if (existing != null) {
            if (!Objects.equals(existing.text(), request.getMessage())) throw new AiException("TURN_CONFLICT", "Mã lượt chat đã được sử dụng.");
            return existing.result().join();
        }
        try {
            String context = promptContext(contextBuilder.buildContextObjectForUser(user));
            var contents = new ArrayList<GeminiRequest.Content>();
            if (request.getHistory() != null) for (var item : request.getHistory()) {
                contents.add(new GeminiRequest.Content(item.role(), List.of(new GeminiRequest.Part(item.text()))));
            }
            contents.add(new GeminiRequest.Content("user", List.of(new GeminiRequest.Part(request.getMessage()))));
            var geminiRequest = GeminiRequest.builder()
                    .systemInstruction(new GeminiRequest.SystemInstruction(List.of(new GeminiRequest.Part(
                            systemPromptBuilder.buildPrompt() + "\n\nDữ liệu học tập hiện tại:\n" + context))))
                    .contents(contents).generationConfig(GeminiRequest.GenerationConfig.builder()
                            .temperature(0.7).maxOutputTokens(maxOutputTokens).build()).build();
            AiChatResponse result = generator.generate(geminiRequest, UUID.randomUUID().toString());
            if (result.complete()) saveCompleteTurn(user, request.getMessage(), result);
            turn.result().complete(result);
            if (!result.complete()) turns.remove(key, turn);
            if (turns.size() > 256) turns.entrySet().removeIf(e -> !e.getKey().equals(key) && e.getValue().result().isDone());
            return result;
        } catch (Exception failure) {
            turn.result().completeExceptionally(failure);
            turns.remove(key, turn);
            throw failure instanceof RuntimeException runtime ? runtime : new AiException("AI_CONTEXT_ERROR", "Không thể chuẩn bị ngữ cảnh học tập.");
        }
    }
    private void saveCompleteTurn(Users user, String message, AiChatResponse result) {
        ChatConversation conversation = chatConversationRepository
                .findFirstByUserIdAndChannelTypeAndStatusOrderByCreatedAtDesc(user.getId(), "AI_TUTOR", ConversationStatus.OPEN)
                .orElseGet(() -> chatConversationRepository.save(ChatConversation.builder().user(user)
                        .channelType("AI_TUTOR").status(ConversationStatus.OPEN).isFallbackTriggered(false).build()));
        // saveAll is transactional: history contains the complete pair or neither message.
        chatMessageRepository.saveAll(List.of(
                ChatMessage.builder().conversation(conversation).senderType(SenderType.LEARNER).senderId(user.getId())
                        .content(message).isRead(true).isFallback(false).tokensUsed(0).build(),
                ChatMessage.builder().conversation(conversation).senderType(SenderType.AI).content(result.content())
                        .isRead(true).isFallback(false).tokensUsed(result.usageMetadata() == null || result.usageMetadata().getCandidatesTokenCount() == null
                                ? 0 : result.usageMetadata().getCandidatesTokenCount()).build()));
    }
    private Users getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username).or(() -> usersRepository.findByEmail(username))
                .orElseThrow(() -> new AiException("Không tìm thấy người dùng."));
    }
    private String promptContext(AiContextDto context) throws com.fasterxml.jackson.core.JsonProcessingException {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("Trình độ", context.getLevel() == null ? null : context.getLevel().getName());
        data.put("Khoảng điểm của cấp", context.getLevel() == null ? null : context.getLevel().getScoreRange());
        data.put("Tổng XP", context.getUser() == null ? null : context.getUser().getTotalXp());
        if (context.getUser()!=null) {
            data.put("Tên học viên",context.getUser().getFullName());
            data.put("Tên đăng nhập",context.getUser().getUsername());
            data.put("Chuỗi ngày học",context.getUser().getStreakDays());
        }
        if (context.getToday() != null) {
            var today=context.getToday();
            data.put("Thẻ hôm nay / mục tiêu", fraction(today.getCardsStudied(), today.getDailyGoalCards()));
            data.put("Thẻ mới hôm nay", today.getCardsLearned()); data.put("Thẻ ôn hôm nay", today.getReviewCount());
            data.put("XP hôm nay", today.getXpEarned());
            data.put("Số quiz hôm nay",today.getQuizCount());data.put("Số phút học hôm nay",today.getMinutesSpent());
        }
        if (context.getLearning() != null) {
            var learning=context.getLearning();
            var decks=new ArrayList<Map<String,Object>>();
            if (learning.getEnrolledDecks()!=null) for (var deck:learning.getEnrolledDecks()) {
                var row=new LinkedHashMap<String,Object>();row.put("Tên bộ thẻ",deck.title());
                row.put("Thẻ thành thạo / tổng thẻ",fraction(deck.masteredCards(),deck.totalCards()));decks.add(row);
            }
            data.put("Bộ thẻ đã đăng ký",decks); data.put("Bộ đã hoàn thành trong cấp hiện tại",learning.getCompletedDecks());
            data.put("Tổng bộ thẻ trong cấp hiện tại",learning.getTotalDecksInLevel());
            data.put("Tổng thẻ thành thạo trong cấp hiện tại",learning.getMasteredCards());
            data.put("Bộ đang học",learning.getCurrentActiveDeck());
        }
        if (context.getExam()!=null) {
            var exam=context.getExam();
            data.put("Quiz gần nhất: câu đúng / tổng câu",fraction(exam.getLatestCorrectAnswers(),exam.getLatestTotalQuestions()));
            data.put("Đủ điều kiện thi kết thúc cấp",exam.getIsEligibleForExam());data.put("Số bộ cần hoàn thành để thi",exam.getRequiredDecks());
            data.put("Điểm phần trăm thi kết thúc cấp gần nhất",exam.getRecentScorePercent());
            data.put("Kết quả thi kết thúc cấp gần nhất",exam.getRecentExamResult());
        }
        return objectMapper.writeValueAsString(data);
    }
    private String fraction(Integer numerator,Integer denominator) {
        return numerator==null || denominator==null ? "Chưa có dữ liệu" : numerator+"/"+denominator;
    }
}
