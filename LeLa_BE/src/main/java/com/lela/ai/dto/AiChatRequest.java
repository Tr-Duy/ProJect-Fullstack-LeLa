package com.lela.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Size(max = 16000)
    private String message;
    private String conversationId; // optional, for resuming
    @jakarta.validation.constraints.Size(max = 128)
    private String clientMessageId;
    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 12)
    private java.util.List<HistoryMessage> history;
    public record HistoryMessage(
            @jakarta.validation.constraints.Pattern(regexp = "user|model") String role,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 16000) String text) {}
}
