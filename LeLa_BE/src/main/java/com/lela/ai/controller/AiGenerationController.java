package com.lela.ai.controller;

import com.lela.ai.service.AiQuizGeneratorService;
import com.lela.Quiz.dto.QuizResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai/generate")
@RequiredArgsConstructor
public class AiGenerationController {

    private final AiQuizGeneratorService aiQuizGeneratorService;

    @PostMapping("/quiz")
    public ResponseEntity<QuizResponse> generateQuiz(
            @RequestParam String topic, 
            @RequestParam(defaultValue = "5") int numberOfQuestions,
            @RequestParam Long targetDeckId) {
        QuizResponse generatedQuiz = aiQuizGeneratorService.generateAndSaveQuiz(topic, numberOfQuestions, targetDeckId);
        return ResponseEntity.ok(generatedQuiz);
    }
}
