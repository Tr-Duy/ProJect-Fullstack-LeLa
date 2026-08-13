package com.lela.auth;

import com.lela.auth.dto.AuthResponse;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class OAuth2Service {
    
    private final Map<String, AuthResponse> exchangeCache = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public String cacheAuthResponse(AuthResponse response) {
        String code = UUID.randomUUID().toString();
        exchangeCache.put(code, response);
        
        // Auto-remove after 60 seconds to prevent memory leaks
        scheduler.schedule(() -> exchangeCache.remove(code), 60, TimeUnit.SECONDS);
        
        return code;
    }

    public AuthResponse exchangeCode(String code) {
        return exchangeCache.remove(code); // Returns and removes simultaneously
    }
}
