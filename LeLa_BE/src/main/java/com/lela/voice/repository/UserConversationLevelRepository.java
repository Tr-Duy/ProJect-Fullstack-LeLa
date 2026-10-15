package com.lela.voice.repository;

import com.lela.voice.domain.UserConversationLevel;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserConversationLevelRepository extends JpaRepository<UserConversationLevel, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ucl FROM UserConversationLevel ucl WHERE ucl.userId = :userId")
    Optional<UserConversationLevel> findByUserIdForUpdate(@Param("userId") Long userId);
}
