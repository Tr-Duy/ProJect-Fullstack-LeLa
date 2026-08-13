package com.lela.deckenrollment;

import com.lela.deckenrollment.domain.DeckEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface DeckEnrollmentRepository extends JpaRepository<DeckEnrollment, Long> {

    @Query("SELECT de FROM DeckEnrollment de WHERE de.user.id = :userId AND de.deck.id = :deckId")
    Optional<DeckEnrollment> findByUserIdAndDeckId(@Param("userId") Long userId, @Param("deckId") Long deckId);

    @Query("SELECT de FROM DeckEnrollment de WHERE de.user.id = :userId")
    Page<DeckEnrollment> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT de FROM DeckEnrollment de WHERE de.user.id = :userId AND de.nextReviewAt <= :nextReviewAt")
    Page<DeckEnrollment> findByUserIdAndNextReviewAtLessThanEqual(@Param("userId") Long userId, @Param("nextReviewAt") LocalDateTime nextReviewAt, Pageable pageable);

    long countByUserId(Long userId);
}