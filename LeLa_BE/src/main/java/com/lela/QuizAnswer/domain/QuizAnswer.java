package com.lela.QuizAnswer.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;


@Getter
@Setter
@Entity
@Table(name = "quiz_answers")
// Component: Quiz - answer submitted for an attempt question.
public class QuizAnswer extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt; // Lần làm bài chứa câu trả lời.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_question_id", nullable = false)
    private QuizAttemptQuestion attemptQuestion; // Câu hỏi được trả lời.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_attempt_option_id")
    private QuizAttemptOption selectedAttemptOption; // Đáp án được chọn.

    @Column(name = "answer_text", length = 1500)
    private String answerText; // Nội dung trả lời dạng văn bản.

    @Column(name = "normalized_answer_text", length = 1500)
    private String normalizedAnswerText; // Nội dung trả lời đã chuẩn hóa.

    @Column(name = "is_correct")
    private Boolean isCorrect; // Câu trả lời đúng hay sai.

    @Column(name = "points_awarded", nullable = false)
    private Integer pointsAwarded = 0; // Số điểm được cộng cho câu trả lời.

    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds; // Thời gian trả lời tính bằng giây.

    @Column(name = "answered_at")
    private LocalDateTime answeredAt; // Thời điểm trả lời.
}
