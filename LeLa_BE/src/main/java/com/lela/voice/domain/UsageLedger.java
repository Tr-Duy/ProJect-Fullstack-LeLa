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
@Table(name = "so_ghi_han_muc")
public class UsageLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ConversationSession session;

    @Column(name = "session_id", insertable = false, updatable = false)
    private Long sessionId;

    @Column(name = "entry_type", nullable = false, length = 30)
    private String entryType; // 'SESSION', 'ADJUST'

    @Column(name = "minutes_used", nullable = false)
    private Integer minutesUsed;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_actor_id")
    private Users adminActor;

    @Column(length = 255)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (usageDate == null) usageDate = LocalDate.now();
        if (minutesUsed == null) minutesUsed = 0;
    }
}
