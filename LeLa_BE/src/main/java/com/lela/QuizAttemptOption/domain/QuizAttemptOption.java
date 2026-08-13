package com.lela.QuizAttemptOption.domain;

import com.lela.domain.BaseEnity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;


@Getter
@Setter
@Entity
@Table(name = "quiz_attempt_options")
// Component: Quiz - snapshotted option for a quiz attempt.
public class QuizAttemptOption extends BaseEnity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_question_id", nullable = false)
    private QuizAttemptQuestion attemptQuestion; // Câu hỏi snapshot chứa đáp án này.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_option_id")
    private QuizQuestionOption sourceOption; // Đáp án nguồn tại thời điểm tạo snapshot.

    @Column(name = "option_key", length = 20)
    private String optionKey; // Ký hiệu đáp án đã snapshot.

    @Column(name = "option_text", nullable = false, length = 1000)
    private String optionText; // Nội dung đáp án đã snapshot.

    @Column(name = "normalized_text", length = 1000)
    private String normalizedText; // Nội dung đáp án đã chuẩn hóa.

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false; // Đáp án snapshot có đúng hay không.

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder; // Thứ tự đáp án trong câu hỏi.

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Thời điểm tạo snapshot đáp án.
}
