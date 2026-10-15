package com.lela.voice.domain;

import com.lela.users.domain.Users;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversation_level_history")
public class ConversationLevelHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "old_level", nullable = false)
    private Integer oldLevel;

    @Column(name = "new_level", nullable = false)
    private Integer newLevel;

    @Column(nullable = false)
    private Integer delta;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
