package com.lela.voice.domain;

import com.lela.deck.domain.Topic;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversation_scenarios")
public class ConversationScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @Column(name = "level_min", nullable = false)
    @Builder.Default
    private Integer levelMin = 100;

    @Column(name = "level_max", nullable = false)
    @Builder.Default
    private Integer levelMax = 1000;

    @Column(name = "ai_role", nullable = false, length = 100)
    private String aiRole;

    @Column(name = "user_role", nullable = false, length = 100)
    private String userRole;

    @Column(length = 500)
    private String description;

    @Column(name = "system_prompt_template", nullable = false, columnDefinition = "TEXT")
    private String systemPromptTemplate;

    @Column(name = "fallback_lines_json", nullable = false, columnDefinition = "TEXT")
    private String fallbackLinesJson;

    @Column(name = "opening_line", nullable = false, length = 300)
    private String openingLine;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
