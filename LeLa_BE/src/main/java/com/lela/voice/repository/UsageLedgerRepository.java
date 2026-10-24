package com.lela.voice.repository;

import com.lela.voice.domain.UsageLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UsageLedgerRepository extends JpaRepository<UsageLedger, Long> {

    @EntityGraph(attributePaths = {"user", "session", "adminActor"})
    @Query("""
        SELECT ul FROM UsageLedger ul
        WHERE (:userId IS NULL OR ul.user.id = :userId)
          AND (:entryType IS NULL OR ul.entryType = :entryType)
          AND (:startDate IS NULL OR ul.usageDate >= :startDate)
          AND (:endDate IS NULL OR ul.usageDate <= :endDate)
          AND (:search IS NULL OR :search = '' OR 
               LOWER(ul.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(ul.user.username) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(ul.reason) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY ul.createdAt DESC
    """)
    Page<UsageLedger> findWithFilters(
            @Param("userId") Long userId,
            @Param("entryType") String entryType,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(ul.minutesUsed), 0) FROM UsageLedger ul WHERE ul.user.id = :userId AND ul.entryType = 'SESSION'")
    int sumSessionMinutesByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(ul.minutesUsed), 0) FROM UsageLedger ul WHERE ul.user.id = :userId AND ul.entryType = 'ADJUST'")
    int sumAdjustedMinutesByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(ul.minutesUsed), 0) FROM UsageLedger ul WHERE ul.user.id = :userId AND ul.usageDate = :date AND ul.entryType = 'SESSION'")
    int sumTodaySessionMinutes(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(ul.minutesUsed), 0) FROM UsageLedger ul WHERE ul.entryType = 'SESSION'")
    long sumAllSessionMinutes();

    @Query("SELECT COALESCE(SUM(ul.minutesUsed), 0) FROM UsageLedger ul WHERE ul.entryType = 'ADJUST'")
    long sumAllAdjustedMinutes();
}
