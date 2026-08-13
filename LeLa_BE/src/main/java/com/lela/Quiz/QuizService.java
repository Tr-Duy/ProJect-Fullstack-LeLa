package com.lela.Quiz;

import com.lela.Quiz.dto.QuizResponse;
import com.lela.Quiz.dto.QuizRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface QuizService {
    Page<QuizResponse> findAll(Pageable pageable, com.lela.Quiz.domain.QuizCategory category, Long examTypeId, Long levelId);

    QuizResponse findById(Long id);

    QuizResponse create(QuizRequest req);

    QuizResponse update(Long id, QuizRequest request);

    void delete(Long id);

    List<QuizResponse> findByDeckId(Long deckId);

    List<QuizResponse> searchQuizzes(com.lela.Quiz.domain.QuizCategory category, Long examTypeId, Long levelId);
}
