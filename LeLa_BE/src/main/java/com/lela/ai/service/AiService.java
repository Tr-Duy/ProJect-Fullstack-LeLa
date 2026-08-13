package com.lela.ai.service;

import com.lela.ai.dto.AiChatRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface AiService {
    SseEmitter chat(AiChatRequest request);
}
