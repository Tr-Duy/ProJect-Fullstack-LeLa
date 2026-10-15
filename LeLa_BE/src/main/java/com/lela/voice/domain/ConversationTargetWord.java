package com.lela.voice.domain;

import com.lela.flashcard.domain.Flashcard;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversation_target_words")
public class ConversationTargetWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ConversationSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(name = "word_text", nullable = false, length = 100)
    private String wordText;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "used_correctly", nullable = false)
    @Builder.Default
    private Boolean usedCorrectly = false;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "UNUSED"; // 'USED_CORRECT', 'USED_WRONG', 'UNUSED'

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (usedCount == null) usedCount = 0;
        if (usedCorrectly == null) usedCorrectly = false;
        if (status == null) status = "UNUSED";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
