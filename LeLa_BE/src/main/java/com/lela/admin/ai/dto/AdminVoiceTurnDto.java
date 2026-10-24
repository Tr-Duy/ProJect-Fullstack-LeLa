package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminVoiceTurnDto {
    private Long id;
    private Integer turnNumber;
    private String role; // 'USER', 'ASSISTANT'
    private String transcript;
    private BigDecimal sttConfidence;
    private Boolean isValid;
    private Integer pronunciationScore;
    private String grammarErrorsJson;
    private String correctedText;
    private String aiReply;
    private String suggestionText;
    private String audioUrl;
    private LocalDateTime createdAt;
}
