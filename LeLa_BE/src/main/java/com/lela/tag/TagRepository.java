package com.lela.tag;

import com.lela.tag.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
    Optional<Tag> findBySlug(String slug);
    boolean existsBySlug(String slug);

    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM deck_tags WHERE tag_id = :tagId", nativeQuery = true)
    long countDecksByTagId(@org.springframework.data.repository.query.Param("tagId") Long tagId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM flashcard_tags WHERE tag_id = :tagId", nativeQuery = true)
    long countCardsByTagId(@org.springframework.data.repository.query.Param("tagId") Long tagId);
}
