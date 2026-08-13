package com.lela.deckenrollment;

import com.lela.deckenrollment.dto.DeckEnrollmentRequest;
import com.lela.deckenrollment.dto.DeckEnrollmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeckEnrollmentService {

    /**
     * Đăng ký tham gia một bộ thẻ.
     */
    DeckEnrollmentResponse enrollDeck(DeckEnrollmentRequest request);

    /**
     * Cập nhật trạng thái học tập (PAUSED, COMPLETED, v.v.).
     */
    DeckEnrollmentResponse updateStatus(DeckEnrollmentRequest request);

    /**
     * Lấy danh sách các bộ thẻ người dùng đã đăng ký.
     */
    Page<DeckEnrollmentResponse> getUserEnrollList(Pageable pageable);

    /**
     * Lấy danh sách các bộ thẻ cần ôn tập trong ngày.
     */
    Page<DeckEnrollmentResponse> getReviewToday(Pageable pageable);
}