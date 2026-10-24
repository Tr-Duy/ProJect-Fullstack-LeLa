package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAiOverviewStats {
    private long totalVoiceSessions;
    private long completedVoiceSessions;
    private long abandonedVoiceSessions;
    private long totalVoiceMinutes;
    private long totalScenarios;
    private long publishedScenarios;
    private long totalAiTutorConversations;
    private long totalFallbackTriggeredConversations;
    private long totalActiveAiUsers;
}
