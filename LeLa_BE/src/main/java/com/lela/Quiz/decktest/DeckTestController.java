package com.lela.Quiz.decktest;

import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/deck-tests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('LEARNER','ADMIN')")
public class DeckTestController {

    private final DeckTestService deckTestService;
    private final TimedQuizEngine timedQuizEngine;

    @GetMapping("/{deckId}/status")
    public ApiResponse<DeckTestStatusResponse> getDeckTestStatus(@PathVariable Long deckId) {
        return ApiResponse.success(deckTestService.getDeckTestStatus(deckId));
    }

    @GetMapping("/my-overview")
    public ApiResponse<List<DeckTestStatusResponse>> getMyDeckTestsOverview() {
        return ApiResponse.success(deckTestService.getMyDeckTestsOverview());
    }

    @PostMapping("/{deckId}/start")
    public ApiResponse<TimedQuizEngine.View> startDeckTest(@PathVariable Long deckId) {
        return ApiResponse.success(deckTestService.startDeckTest(deckId));
    }

    @PostMapping("/{attemptId}/event")
    public ApiResponse<TimedQuizEngine.View> event(@PathVariable Long attemptId, @RequestBody TimedQuizEngine.Event event) {
        return ApiResponse.success(timedQuizEngine.event(attemptId, event));
    }

    @PostMapping("/{attemptId}/submit")
    public ApiResponse<QuizAttemptDetailResponse> submitDeckTest(@PathVariable Long attemptId, @RequestBody(required = false) QuizSubmitRequest request) {
        return ApiResponse.success(deckTestService.submitDeckTest(attemptId, request != null ? request : new QuizSubmitRequest()));
    }
}
