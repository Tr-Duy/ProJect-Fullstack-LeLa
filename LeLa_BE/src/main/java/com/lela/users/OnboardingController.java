package com.lela.users;

import com.lela.users.dto.ManualLevelSelectRequest;
import com.lela.users.dto.PlacementSubmitRequest;
import com.lela.users.dto.PlacementTestResult;
import com.lela.users.dto.UsersResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @PostMapping("/submit-placement")
    public ResponseEntity<PlacementTestResult> submitPlacement(@RequestBody PlacementSubmitRequest request) {
        return ResponseEntity.ok(onboardingService.processPlacementResult(request.getAttemptPublicId()));
    }

    @PostMapping("/manual-select")
    public ResponseEntity<UsersResponse> manualSelectLevel(@RequestBody ManualLevelSelectRequest request) {
        return ResponseEntity.ok(onboardingService.manualSelectLevel(request.getExamTypeId(), request.getLevelId()));
    }
}
