package com.lela.QuizAttemptQuestion.domain;

import com.lela.QuizQuestion.domain.QuestionType;
import com.lela.domain.BaseEnity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizQuestion.domain.QuizQuestion;


@Getter
@Setter
@Entity
@Table(name = "quiz_attempt_questions")
// Component: Quiz - snapshotted question for a quiz attempt.
public class QuizAttemptQuestion extends BaseEnity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt; // Lần làm bài chứa câu hỏi snapshot.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_question_id")
    private QuizQuestion sourceQuestion; // Câu hỏi nguồn tại thời điểm tạo snapshot.

    @Column(name = "question_text", nullable = false, length = 1500)
    private String questionText; // Nội dung câu hỏi đã snapshot.

    @Column(name = "question_image_url", length = 500)
    private String questionImageUrl; // Ảnh câu hỏi đã snapshot.

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    private QuestionType questionType; // Loại câu hỏi đã snapshot.

    @Column(columnDefinition = "text")
    private String explanation; // Giải thích đáp án đã snapshot.

    @Column(nullable = false)
    private Integer points; // Số điểm của câu hỏi trong attempt.

    @Column(name = "question_time_limit_seconds")
    private Integer questionTimeLimitSeconds; // Giới hạn thời gian cho câu hỏi.

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder; // Thứ tự câu hỏi trong attempt.

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Thời điểm tạo snapshot câu hỏi.
}
