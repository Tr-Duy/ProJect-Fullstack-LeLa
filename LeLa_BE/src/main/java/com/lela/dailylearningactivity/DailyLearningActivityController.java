package com.lela.dailylearningactivity;

import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;
import com.lela.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/daily-activities")
@RequiredArgsConstructor
public class DailyLearningActivityController {

    private final DailyLearningActivityService service;

    private static final String MSG_LOG_SUCCESS = "Ghi nhận tiến độ học tập thành công.";
    private static final String MSG_FETCH_SUCCESS = "Tải tiến độ học tập hôm nay thành công.";

    @PostMapping("/log")
    public ResponseEntity<ApiResponse<DailyLearningActivityResponse>> logActivity(@RequestBody DailyLearningActivityRequest request) {
        DailyLearningActivityResponse response = service.logActivity(request);
        return ResponseEntity.ok(ApiResponse.success(response, MSG_LOG_SUCCESS));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<DailyLearningActivityResponse>> getTodayActivity() {
        DailyLearningActivityResponse response = service.getTodayActivity();
        return ResponseEntity.ok(ApiResponse.success(response, MSG_FETCH_SUCCESS));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<java.util.List<DailyLearningActivityResponse>>> getHistory(
            @RequestParam("startDate") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam("endDate") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        java.util.List<DailyLearningActivityResponse> data = service.getHistory(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data, "Tải lịch sử học tập thành công."));
    }
}