package com.lela.finallevelassessment.controller;

import com.lela.common.ApiResponse;
import com.lela.finallevelassessment.dto.FinalLevelAssessmentResponse;
import com.lela.finallevelassessment.service.FinalLevelAssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/final-level-tests")
public class FinalLevelAssessmentController {

    @Autowired
    private FinalLevelAssessmentService assessmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<FinalLevelAssessmentResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(assessmentService.getAssessmentOverview()));
    }

    @PostMapping("/reset-cycle")
    public ResponseEntity<ApiResponse<FinalLevelAssessmentResponse>> resetCycle() {
        return ResponseEntity.ok(ApiResponse.success(assessmentService.resetCycle()));
    }

    @PostMapping("/complete-deck/{deckId}")
    public ResponseEntity<ApiResponse<FinalLevelAssessmentResponse>> completeDeck(@PathVariable Long deckId) {
        return ResponseEntity.ok(ApiResponse.success(assessmentService.simulateCompleteDeck(deckId)));
    }
}
