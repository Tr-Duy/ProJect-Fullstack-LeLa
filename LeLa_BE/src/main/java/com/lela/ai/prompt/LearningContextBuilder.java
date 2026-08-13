package com.lela.ai.prompt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.AiContextDto;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class LearningContextBuilder {

    private final ObjectMapper objectMapper;

    public String buildContextForUser(Users user) {
        try {
            // In a full implementation, we'd query CardProgress, QuizAttempt, etc.
            AiContextDto context = AiContextDto.builder()
                    .fullName(user.getFullName())
                    .cefrLevel(user.getTargetLanguage() != null ? user.getTargetLanguage().getName() : "Unknown")
                    .xp(user.getXpTotal() != null ? user.getXpTotal() : 0)
                    .streak(user.getStreakCurrent() != null ? user.getStreakCurrent() : 0)
                    .dailyGoalCards(user.getDailyGoalCards() != null ? user.getDailyGoalCards() : 0)
                    .weakVocabulary(List.of("achieve", "procrastinate")) // Mocked example
                    .weakGrammar(List.of("Past Perfect", "Conditionals")) // Mocked example
                    .build();

            return objectMapper.writeValueAsString(context);
        } catch (Exception e) {
            log.error("Error building context", e);
            return "{}";
        }
    }
}
