package com.lela.Quiz.timed;

import com.lela.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/quiz-attempts/vocabulary")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('LEARNER','ADMIN')")
public class TimedQuizController {
    private final TimedQuizEngine engine;
    @GetMapping("/modes")
    public ApiResponse<Map<String,Object>> modes() { return ApiResponse.success(engine.modes()); }
    @PostMapping("/start/{type}")
    public ApiResponse<TimedQuizEngine.View> start(@PathVariable String type) { return ApiResponse.success(engine.start(type)); }
    @PostMapping("/{id}/event")
    public ApiResponse<TimedQuizEngine.View> event(@PathVariable Long id, @RequestBody TimedQuizEngine.Event event) {
        return ApiResponse.success(engine.event(id, event));
    }
}
