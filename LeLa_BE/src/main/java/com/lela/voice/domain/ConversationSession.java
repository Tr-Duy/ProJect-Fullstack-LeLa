package com.lela.voice.domain;

import com.lela.users.domain.Users;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversation_sessions")
public class ConversationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id", nullable = false)
    private ConversationScenario scenario;

    @Column(name = "quota_date", nullable = false)
    private LocalDate quotaDate;

    @Column(name = "level_at_start", nullable = false)
    private Integer levelAtStart;

    @Column(name = "duration_seconds", nullable = false)
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "valid_turn_count", nullable = false)
    @Builder.Default
    private Integer validTurnCount = 0;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "pronunciation_score")
    private Integer pronunciationScore;

    @Column(name = "grammar_score")
    private Integer grammarScore;

    @Column(name = "fluency_score")
    private Integer fluencyScore;

    @Column(name = "vocabulary_score")
    private Integer vocabularyScore;

    @Column(name = "user_feedback", length = 30)
    private String userFeedback; // 'HARD', 'COMFORTABLE', 'EASY', 'SKIPPED'

    @Column(name = "system_recommendation", length = 30)
    private String systemRecommendation; // 'INCREASE', 'KEEP', 'DECREASE'

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "IN_PROGRESS"; // 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "last_activity_at", nullable = false)
    private LocalDateTime lastActivityAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "xp_awarded", nullable = false)
    @Builder.Default
    private Integer xpAwarded = 0;

    @Column(name = "ai_tokens_used", nullable = false)
    @Builder.Default
    private Integer aiTokensUsed = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (startedAt == null) startedAt = LocalDateTime.now();
        if (lastActivityAt == null) lastActivityAt = LocalDateTime.now();
        if (status == null) status = "IN_PROGRESS";
        if (durationSeconds == null) durationSeconds = 0;
        if (validTurnCount == null) validTurnCount = 0;
        if (xpAwarded == null) xpAwarded = 0;
        if (aiTokensUsed == null) aiTokensUsed = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
