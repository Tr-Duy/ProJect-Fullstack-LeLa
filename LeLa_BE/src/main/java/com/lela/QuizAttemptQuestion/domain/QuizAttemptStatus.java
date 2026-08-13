package com.lela.QuizAttemptQuestion.domain;

// Enum trạng thái lần làm quiz.
public enum QuizAttemptStatus {
    IN_PROGRESS, // Đang làm bài.
    SUBMITTED, // Đã nộp bài.
    EXPIRED, // Đã hết thời gian làm bài.
    ABANDONED // Đã bỏ dở bài làm.
}
