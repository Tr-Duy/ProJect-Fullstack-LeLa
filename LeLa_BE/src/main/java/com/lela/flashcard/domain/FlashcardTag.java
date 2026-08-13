package com.lela.flashcard.domain;

import com.lela.tag.domain.Tag;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "flashcard_tags")
// Component: Content - flashcard to tag join entity.
public class FlashcardTag {

    @EmbeddedId
    private FlashcardTagId id = new FlashcardTagId(); // Khóa chính gồm flashcard_id và tag_id.

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("flashcardId")
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard; // Flashcard được gắn tag.

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag; // Tag được gắn vào flashcard.

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Thời điểm gắn tag.
}
