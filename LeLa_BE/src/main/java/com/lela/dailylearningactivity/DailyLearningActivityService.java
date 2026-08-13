package com.lela.dailylearningactivity;

import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;

public interface DailyLearningActivityService {
    DailyLearningActivityResponse logActivity(DailyLearningActivityRequest request);

    DailyLearningActivityResponse getTodayActivity();

    java.util.List<DailyLearningActivityResponse> getHistory(java.time.LocalDate startDate, java.time.LocalDate endDate);
}