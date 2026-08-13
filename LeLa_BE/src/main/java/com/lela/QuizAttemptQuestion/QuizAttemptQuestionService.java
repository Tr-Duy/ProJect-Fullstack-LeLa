package com.lela.QuizAttemptQuestion;

import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionRequest;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface QuizAttemptQuestionService {
    Page<QuizAttemptQuestionResponse> findAll(Pageable pageable);
    QuizAttemptQuestionResponse findById(Long id);
    QuizAttemptQuestionResponse create(QuizAttemptQuestionRequest request);
    QuizAttemptQuestionResponse update(Long id, QuizAttemptQuestionRequest request);
    void delete(Long id);
}
