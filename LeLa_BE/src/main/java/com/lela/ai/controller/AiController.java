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

    @PostMapping(value="/chat/stream",produces=MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter stream(
            @jakarta.validation.Valid @RequestBody AiChatRequest request,jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control","no-cache, no-transform");
        response.setHeader("X-Accel-Buffering","no");
        response.setCharacterEncoding("UTF-8");
        var emitter=new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(120_000L);
        var cancelled=new java.util.concurrent.atomic.AtomicBoolean();
        var sequence=new java.util.concurrent.atomic.AtomicInteger();
        emitter.onCompletion(()->cancelled.set(true));
        emitter.onTimeout(()->{cancelled.set(true);emitter.complete();});
        emitter.onError(error->cancelled.set(true));
        var work=aiService.prepareStream(request,text->{
            try {emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                    .name("delta").data(java.util.Map.of("sequence",sequence.getAndIncrement(),"text",text),MediaType.APPLICATION_JSON));}
            catch(java.io.IOException disconnected) {cancelled.set(true);throw new java.util.concurrent.CancellationException();}
        },cancelled::get);
        Thread.startVirtualThread(()->{
            try {
                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().name("ready").data("{}"));
                var result=work.get();
                if(!cancelled.get())emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                        .name("done").data(result,MediaType.APPLICATION_JSON));
                emitter.complete();
            } catch(java.util.concurrent.CancellationException disconnected) {emitter.complete();}
            catch(Exception failure) {
                if(!cancelled.get())try {emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                        .name("error").data(java.util.Map.of("code","AI_STREAM_ERROR"),MediaType.APPLICATION_JSON));}
                    catch(java.io.IOException disconnected) {cancelled.set(true);}
                emitter.complete();
            }
        });
        return emitter;
    }

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
