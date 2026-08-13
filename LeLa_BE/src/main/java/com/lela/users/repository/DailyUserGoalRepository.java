package com.lela.users.repository;

import com.lela.users.domain.DailyUserGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyUserGoalRepository extends JpaRepository<DailyUserGoal, Long> {
    Optional<DailyUserGoal> findByUserIdAndGoalDate(Long userId, LocalDate goalDate);
}
