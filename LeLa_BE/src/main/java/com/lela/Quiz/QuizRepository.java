package com.lela.Quiz;

import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    boolean existsByQuizCode(String quizCode);
    java.util.Optional<Quiz> findByQuizCode(String quizCode);
    List<Quiz> findByDeckIdAndIsActiveTrue(Long deckId);
    List<Quiz> findByQuizCategoryAndExamTypeIdAndIsActiveTrue(QuizCategory category, Long examTypeId);
    List<Quiz> findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory category, Long levelId);
    List<Quiz> findByQuizCategoryAndIsActiveTrue(QuizCategory category);
    Page<Quiz> findByQuizCategory(QuizCategory category, Pageable pageable);
    Page<Quiz> findByQuizCategoryAndExamTypeId(QuizCategory category, Long examTypeId, Pageable pageable);
    Page<Quiz> findByQuizCategoryAndLevelId(QuizCategory category, Long levelId, Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE q.isActive = true AND " +
           "(q.quizCategory = com.lela.Quiz.domain.QuizCategory.PLACEMENT OR " +
           "(q.level IS NOT NULL AND q.level.id = :levelId))")
    Page<Quiz> findAllForLearnerLevel(@Param("levelId") Long levelId, Pageable pageable);

    Page<Quiz> findByQuizCategoryAndIsActiveTrue(QuizCategory category, Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE q.isActive = true AND q.level IS NOT NULL AND q.level.id = :levelId " +
           "AND q.quizCategory IN :categories")
    Page<Quiz> findByLevelIdAndCategoriesForLearner(@Param("levelId") Long levelId,
                                                    @Param("categories") List<QuizCategory> categories,
                                                    Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE q.deletedAt IS NULL AND " +
           "(:category IS NULL OR q.quizCategory = :category) AND " +
           "(:levelId IS NULL OR (q.level IS NOT NULL AND q.level.id = :levelId)) AND " +
           "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
           "(:deckId IS NULL OR (q.deck IS NOT NULL AND q.deck.id = :deckId)) AND " +
           "(:search IS NULL OR LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.quizCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Quiz> findWithFilters(@Param("category") QuizCategory category,
                               @Param("levelId") Long levelId,
                               @Param("difficulty") com.lela.Quiz.domain.QuizDifficulty difficulty,
                               @Param("deckId") Long deckId,
                               @Param("search") String search,
                               Pageable pageable);
}
