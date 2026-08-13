package com.lela.reviewsession;

import com.lela.common.ApiResponse;
import com.lela.reviewsession.dto.ReviewSessionRequest;
import com.lela.reviewsession.dto.ReviewSessionResponse;
import com.lela.srsreview.dto.SyncReviewRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/review-sessions")
@RequiredArgsConstructor
public class ReviewSessionController {

    private final ReviewSessionService reviewSessionService;

    private static final String MSG_START_SUCCESS = "Khởi tạo phiên ôn tập thành công.";
    private static final String MSG_SYNC_SUCCESS = "Đồng bộ dữ liệu phiên ôn tập thành công.";
    private static final String MSG_FETCH_SUCCESS = "Tải thông tin phiên ôn tập thành công.";
    private static final String MSG_ABANDON_SUCCESS = "Đã huỷ phiên ôn tập thành công.";
    private static final String MSG_STATS_SUCCESS = "Tải số liệu thống kê thành công.";

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<ReviewSessionResponse>> startSession(@RequestBody ReviewSessionRequest request) {
        ReviewSessionResponse response = reviewSessionService.startSession(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, MSG_START_SUCCESS));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Void>> syncOfflineReviews(@RequestBody SyncReviewRequest request) {
        reviewSessionService.syncOfflineReviews(request);
        return ResponseEntity.ok(ApiResponse.successMessage(MSG_SYNC_SUCCESS));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<ReviewSessionResponse>> getCurrentSession() {
        ReviewSessionResponse response = reviewSessionService.getCurrentSession();
        return ResponseEntity.ok(ApiResponse.success(response, MSG_FETCH_SUCCESS));
    }

    @PostMapping("/{publicId}/abandon")
    public ResponseEntity<ApiResponse<Void>> abandonSession(@PathVariable String publicId) {
        reviewSessionService.abandonSession(publicId);
        return ResponseEntity.ok(ApiResponse.successMessage(MSG_ABANDON_SUCCESS));
    }

    @GetMapping("/stats/today")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayStats() {
        Map<String, Object> stats = reviewSessionService.getTodayStats();
        return ResponseEntity.ok(ApiResponse.success(stats, MSG_STATS_SUCCESS));
    }

    @GetMapping("/stats/weekly")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWeeklyStats() {
        Map<String, Object> stats = reviewSessionService.getWeeklyStats();
        return ResponseEntity.ok(ApiResponse.success(stats, MSG_STATS_SUCCESS));
    }
}