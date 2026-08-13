package com.lela.chat.dto;

import com.lela.chat.domain.SenderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private SenderType senderType;
    private Long senderId;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
