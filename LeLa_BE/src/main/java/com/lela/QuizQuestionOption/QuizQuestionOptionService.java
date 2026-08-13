package com.lela.QuizQuestionOption;

import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface QuizQuestionOptionService {
    Page<QuizQuestionOptionResponse> findAll(Pageable pageable);
    QuizQuestionOptionResponse findById(Long id);
    QuizQuestionOptionResponse create(QuizQuestionOptionRequest request);
    QuizQuestionOptionResponse update(Long id, QuizQuestionOptionRequest request);
    void delete(Long id);
}
