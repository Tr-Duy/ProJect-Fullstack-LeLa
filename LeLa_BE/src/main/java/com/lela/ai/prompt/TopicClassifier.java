package com.lela.ai.prompt;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TopicClassifier {
    
    // Hardcoded list of strictly forbidden keywords for fast heuristic rejection
    private static final List<String> FORBIDDEN_KEYWORDS = List.of(
            "bitcoin", "crypto", "stock", "invest", "politics", "election",
            "medical diagnosis", "cancer", "symptom", "hack", "bypass",
            "password", "recipe", "cook", "travel plan", "movie review"
    );

    /**
     * Very basic heuristic check. The LLM prompt instructions also instruct Gemini to reject.
     * This just acts as a fast-fail filter before making the API call.
     */
    public boolean isOffTopic(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return false;
        }
        String lowerMsg = userMessage.toLowerCase();
        for (String keyword : FORBIDDEN_KEYWORDS) {
            if (lowerMsg.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
