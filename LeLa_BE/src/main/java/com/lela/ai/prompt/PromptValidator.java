package com.lela.ai.prompt;

import com.lela.ai.exception.AiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PromptValidator {

    private final TopicClassifier topicClassifier;

    public void validatePrompt(String userPrompt) {
        if (topicClassifier.isOffTopic(userPrompt)) {
            throw new AiException("I'm YoEdu AI, an English learning assistant. I can only answer questions related to learning English. Please ask about vocabulary, grammar, pronunciation, translation, writing, speaking, reading, listening, or other English learning topics.");
        }
    }
}
