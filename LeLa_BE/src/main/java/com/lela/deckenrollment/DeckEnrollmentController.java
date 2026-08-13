package com.lela.deckenrollment;

import com.lela.common.ApiResponse;
import com.lela.deckenrollment.dto.DeckEnrollmentRequest;
import com.lela.deckenrollment.dto.DeckEnrollmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/enrollments")
@RequiredArgsConstructor
public class DeckEnrollmentController {

    private final DeckEnrollmentService deckEnrollmentService;

    private static final String MSG_ENROLL_SUCCESS = "Đăng ký tham gia bộ thẻ học thành công.";
    private static final String MSG_UPDATE_SUCCESS = "Cập nhật trạng thái học tập thành công.";
    private static final String MSG_FETCH_LIST_SUCCESS = "Tải danh sách đăng ký học thành công.";
    private static final String MSG_FETCH_REVIEW_SUCCESS = "Tải danh sách lịch hẹn ôn tập hôm nay thành công.";

    @PostMapping(value = "/decks/{deckId}/enroll")
    public ResponseEntity<ApiResponse<DeckEnrollmentResponse>> enrollDeck(@PathVariable Long deckId, @RequestBody(required = false) DeckEnrollmentRequest request) {
        if (request == null) request = new DeckEnrollmentRequest();
        request.setDeckId(deckId);
        DeckEnrollmentResponse response = deckEnrollmentService.enrollDeck(request);
        return ResponseEntity.ok(ApiResponse.success(response, MSG_ENROLL_SUCCESS));
    }

    @PatchMapping("/decks/{deckId}/status")
    public ResponseEntity<ApiResponse<DeckEnrollmentResponse>> updateStatus(@PathVariable Long deckId, @RequestBody DeckEnrollmentRequest request) {
        request.setDeckId(deckId);
        DeckEnrollmentResponse response = deckEnrollmentService.updateStatus(request);
        return ResponseEntity.ok(ApiResponse.success(response, MSG_UPDATE_SUCCESS));
    }

    @GetMapping("/my-list")
    public ResponseEntity<ApiResponse<Page<DeckEnrollmentResponse>>> getUserEnrollList(Pageable pageable) {
        Page<DeckEnrollmentResponse> data = deckEnrollmentService.getUserEnrollList(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_FETCH_LIST_SUCCESS));
    }

    @GetMapping("/today-reviews")
    public ResponseEntity<ApiResponse<Page<DeckEnrollmentResponse>>> getReviewToday(Pageable pageable) {
        Page<DeckEnrollmentResponse> data = deckEnrollmentService.getReviewToday(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_FETCH_REVIEW_SUCCESS));
    }
}