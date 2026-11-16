package com.lela.ai.dto;
public record AiChatResponse(String content, String finishReason, boolean complete,
        String model, GeminiResponse.UsageMetadata usageMetadata, String errorCode, String requestId, TutorTimings timings) {
    public AiChatResponse(String content,String finishReason,boolean complete,String model,
            GeminiResponse.UsageMetadata usageMetadata,String errorCode,String requestId) {
        this(content,finishReason,complete,model,usageMetadata,errorCode,requestId,new TutorTimings());
    }
}
