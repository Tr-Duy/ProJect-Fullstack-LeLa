package com.lela.achievement.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code; // e.g., "FIRST_REVIEW", "STREAK_7_DAYS"

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(length = 200)
    private String iconUrl;

    @Column(nullable = false)
    private Integer xpReward;

    // e.g., "STREAK", "XP", "CARDS_REVIEWED", "DECKS_LEARNED"
    @Column(name = "condition_type", length = 50)
    private String conditionType;

    @Column(name = "condition_value")
    private Integer conditionValue;
}
