package com.lela.QuizAnswer;

import com.lela.QuizAnswer.dto.QuizAnswerRequest;
import com.lela.QuizAnswer.dto.QuizAnswerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface QuizAnswerService {
    Page<QuizAnswerResponse> findAll(Pageable pageable);
    QuizAnswerResponse findById(Long id);
    QuizAnswerResponse create(QuizAnswerRequest request);
    QuizAnswerResponse update(Long id, QuizAnswerRequest request);
    void delete(Long id);
}
