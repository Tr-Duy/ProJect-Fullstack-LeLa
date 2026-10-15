package com.lela.voice.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "foundation_words")
public class FoundationWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String word;

    @Column(nullable = false, length = 100)
    private String lemma;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    @Column(name = "cefr_level", nullable = false, length = 10)
    @Builder.Default
    private String cefrLevel = "A1";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (cefrLevel == null) cefrLevel = "A1";
    }
}
