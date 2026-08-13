package com.lela.QuizQuestionOption.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import com.lela.QuizQuestion.domain.QuizQuestion;


@Getter
@Setter
@Entity
@Table(name = "quiz_question_options")
// Component: Quiz - source option definition.
public class QuizQuestionOption extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question; // Câu hỏi chứa đáp án này.

    @Column(name = "option_key", length = 20)
    private String optionKey; // Ký hiệu đáp án, ví dụ A, B, C.

    @Column(name = "option_text", nullable = false, length = 1000)
    private String optionText; // Nội dung đáp án.

    @Column(name = "normalized_text", length = 1000)
    private String normalizedText; // Nội dung đáp án đã chuẩn hóa để so khớp.

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false; // Đáp án này có đúng hay không.

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0; // Thứ tự hiển thị đáp án.
}
