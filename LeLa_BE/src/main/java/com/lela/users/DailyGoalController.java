package com.lela.users;

import com.lela.users.dto.DailyGoalRequest;
import com.lela.users.dto.DailyGoalStatusResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me/daily-goal")
@RequiredArgsConstructor
public class DailyGoalController {

    private final DailyGoalService dailyGoalService;

    @GetMapping
    public ResponseEntity<DailyGoalStatusResponse> getDailyGoalStatus() {
        return ResponseEntity.ok(dailyGoalService.getDailyGoalStatus());
    }

    @PostMapping
    public ResponseEntity<DailyGoalStatusResponse> confirmDailyGoal(@Valid @RequestBody DailyGoalRequest request) {
        return ResponseEntity.ok(dailyGoalService.confirmDailyGoal(request));
    }
}
