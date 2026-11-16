package com.lela.ai.service;

import com.lela.ai.dto.AiChatRequest;

public interface AiService {
    com.lela.ai.dto.AiChatResponse chat(AiChatRequest request);
    java.util.function.Supplier<com.lela.ai.dto.AiChatResponse> prepareStream(AiChatRequest request,
            java.util.function.Consumer<String> delta,java.util.function.BooleanSupplier cancelled);
}
