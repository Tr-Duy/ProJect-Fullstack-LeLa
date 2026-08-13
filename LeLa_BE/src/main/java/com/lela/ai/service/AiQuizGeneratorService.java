package com.lela.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.Quiz.QuizService;
import com.lela.Quiz.dto.QuizRequest;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.ai.dto.GeminiRequest;
import com.lela.ai.dto.GeminiResponse;
import com.lela.ai.exception.AiException;
import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.net.http.HttpResponse;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiQuizGeneratorService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final QuizService quizService;
    private final UsersRepository usersRepository;

    public QuizResponse generateAndSaveQuiz(String topic, int numberOfQuestions, Long targetDeckId) {
        String prompt = "You are a professional English teacher. Generate exactly " + numberOfQuestions + 
                " multiple-choice questions for the topic: '" + topic + "'.\n" +
                "You must return ONLY a raw JSON array of objects without any markdown formatting. " +
                "Each object must have the following keys:\n" +
                "- questionText (string)\n" +
                "- options (array of exactly 4 strings)\n" +
                "- correctOptionIndex (integer from 0 to 3)\n" +
                "- explanation (string explaining why the answer is correct)";

        GeminiRequest.Content userContent = GeminiRequest.Content.builder()
                .role("user")
                .parts(List.of(new GeminiRequest.Part(prompt)))
                .build();

        GeminiRequest request = GeminiRequest.builder()
                .contents(List.of(userContent))
                .generationConfig(GeminiRequest.GenerationConfig.builder()
                        .temperature(0.3)
                        .maxOutputTokens(2048)
                        .build())
                .build();

        try {
            HttpResponse<String> response = geminiClient.generateContent(request).join();
            
            if (response.statusCode() != 200) {
                throw new AiException("Failed to generate quiz. Gemini API returned: " + response.statusCode());
            }

            GeminiResponse geminiResponse = objectMapper.readValue(response.body(), GeminiResponse.class);
            String rawJson = geminiResponse.getCandidates().get(0).getContent().getParts().get(0).getText();
            
            // Cleanup markdown if AI ignores instruction
            if (rawJson.startsWith("```json")) {
                rawJson = rawJson.replace("```json", "").replace("```", "").trim();
            }

            List<GeneratedQuestion> generatedQuestions = objectMapper.readValue(rawJson, new TypeReference<List<GeneratedQuestion>>() {});
            
            return saveQuizToDatabase(topic, generatedQuestions, targetDeckId);
            
        } catch (Exception e) {
            log.error("Failed to generate quiz", e);
            throw new AiException("Could not generate or parse quiz: " + e.getMessage());
        }
    }

    private QuizResponse saveQuizToDatabase(String topic, List<GeneratedQuestion> questions, Long deckId) {
        Users currentUser = getCurrentUser();

        List<QuizQuestionRequest> questionRequests = questions.stream().map(gq -> {
            QuizQuestionRequest qr = new QuizQuestionRequest();
            qr.setQuestionText(gq.getQuestionText());
            qr.setExplanation(gq.getExplanation());
            qr.setQuestionType(com.lela.QuizQuestion.domain.QuestionType.MULTIPLE_CHOICE);
            qr.setPoints(1);
            qr.setDisplayOrder(0);
            qr.setIsActive(true);
            
            List<QuizQuestionOptionRequest> optionRequests = java.util.stream.IntStream.range(0, gq.getOptions().size())
                .mapToObj(i -> {
                    QuizQuestionOptionRequest or = new QuizQuestionOptionRequest();
                    or.setOptionText(gq.getOptions().get(i));
                    or.setIsCorrect(i == gq.getCorrectOptionIndex());
                    return or;
                }).toList();
                
            qr.setOptions(optionRequests);
            return qr;
        }).toList();

        QuizRequest quizRequest = QuizRequest.builder()
                .deckId(deckId)
                .createdById(currentUser.getId())
                .quizCode("AI-QUIZ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .title("AI Quiz: " + topic)
                .description("Auto-generated quiz by YoEdu AI on the topic of " + topic)
                .questions(questionRequests)
                .timeLimitSeconds(questions.size() * 60) // 1 minute per question
                .build();

        return quizService.create(quizRequest);
    }

    private Users getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .or(() -> usersRepository.findByEmail(username))
                .orElseThrow(() -> new AiException("User not found: " + username));
    }

    @lombok.Data
    static class GeneratedQuestion {
        private String questionText;
        private List<String> options;
        private int correctOptionIndex;
        private String explanation;
    }
}
