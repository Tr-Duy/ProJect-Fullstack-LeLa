package com.lela.Quiz.decktest;

import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;

import java.util.List;

public interface DeckTestService {
    DeckTestStatusResponse getDeckTestStatus(Long deckId);
    List<DeckTestStatusResponse> getMyDeckTestsOverview();
    TimedQuizEngine.View startDeckTest(Long deckId);
    QuizAttemptDetailResponse submitDeckTest(Long attemptId, QuizSubmitRequest request);
}
