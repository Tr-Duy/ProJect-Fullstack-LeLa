package com.lela.QuizAttemptOption;

import com.lela.QuizAttemptOption.dto.QuizAttemptOptionRequest;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface QuizAttemptOptionService {
    Page<QuizAttemptOptionResponse> findAll(Pageable pageable);
    QuizAttemptOptionResponse findById(Long id);
    QuizAttemptOptionResponse create(QuizAttemptOptionRequest request);
    QuizAttemptOptionResponse update(Long id, QuizAttemptOptionRequest request);
    void delete(Long id);
}
