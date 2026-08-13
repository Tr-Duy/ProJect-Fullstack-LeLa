package com.lela.flashcard.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@Embeddable
// Component: Content - composite key for flashcard_tags.
public class FlashcardTagId implements Serializable {

    @Column(name = "flashcard_id")
    private Long flashcardId; // ID flashcard.

    @Column(name = "tag_id")
    private Long tagId; // ID tag.

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }
        if (!(object instanceof FlashcardTagId that)) {
            return false;
        }
        return Objects.equals(flashcardId, that.flashcardId) && Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(flashcardId, tagId);
    }
}
