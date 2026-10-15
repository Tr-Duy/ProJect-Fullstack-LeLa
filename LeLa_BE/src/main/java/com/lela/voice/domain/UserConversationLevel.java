package com.lela.voice.domain;

import com.lela.users.domain.Users;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_conversation_levels")
public class UserConversationLevel implements Persistable<Long> {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private Users user;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public Long getId() {
        return this.userId;
    }

    @Override
    public boolean isNew() {
        return this.isNew;
    }

    @PostLoad
    @PostPersist
    public void markNotNew() {
        this.isNew = false;
    }

    @Column(name = "current_level", nullable = false)
    @Builder.Default
    private Integer currentLevel = 200;

    @Column(name = "initial_band_min", nullable = false)
    @Builder.Default
    private Integer initialBandMin = 100;

    @Column(name = "highest_level", nullable = false)
    @Builder.Default
    private Integer highestLevel = 200;

    @Column(name = "total_sessions", nullable = false)
    @Builder.Default
    private Integer totalSessions = 0;

    @Column(name = "consecutive_hard_count", nullable = false)
    @Builder.Default
    private Integer consecutiveHardCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (currentLevel == null) currentLevel = 200;
        if (initialBandMin == null) initialBandMin = 100;
        if (highestLevel == null) highestLevel = currentLevel;
        if (totalSessions == null) totalSessions = 0;
        if (consecutiveHardCount == null) consecutiveHardCount = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
