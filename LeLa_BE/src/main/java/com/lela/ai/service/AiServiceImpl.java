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
            try {
                var response = geminiClient.streamGenerateContent(geminiReq).join();
                if (response.statusCode() != 200) {
                    // Try to read error body if available, but since it's already consumed in GeminiClient,
                    // we'll rely on the exception thrown by join() if it threw one. Wait, join() might not throw if we didn't throw in thenApply.
                    // Actually, thenApply throws an unchecked exception (CompletionException) which causes join() to throw.
                    // But here we are just checking statusCode() != 200.
                    // Wait, in GeminiClient I threw AiException, so join() will throw CompletionException wrapping AiException!
                    // So this block won't even be reached if statusCode >= 400!
                }

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
                log.error("Streaming error", e);
                emitter.completeWithError(e);
            }
        });

        return emitter;
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
