package com.lela.Quiz;

import com.lela.Quiz.dto.QuizRequest;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequiredArgsConstructor
@RequestMapping("/quizzes")
public class QuizController {
    private final QuizService quizService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuizResponse>>> findAll(
            Pageable pageable,
            @RequestParam(required = false) com.lela.Quiz.domain.QuizCategory category,
            @RequestParam(required = false) Long examTypeId,
            @RequestParam(required = false) Long levelId,
            @RequestParam(required = false) com.lela.Quiz.domain.QuizDifficulty difficulty,
            @RequestParam(required = false) Long deckId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(quizService.findAll(pageable, category, examTypeId, levelId, difficulty, deckId, search)));
    }

    @GetMapping("/deck/{deckId}")
    public ResponseEntity<ApiResponse<java.util.List<QuizResponse>>> findByDeckId(@PathVariable Long deckId) {
        return ResponseEntity.ok(ApiResponse.success(quizService.findByDeckId(deckId)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<java.util.List<QuizResponse>>> searchQuizzes(
            @RequestParam com.lela.Quiz.domain.QuizCategory category,
            @RequestParam(required = false) Long examTypeId,
            @RequestParam(required = false) Long levelId) {
        return ResponseEntity.ok(ApiResponse.success(quizService.searchQuizzes(category, examTypeId, levelId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(quizService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuizResponse>> create(@Valid @RequestBody QuizRequest req) {
        return ResponseEntity.ok(ApiResponse.success(quizService.create(req)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuizResponse>> update(@PathVariable Long id, @Valid @RequestBody QuizRequest req) {
        return ResponseEntity.ok(ApiResponse.success(quizService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        quizService.delete(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }
}
