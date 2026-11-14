package com.lela.ai.service;

import com.lela.ai.dto.AiChatRequest;

public interface AiService {
    com.lela.ai.dto.AiChatResponse chat(AiChatRequest request);
}
