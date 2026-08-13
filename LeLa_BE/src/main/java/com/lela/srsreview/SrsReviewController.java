package com.lela.srsreview;

import com.lela.srsreview.dto.SrsReviewRequest;
import com.lela.srsreview.dto.SrsReviewResponse;
import com.lela.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/srs-reviews")
@RequiredArgsConstructor
public class SrsReviewController {

    private final SrsReviewService service;

    @PostMapping
    public ApiResponse<SrsReviewResponse> reviewCard(@RequestBody SrsReviewRequest request) {
        return ApiResponse.success(service.reviewCard(request), "Review submitted");
    }

    @GetMapping("/history")
    public ApiResponse<Page<SrsReviewResponse>> getReviewHistory(
            @RequestParam(required = false) Long userId,
            Pageable pageable) {
        return ApiResponse.success(service.getReviewHistory(userId, pageable));
    }

    @GetMapping("/statistics")
    public ApiResponse<Object> getReviewStatistics(@RequestParam(required = false) Long userId) {
        return ApiResponse.success(service.getReviewStatistics(userId), "Tải số liệu thống kê thành công");
    }
}
