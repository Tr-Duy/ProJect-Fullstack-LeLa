package com.lela.reviewsession;

import com.lela.reviewsession.dto.ReviewSessionRequest;
import com.lela.reviewsession.dto.ReviewSessionResponse;
import com.lela.srsreview.dto.SyncReviewRequest;

import java.util.Map;

public interface ReviewSessionService {
    ReviewSessionResponse startSession(ReviewSessionRequest request);
    void syncOfflineReviews(SyncReviewRequest request);
    ReviewSessionResponse getCurrentSession();
    void abandonSession(String publicId);
    Map<String, Object> getTodayStats();
    Map<String, Object> getWeeklyStats();
}
