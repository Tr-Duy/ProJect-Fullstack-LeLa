package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminVoiceSessionResponse {
    private Long id;
    private String publicId;
    private Long userId;
    private String username;
    private String userFullName;
    private String userEmail;
    private Long scenarioId;
    private String scenarioTitle;
    private Integer levelAtStart;
    private Integer overallScore;
    private Integer pronunciationScore;
    private Integer grammarScore;
    private Integer fluencyScore;
    private Integer vocabularyScore;
    private String userFeedback;
    private String systemRecommendation;
    private Integer durationSeconds;
    private Integer minutesUsed;
    private Integer validTurnCount;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime finishedAt;
    private Integer xpAwarded;
    private Integer aiTokensUsed;
}
