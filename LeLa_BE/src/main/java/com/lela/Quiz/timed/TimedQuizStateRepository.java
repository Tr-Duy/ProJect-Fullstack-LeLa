package com.lela.Quiz.timed;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface TimedQuizStateRepository extends JpaRepository<TimedQuizState, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TimedQuizState s where s.attemptId = :id")
    Optional<TimedQuizState> lockByAttemptId(@Param("id") Long id);
}
