package com.lela.Quiz;

import com.lela.Quiz.domain.QuizCategory;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class LevelChangeApiTest {

    @Autowired
    private QuizService quizService;

    @Autowired
    private UsersRepository usersRepository;

    private void authenticateUser(String username) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Verify learner2 (Current Level = 3) gets 10 Upgrade/Level-Change Tests for EVERY Target Level 1, 2, 3, 4")
    void testLearnerGetsTenQuizzesForAnySelectedTargetLevel() {
        authenticateUser("learner2");
        Users learner2 = usersRepository.findByUsername("learner2").orElseThrow();
        assertThat(learner2.getCurrentLevel().getId()).isEqualTo(3L); // Level 3: Khá - Giỏi (700 - 850)

        for (long targetLevelId = 1L; targetLevelId <= 4L; targetLevelId++) {
            List<QuizResponse> searchResults = quizService.searchQuizzes(QuizCategory.LEVEL_UP, null, targetLevelId);
            assertThat(searchResults)
                    .withFailMessage("Expected 10 quizzes for Target Level %d, but got %d", targetLevelId, searchResults.size())
                    .hasSize(10);

            // Invariant 1: First test #01 MUST BE AVAILABLE
            assertThat(searchResults.get(0).getAttemptStatus()).isEqualTo("AVAILABLE");
            assertThat(searchResults.get(0).getIsLocked()).isFalse();

            // Invariant 2: Exactly 1 test is AVAILABLE
            long availableCount = searchResults.stream().filter(q -> "AVAILABLE".equals(q.getAttemptStatus())).count();
            assertThat(availableCount).isEqualTo(1);
        }
    }
}
