package com.lela.chat;

import com.lela.chat.domain.ChatConversation;
import com.lela.chat.domain.ConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    Optional<ChatConversation> findByGuestToken(String guestToken);
    
    Optional<ChatConversation> findByUserIdAndStatus(Long userId, ConversationStatus status);
    
    List<ChatConversation> findByStatusOrderByUpdatedAtDesc(ConversationStatus status);

    long countByChannelType(String channelType);

    long countByChannelTypeAndIsFallbackTriggeredTrue(String channelType);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user"})
    @org.springframework.data.jpa.repository.Query("""
        SELECT c FROM ChatConversation c
        WHERE c.channelType = 'AI_TUTOR'
          AND (:isFallbackOnly IS NULL OR :isFallbackOnly = false OR c.isFallbackTriggered = true)
          AND (:userId IS NULL OR c.user.id = :userId)
          AND (:startDate IS NULL OR c.createdAt >= :startDate)
          AND (:endDate IS NULL OR c.createdAt <= :endDate)
          AND (:search IS NULL OR :search = '' OR 
               LOWER(c.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(c.user.username) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(c.fallbackReason) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(c.errorMessage) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY c.createdAt DESC
    """)
    org.springframework.data.domain.Page<ChatConversation> findAiTutorSessionsWithFilters(
            @org.springframework.data.repository.query.Param("isFallbackOnly") Boolean isFallbackOnly,
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate,
            @org.springframework.data.repository.query.Param("search") String search,
            org.springframework.data.domain.Pageable pageable
    );
}
