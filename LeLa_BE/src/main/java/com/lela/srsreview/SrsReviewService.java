package com.lela.srsreview;

import com.lela.srsreview.dto.SrsReviewRequest;
import com.lela.srsreview.dto.SrsReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SrsReviewService {
    SrsReviewResponse reviewCard(SrsReviewRequest request);

    Page<SrsReviewResponse> getReviewHistory(Long userId, Pageable pageable);

    Object getReviewStatistics(Long userId);
}
