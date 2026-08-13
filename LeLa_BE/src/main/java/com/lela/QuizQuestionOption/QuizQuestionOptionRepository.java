package com.lela.QuizQuestionOption;

import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionOptionRepository extends JpaRepository<QuizQuestionOption, Long> {
    List<QuizQuestionOption> findByQuestionIdIn(List<Long> questionIds);
}
