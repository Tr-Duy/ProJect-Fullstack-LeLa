package com.lela.Quiz.timed;

import com.lela.flashcard.domain.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface VocabularyRepository extends JpaRepository<Flashcard, Long> {
    @Query("select f from Flashcard f join fetch f.deck d left join fetch d.level " +
           "where d.owner.username = :owner and d.visibility = 'PUBLIC' and d.status = 'PUBLISHED' " +
           "and d.isActive = true and f.isActive = true and d.deletedAt is null and f.deletedAt is null " +
           "and (:level is null or d.level.id = :level)")
    List<Flashcard> findSystemWords(@Param("owner") String owner, @Param("level") Long level);
}
