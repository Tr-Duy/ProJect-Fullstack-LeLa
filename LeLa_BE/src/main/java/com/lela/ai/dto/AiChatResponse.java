package com.lela.ai.dto;
public record AiChatResponse(String content, String finishReason, boolean complete,
        String model, GeminiResponse.UsageMetadata usageMetadata, String errorCode, String requestId) {}
