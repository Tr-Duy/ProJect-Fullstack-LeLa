package com.lela.QuizAttempt;

import com.lela.common.ApiResponse;
import com.lela.QuizAttempt.dto.QuizAttemptReponse;
import com.lela.QuizAttempt.dto.QuizAttemptRequest;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/quiz-attempts")
@RequiredArgsConstructor
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<QuizAttemptReponse>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuizAttemptReponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuizAttemptReponse>> create(@Valid @RequestBody QuizAttemptRequest req) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.create(req)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuizAttemptReponse>> update(@PathVariable Long id, @Valid @RequestBody QuizAttemptRequest req) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        quizAttemptService.delete(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('LEARNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<QuizAttemptReponse>>> getMyAttempts(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.findMyAttempts(pageable)));
    }

    @GetMapping("/{publicId}/detail")
    @PreAuthorize("hasAnyRole('LEARNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuizAttemptDetailResponse>> getAttemptDetail(@PathVariable String publicId) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.getAttemptDetailByPublicId(publicId)));
    }

    @PostMapping("/start/{quizId}")
    @PreAuthorize("hasAnyRole('LEARNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuizAttemptDetailResponse>> startAttempt(@PathVariable Long quizId) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.startAttempt(quizId)));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('LEARNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuizAttemptDetailResponse>> submit(@PathVariable Long id, @Valid @RequestBody QuizSubmitRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quizAttemptService.submit(id, request)));
    }
}
