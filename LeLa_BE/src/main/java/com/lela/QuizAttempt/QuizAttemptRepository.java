package com.lela.QuizAttempt;

import com.lela.QuizAttempt.domain.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    Page<QuizAttempt> findByUserId(Long userId, Pageable pageable);
    
    java.util.Optional<QuizAttempt> findByPublicId(String publicId);

    @Query("SELECT COALESCE(MAX(a.attemptNumber), 0) FROM QuizAttempt a WHERE a.user.id = :userId AND a.quiz.id = :quizId")
    Integer findMaxAttemptNumber(@Param("userId") Long userId, @Param("quizId") Long quizId);

    boolean existsByUserIdAndQuizQuizCategoryAndStatusIn(Long userId, QuizCategory category, List<QuizAttemptStatus> statuses);

    @Query("SELECT a FROM QuizAttempt a WHERE a.user.id = :userId AND a.quiz.quizCategory = 'FINAL' AND a.status IN ('SUBMITTED')")
    List<QuizAttempt> findFinalAttemptsByUserId(@Param("userId") Long userId);

    List<QuizAttempt> findByUserIdAndQuizQuizCategoryAndQuizLevelIdOrderByStartedAtDesc(Long userId, QuizCategory category, Long levelId);

    List<QuizAttempt> findByUserIdAndQuizIdOrderByStartedAtDesc(Long userId, Long quizId);

    @Query("SELECT a FROM QuizAttempt a JOIN FETCH a.quiz WHERE a.user.id = :userId")
    List<QuizAttempt> findAllByUserIdWithQuiz(@Param("userId") Long userId);
}
