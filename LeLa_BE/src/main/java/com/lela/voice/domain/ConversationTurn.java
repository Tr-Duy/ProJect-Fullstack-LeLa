package com.lela.voice.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversation_turns")
public class ConversationTurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ConversationSession session;

    @Column(name = "turn_number", nullable = false)
    private Integer turnNumber;

    @Column(nullable = false, length = 20)
    private String role; // 'USER', 'ASSISTANT'

    @Column(nullable = false, columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "stt_confidence", precision = 4, scale = 3)
    private BigDecimal sttConfidence;

    @Column(name = "is_valid", nullable = false)
    @Builder.Default
    private Boolean isValid = true;

    @Column(name = "pronunciation_score")
    private Integer pronunciationScore;

    @Column(name = "grammar_errors_json", columnDefinition = "TEXT")
    private String grammarErrorsJson;

    @Column(name = "corrected_text", columnDefinition = "TEXT")
    private String correctedText;

    @Column(name = "ai_reply", columnDefinition = "TEXT")
    private String aiReply;

    @Column(name = "suggestion_text", length = 300)
    private String suggestionText;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (isValid == null) isValid = true;
    }
}
