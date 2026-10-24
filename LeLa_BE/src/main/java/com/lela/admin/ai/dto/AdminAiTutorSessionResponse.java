package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAiTutorSessionResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userFullName;
    private String userEmail;
    private String status;
    private Boolean isFallbackTriggered;
    private String fallbackReason;
    private String errorMessage;
    private Integer messageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AdminAiTutorMessageDto> messages;
}
