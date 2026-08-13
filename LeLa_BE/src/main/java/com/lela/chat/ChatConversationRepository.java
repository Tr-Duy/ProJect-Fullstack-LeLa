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
}
