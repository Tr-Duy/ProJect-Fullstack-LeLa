package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminQuotaLedgerResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userFullName;
    private String userEmail;
    private Long sessionId;
    private String sessionPublicId;
    private String scenarioTitle;
    private String entryType; // 'SESSION', 'ADJUST'
    private Integer minutesUsed;
    private LocalDate usageDate;
    private Long adminActorId;
    private String adminActorName;
    private String reason;
    private LocalDateTime createdAt;
}
