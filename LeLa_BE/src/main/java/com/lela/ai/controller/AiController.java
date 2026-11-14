package com.lela.ai.controller;

import com.lela.ai.dto.AiChatRequest;
import com.lela.ai.dto.AiContextDto;
import com.lela.ai.prompt.LearningContextBuilder;
import com.lela.ai.service.AiService;
import com.lela.common.ApiResponse;
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

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final LearningContextBuilder contextBuilder;
    private final UsersRepository usersRepository;

    @PostMapping(value = "/chat")
    public ResponseEntity<?> chat(@jakarta.validation.Valid @RequestBody AiChatRequest request,
            @org.springframework.web.bind.annotation.RequestHeader(value = "Accept", defaultValue = "application/json") String accept) {
        var result=aiService.chat(request);
        // Preserve the mobile SSE contract, but frame one complete buffered answer synchronously.
        if (accept.contains(MediaType.TEXT_EVENT_STREAM_VALUE)) {
            if (!result.complete()) return ResponseEntity.status(503).contentType(new MediaType(MediaType.TEXT_PLAIN, java.nio.charset.StandardCharsets.UTF_8))
                    .body("AI chưa thể trả lời đầy đủ. Bạn thử lại sau ít phút. Mã: " + result.errorCode());
            String event="event:message\n"+result.content().replace("\r\n","\n").lines()
                    .map(line->"data:"+line+"\n").collect(java.util.stream.Collectors.joining())+"\n";
            return ResponseEntity.ok().contentType(new MediaType(MediaType.TEXT_EVENT_STREAM, java.nio.charset.StandardCharsets.UTF_8)).body(event);
        }
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(ApiResponse.success(result, "AI Tutor"));
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
