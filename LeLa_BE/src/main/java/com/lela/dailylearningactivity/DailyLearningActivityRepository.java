package com.lela.dailylearningactivity;

import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyLearningActivityRepository extends JpaRepository<DailyLearningActivity, Long> {
    @Query("SELECT dla FROM DailyLearningActivity dla WHERE dla.user.id = :userId AND dla.activityDate = :activityDate")
    Optional<DailyLearningActivity> findByUserIdAndActivityDate(@Param("userId") Long userId, @Param("activityDate") LocalDate activityDate);

    @Query("SELECT dla FROM DailyLearningActivity dla WHERE dla.user.id = :userId AND dla.activityDate >= :startDate AND dla.activityDate <= :endDate ORDER BY dla.activityDate ASC")
    java.util.List<DailyLearningActivity> findByUserIdAndActivityDateBetween(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT dla FROM DailyLearningActivity dla WHERE dla.user.id = :userId ORDER BY dla.activityDate ASC")
    List<DailyLearningActivity> findAllByUserIdOrderByActivityDateAsc(@Param("userId") Long userId);
}

