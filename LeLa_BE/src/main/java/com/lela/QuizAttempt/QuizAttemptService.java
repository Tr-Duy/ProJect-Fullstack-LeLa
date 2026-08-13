package com.lela.QuizAttempt;

import com.lela.QuizAttempt.dto.QuizAttemptReponse;
import com.lela.QuizAttempt.dto.QuizAttemptRequest;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;



public interface QuizAttemptService {
    Page<QuizAttemptReponse> findAll(Pageable pageable);
    
    Page<QuizAttemptReponse> findMyAttempts(Pageable pageable);

    QuizAttemptReponse findById(Long id);

    @Transactional
    QuizAttemptReponse create(QuizAttemptRequest request);

    @Transactional
    QuizAttemptReponse update(Long id, QuizAttemptRequest request);

    @Transactional
    void delete(Long id);

    QuizAttemptDetailResponse getAttemptDetailByPublicId(String publicId);

    @Transactional
    QuizAttemptDetailResponse startAttempt(Long quizId);

    @Transactional
    QuizAttemptDetailResponse submit(Long id, QuizSubmitRequest request);
}
