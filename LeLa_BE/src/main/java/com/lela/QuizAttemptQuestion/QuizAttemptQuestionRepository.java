package com.lela.QuizAttemptQuestion;

import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptQuestionRepository extends JpaRepository<QuizAttemptQuestion, Long> {
    List<QuizAttemptQuestion> findByAttemptId(Long attemptId);
}
