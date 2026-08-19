package com.lela.finallevelassessment.service;

import com.lela.finallevelassessment.dto.FinalLevelAssessmentResponse;

public interface FinalLevelAssessmentService {
    FinalLevelAssessmentResponse getAssessmentOverview();
    FinalLevelAssessmentResponse resetCycle();
    FinalLevelAssessmentResponse simulateCompleteDeck(Long deckId);
}
