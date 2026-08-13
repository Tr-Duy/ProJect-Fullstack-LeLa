package com.lela.chat.dto;

import com.lela.chat.domain.ConversationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private Long id;
    private String guestToken;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private String guestDepartment;
    private Long userId;
    private String username;
    private String fullName;
    private Long assignedAdminId;
    private ConversationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Cuộc trò chuyện có thể kèm tin nhắn cuối cùng để hiển thị ở sidebar
    private ChatMessageResponse lastMessage;
}
