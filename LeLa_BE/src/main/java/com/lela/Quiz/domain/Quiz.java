package com.lela.Quiz.domain;

import com.lela.deck.domain.Deck;
import com.lela.domain.AuditableEntity;
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
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import com.lela.QuizQuestion.domain.QuizQuestion;

@Getter
@Setter
@Entity
@Table(name = "quizzes")
// Component: Quiz - quiz definition for a deck.
public class Quiz extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id")
    private Deck deck; // Deck chứa quiz. (nullable)

    @Column(name = "quiz_code", nullable = false, unique = true, length = 50)
    private String quizCode; // Mã định danh quiz.

    @Column(nullable = false, length = 200)
    private String title; // Tiêu đề quiz.

    @Column(columnDefinition = "text")
    private String description; // Mô tả quiz.

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_type", nullable = false, length = 30)
    private QuizType quizType = QuizType.MULTIPLE_CHOICE; // Loại quiz mặc định.

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_category", length = 30)
    private QuizCategory quizCategory = QuizCategory.NORMAL; // Phân loại quiz (NORMAL, PLACEMENT, FINAL).

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_type_id")
    private com.lela.common.domain.ExamType examType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id")
    private com.lela.common.domain.ProficiencyLevel level;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds; // Thời gian làm bài tối đa tính bằng giây.

    @Column(name = "pass_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal passScore = new BigDecimal("60.00"); // Điểm phần trăm tối thiểu để đạt.

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 3; // Số lần làm bài tối đa.

    @Column(name = "shuffle_questions", nullable = false)
    private Boolean shuffleQuestions = true; // Có trộn thứ tự câu hỏi hay không.

    @Column(name = "shuffle_options", nullable = false)
    private Boolean shuffleOptions = true; // Có trộn thứ tự đáp án hay không.

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions = 0; // Tổng số câu hỏi trong quiz.

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Quiz còn được sử dụng hay không.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Users createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Users updatedBy;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt; // Thời điểm xóa mềm quiz.

    @Version
    @Column(nullable = false)
    private Long version = 0L; // Phiên bản dùng cho optimistic locking.

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuizQuestion> questions = new ArrayList<>();
}
