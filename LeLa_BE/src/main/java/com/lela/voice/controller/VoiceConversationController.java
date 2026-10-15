package com.lela.voice.controller;

import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import com.lela.voice.dto.*;
import com.lela.voice.service.VoiceConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping({"/voice-conversations", "/api/v1/voice-conversations"})
@RequiredArgsConstructor
public class VoiceConversationController {

    private final UsersRepository usersRepository;
    private final VoiceConversationService voiceConversationService;

    private Users getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return usersRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + auth.getName()));
    }

    @GetMapping("/status")
    public ResponseEntity<VoiceStatusResponse> getStatus() {
        Users user = getCurrentUser();
        return ResponseEntity.ok(voiceConversationService.getStatus(user));
    }

    @GetMapping("/scenarios")
    public ResponseEntity<List<ConversationScenarioDto>> getScenarios() {
        Users user = getCurrentUser();
        return ResponseEntity.ok(voiceConversationService.getScenarios(user));
    }

    @PostMapping("/sessions/start")
    public ResponseEntity<VoiceStartResponse> startSession(@RequestBody(required = false) VoiceStartRequest req) {
        Users user = getCurrentUser();
        return ResponseEntity.ok(voiceConversationService.startSession(user, req));
    }

    @PostMapping("/sessions/{publicId}/turns")
    public ResponseEntity<VoiceTurnResponse> processTurn(
            @PathVariable String publicId,
            @RequestBody VoiceTurnRequest req
    ) {
        Users user = getCurrentUser();
        return ResponseEntity.ok(voiceConversationService.processTurn(user, publicId, req));
    }

    @PostMapping("/sessions/{publicId}/finish")
    public ResponseEntity<VoiceReportResponse> finishSession(
            @PathVariable String publicId,
            @RequestBody(required = false) VoiceFinishRequest req
    ) {
        Users user = getCurrentUser();
        return ResponseEntity.ok(voiceConversationService.finishSession(user, publicId, req));
    }

    @PostMapping("/sessions/{publicId}/abandon")
    public ResponseEntity<Void> abandonSession(@PathVariable String publicId) {
        Users user = getCurrentUser();
        voiceConversationService.abandonSession(user, publicId);
        return ResponseEntity.noContent().build();
    }
}
