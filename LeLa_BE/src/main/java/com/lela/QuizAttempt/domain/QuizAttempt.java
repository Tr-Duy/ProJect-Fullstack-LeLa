package com.lela.QuizAttempt.domain;

import com.lela.Quiz.domain.Quiz;
import com.lela.domain.AuditableEntity;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.users.domain.Users;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;



@Getter
@Setter
@Entity
@Table(name = "quiz_attempts")
// Component: Quiz - user quiz attempt and scoring state.
public class QuizAttempt extends AuditableEntity {

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId; // ID công khai dùng cho API.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz; // Quiz được làm.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng làm quiz.

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber; // Số thứ tự lần làm bài.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id_at_attempt")
    private com.lela.common.domain.ProficiencyLevel levelAtAttempt; // Trình độ lúc làm bài.

    @Column(name = "start_idempotency_key", unique = true, length = 190)
    private String startIdempotencyKey; // Khóa idempotency khi bắt đầu attempt.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuizAttemptStatus status = QuizAttemptStatus.IN_PROGRESS; // Trạng thái lần làm bài.

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt; // Thời điểm bắt đầu làm bài.

    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // Thời điểm hết hạn làm bài.

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt; // Thời điểm nộp bài.

    @Column(name = "abandoned_at")
    private LocalDateTime abandonedAt; // Thời điểm bỏ dở bài làm.

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds; // Tổng thời gian làm bài tính bằng giây.

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions = 0; // Tổng số câu hỏi trong attempt.

    @Column(name = "correct_answers", nullable = false)
    private Integer correctAnswers = 0; // Số câu trả lời đúng.

    @Column(name = "score_points", nullable = false)
    private Integer scorePoints = 0; // Tổng điểm đạt được.

    @Column(name = "score_percent", precision = 5, scale = 2)
    private BigDecimal scorePercent; // Điểm phần trăm.

    @Column
    private Boolean passed; // Kết quả đạt hay không đạt.

    @Column(name = "xp_awarded", nullable = false)
    private Integer xpAwarded = 0; // XP được cộng sau khi nộp bài.

    @Column(name = "cycle_number", nullable = false)
    private Integer cycleNumber = 1; // Chu kỳ làm bài (dùng cho Final Level Test)

    @Version
    @Column(nullable = false)
    private Long version = 0L; // Phiên bản dùng cho optimistic locking.
}
