package com.lela.QuizAttemptOption;

import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptOptionRepository extends JpaRepository<QuizAttemptOption, Long> {
    List<QuizAttemptOption> findByAttemptQuestionId(Long attemptQuestionId);
    List<QuizAttemptOption> findByAttemptQuestionIdIn(List<Long> attemptQuestionIds);
}
