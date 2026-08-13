package com.lela.QuizQuestion;

import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import com.lela.QuizQuestion.dto.QuizQuestionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface QuizQuestionService {
    Page<QuizQuestionResponse> findAll(Pageable pageable);
    QuizQuestionResponse findById(Long id);
    QuizQuestionResponse create(QuizQuestionRequest request);
    QuizQuestionResponse update(Long id, QuizQuestionRequest request);
    void delete(Long id);
}
