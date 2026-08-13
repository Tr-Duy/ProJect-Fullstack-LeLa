package com.lela.notification;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import lombok.extern.slf4j.Slf4j;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseService {

    // Store active SseEmitters per user ID
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        // Timeout set to 30 minutes (or could be indefinite with 0)
        SseEmitter emitter = new SseEmitter(1800000L);
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> {
            log.info("SSE completion for user {}", userId);
            emitters.remove(userId);
        });
        emitter.onTimeout(() -> {
            log.info("SSE timeout for user {}", userId);
            emitters.remove(userId);
        });
        emitter.onError((e) -> {
            log.error("SSE error for user {}: {}", userId, e.getMessage());
            emitters.remove(userId);
        });

        // Send initial connect message to avoid early timeout
        try {
            emitter.send(SseEmitter.event().name("connect").data("Connected successfully"));
        } catch (IOException e) {
            log.error("Failed to send initial SSE message for user {}", userId, e);
            emitters.remove(userId);
        }

        return emitter;
    }

    public void emitToUser(Long userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                log.error("Failed to emit event {} to user {}", eventName, userId, e);
                emitters.remove(userId);
            }
        }
    }

    public void emitToAll(String eventName, Object data) {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                log.error("Failed to emit broadcast event {} to user {}", eventName, userId, e);
                emitters.remove(userId);
            }
        });
    }
}
