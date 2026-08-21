package com.lela.ai.controller;

import com.lela.ai.dto.AiChatRequest;
import com.lela.ai.dto.AiContextDto;
import com.lela.ai.prompt.LearningContextBuilder;
import com.lela.ai.service.AiService;
import com.lela.common.dto.ApiResponse;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final LearningContextBuilder contextBuilder;
    private final UsersRepository usersRepository;

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody AiChatRequest request) {
        return aiService.chat(request);
    }

    @GetMapping("/context")
    public ResponseEntity<ApiResponse<AiContextDto>> getContext() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Users user = usersRepository.findByUsername(username)
                .or(() -> usersRepository.findByEmail(username))
                .orElse(null);

        AiContextDto context = contextBuilder.buildContextObjectForUser(user);
        return ResponseEntity.ok(ApiResponse.success(context, "Lấy thông tin học tập AI context thành công"));
    }
}
