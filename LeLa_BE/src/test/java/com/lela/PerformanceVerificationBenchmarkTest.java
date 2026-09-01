package com.lela;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PerformanceVerificationBenchmarkTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Run Full Database Index and EXPLAIN Verification")
    public void verifyDatabaseIndexesAndExplain() {
        System.out.println("\n============================================================");
        System.out.println("8. DATABASE INDEX & EXPLAIN AUDIT");
        System.out.println("============================================================");

        List<Map<String, Object>> allTables = jdbcTemplate.queryForList("SHOW TABLES");
        for (Map<String, Object> t : allTables) {
            String tableName = t.values().iterator().next().toString();
            if (tableName.contains("deck") || tableName.contains("quiz") || tableName.contains("card") || tableName.contains("user") || tableName.contains("achieve")) {
                System.out.println("\n--- SHOW INDEX FROM " + tableName + " ---");
                try {
                    List<Map<String, Object>> indexes = jdbcTemplate.queryForList("SHOW INDEX FROM " + tableName);
                    for (Map<String, Object> idx : indexes) {
                        System.out.println(String.format("Table: %-22s Key_name: %-30s Column: %-20s Seq: %-2s Non_unique: %s",
                                idx.get("Table"), idx.get("Key_name"), idx.get("Column_name"), idx.get("Seq_in_index"), idx.get("Non_unique")));
                    }
                } catch (Exception e) {
                    System.out.println("Could not show index: " + e.getMessage());
                }
            }
        }

        System.out.println("\n--- EXPLAIN QUERY ANALYSES ---");
        explainQuery("EXPLAIN SELECT * FROM decks WHERE is_active = 1 AND level_id = 1 AND exam_type_id = 1");
        explainQuery("EXPLAIN SELECT * FROM quizzes WHERE quiz_category = 'LEVEL_UP' AND level_id = 1 AND is_active = 1");
        explainQuery("EXPLAIN SELECT * FROM deck_tags WHERE tag_id = 1");
        explainQuery("EXPLAIN SELECT * FROM flashcard_tags WHERE flashcard_id IN (1, 2, 3, 4, 5)");
        explainQuery("EXPLAIN SELECT * FROM deck_enrollments WHERE user_id = 1");
    }

    private void explainQuery(String sql) {
        System.out.println("\nQuery: " + sql);
        List<Map<String, Object>> plan = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> row : plan) {
            System.out.println("  table=" + row.get("table") +
                    ", type=" + row.get("type") +
                    ", possible_keys=" + row.get("possible_keys") +
                    ", key=" + row.get("key") +
                    ", key_len=" + row.get("key_len") +
                    ", ref=" + row.get("ref") +
                    ", rows=" + row.get("rows") +
                    ", Extra=" + row.get("Extra"));
        }
    }

    @Test
    @DisplayName("Benchmark Backend API Endpoints")
    public void benchmarkBackendEndpoints() throws Exception {
        System.out.println("\n============================================================");
        System.out.println("1. BACKEND API BENCHMARK (HTTP, TIME, PAYLOAD, QUIZ STRUCTURE)");
        System.out.println("============================================================");

        // Find a real user in DB
        List<Map<String, Object>> userRows = jdbcTemplate.queryForList("SELECT id, username FROM users LIMIT 1");
        String username = userRows.isEmpty() ? "admin" : (String) userRows.get(0).get("username");
        Long userId = userRows.isEmpty() ? 1L : ((Number) userRows.get(0).get("id")).longValue();

        org.springframework.security.core.userdetails.User principal = new org.springframework.security.core.userdetails.User(
                username, "password", java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"), new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_LEARNER"))
        );
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        // 1. GET /enrollments/my-list
        benchmarkEndpoint("GET /enrollments/my-list", "/enrollments/my-list?size=50", username);

        // 2. GET /decks
        benchmarkEndpoint("GET /decks", "/decks?size=20", username);

        // Find a valid deck id
        List<Map<String, Object>> deckRows = jdbcTemplate.queryForList("SELECT id FROM decks WHERE is_active = 1 LIMIT 1");
        Long sampleDeckId = deckRows.isEmpty() ? 1L : ((Number) deckRows.get(0).get("id")).longValue();

        // 3. GET /decks/{id}
        benchmarkEndpoint("GET /decks/{id}", "/decks/" + sampleDeckId, username);

        // 4. GET /quizzes (Summary)
        MvcResult quizzesResult = benchmarkEndpoint("GET /quizzes (Summary)", "/quizzes?size=20", username);
        verifyQuizSummaryPayload(quizzesResult);

        // Find a valid quiz id
        List<Map<String, Object>> quizRows = jdbcTemplate.queryForList("SELECT id FROM quizzes WHERE is_active = 1 LIMIT 1");
        Long sampleQuizId = quizRows.isEmpty() ? 1L : ((Number) quizRows.get(0).get("id")).longValue();

        // 5. GET /quizzes/{id} (Full with Questions)
        MvcResult singleQuizResult = benchmarkEndpoint("GET /quizzes/{id} (Full)", "/quizzes/" + sampleQuizId, username);
        verifyQuizFullPayload(singleQuizResult);

        // 6. GET /flashcards/deck/{deckId}
        benchmarkEndpoint("GET /flashcards/deck/{deckId}", "/flashcards/deck/" + sampleDeckId + "?size=20", username);

        // 7. GET /achievements/my-progress
        benchmarkEndpoint("GET /achievements/my-progress", "/achievements/my-progress", username);

        // 8. GET /achievements/me
        benchmarkEndpoint("GET /achievements/me", "/achievements/me", username);

        // 9. GET /admin/metrics
        benchmarkEndpoint("GET /admin/metrics", "/admin/metrics", username);

        // 10. GET /users (Admin user list)
        benchmarkEndpoint("GET /users (Admin)", "/users?size=20", username);
    }

    private MvcResult benchmarkEndpoint(String name, String uri, String username) throws Exception {
        // Warmup
        mockMvc.perform(get(uri)
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(username).roles("ADMIN", "LEARNER"))
                .contentType(MediaType.APPLICATION_JSON));

        // Measured runs
        int runs = 5;
        long totalTimeMs = 0;
        MvcResult lastResult = null;
        for (int i = 0; i < runs; i++) {
            long start = System.nanoTime();
            lastResult = mockMvc.perform(get(uri)
                    .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(username).roles("ADMIN", "LEARNER"))
                    .contentType(MediaType.APPLICATION_JSON))
                    .andReturn();
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            totalTimeMs += elapsed;
        }

        long avgTimeMs = totalTimeMs / runs;
        int status = lastResult.getResponse().getStatus();
        byte[] content = lastResult.getResponse().getContentAsByteArray();
        int sizeBytes = content.length;

        System.out.println(String.format("Endpoint: %-32s | Status: %d | Avg Latency: %3d ms | Response Size: %6d bytes",
                name, status, avgTimeMs, sizeBytes));

        return lastResult;
    }

    private void verifyQuizSummaryPayload(MvcResult result) throws Exception {
        String json = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(json);
        JsonNode data = root.has("data") ? root.get("data") : root;
        JsonNode content = data.has("content") ? data.get("content") : data;

        boolean containsQuestions = false;
        if (content.isArray() && content.size() > 0) {
            JsonNode firstQuiz = content.get(0);
            if (firstQuiz.has("questions") && !firstQuiz.get("questions").isNull() && firstQuiz.get("questions").size() > 0) {
                containsQuestions = true;
            }
        }
        System.out.println("  -> [AUDIT Item 3] GET /quizzes returns questions array: " + (containsQuestions ? "FAIL (Questions present)" : "PASS (No questions/options overhead in summary)"));
    }

    private void verifyQuizFullPayload(MvcResult result) throws Exception {
        String json = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(json);
        JsonNode data = root.has("data") ? root.get("data") : root;

        boolean hasQuestions = data.has("questions") && !data.get("questions").isNull();
        int questionCount = hasQuestions ? data.get("questions").size() : 0;
        System.out.println("  -> [AUDIT Item 3] GET /quizzes/{id} returns questions array: " + (hasQuestions ? "PASS (" + questionCount + " questions loaded on start)" : "EMPTY"));
    }
}
