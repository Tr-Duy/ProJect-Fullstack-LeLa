package com.lela;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbTest {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/flashcard_platfom";
        String user = "root";
        String password = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("=== EXAM TYPES ===");
            try (ResultSet rs = stmt.executeQuery("SELECT code, name, max_scale_score FROM exam_types ORDER BY id")) {
                while (rs.next()) {
                    System.out.println(rs.getString("code") + " - " + rs.getString("name") + " - " + rs.getInt("max_scale_score"));
                }
            }

            System.out.println("=== PROFICIENCY LEVELS ===");
            try (ResultSet rs = stmt.executeQuery("SELECT pl.id, pl.name, pl.min_score, pl.max_score FROM proficiency_levels pl JOIN exam_types et ON pl.exam_type_id = et.id ORDER BY pl.id")) {
                while (rs.next()) {
                    System.out.println(rs.getString("name") + " [" + rs.getInt("min_score") + "-" + rs.getInt("max_score") + "]");
                }
            }

            String[] queries = {
                "SELECT COUNT(*) FROM users u LEFT JOIN exam_types et ON u.current_exam_type_id = et.id WHERE u.current_exam_type_id IS NOT NULL AND et.id IS NULL",
                "SELECT COUNT(*) FROM users u LEFT JOIN proficiency_levels pl ON u.current_level_id = pl.id WHERE u.current_level_id IS NOT NULL AND pl.id IS NULL",
                "SELECT COUNT(*) FROM quizzes q LEFT JOIN exam_types et ON q.exam_type_id = et.id LEFT JOIN decks d ON q.deck_id = d.id WHERE (q.exam_type_id IS NOT NULL AND et.id IS NULL) OR (q.deck_id IS NOT NULL AND d.id IS NULL)",
                "SELECT COUNT(*) FROM decks d LEFT JOIN exam_types et ON d.exam_type_id = et.id WHERE d.exam_type_id IS NOT NULL AND et.id IS NULL",
                "SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id NOT IN (SELECT id FROM quizzes)",
                "SELECT COUNT(*) FROM quiz_questions WHERE quiz_id NOT IN (SELECT id FROM quizzes)",
                "SELECT COUNT(*) FROM quiz_question_options WHERE question_id NOT IN (SELECT id FROM quiz_questions)",
                "SELECT COUNT(*) FROM quiz_attempt_questions WHERE attempt_id NOT IN (SELECT id FROM quiz_attempts) OR source_question_id NOT IN (SELECT id FROM quiz_questions)",
                "SELECT COUNT(*) FROM quiz_attempt_options WHERE attempt_question_id NOT IN (SELECT id FROM quiz_attempt_questions) OR source_option_id NOT IN (SELECT id FROM quiz_question_options)",
                "SELECT COUNT(*) FROM quiz_answers WHERE attempt_id NOT IN (SELECT id FROM quiz_attempts) OR attempt_question_id NOT IN (SELECT id FROM quiz_attempt_questions) OR selected_attempt_option_id NOT IN (SELECT id FROM quiz_attempt_options)",
                "SELECT COUNT(*) FROM flashcards WHERE deck_id NOT IN (SELECT id FROM decks)",
                "SELECT COUNT(*) FROM flashcard_tags WHERE flashcard_id NOT IN (SELECT id FROM flashcards)",
                "SELECT COUNT(*) FROM card_progress WHERE card_id NOT IN (SELECT id FROM flashcards)",
                "SELECT COUNT(*) FROM review_sessions WHERE deck_id NOT IN (SELECT id FROM decks)",
                "SELECT COUNT(*) FROM srs_reviews WHERE review_session_id NOT IN (SELECT id FROM review_sessions) OR card_id NOT IN (SELECT id FROM flashcards)",
                "SELECT COUNT(*) FROM deck_enrollments WHERE deck_id NOT IN (SELECT id FROM decks)"
            };

            String[] names = {
                "User có ExamType vô hiệu",
                "User có Level vô hiệu",
                "Quizzes có ExamType/Deck vô hiệu",
                "Decks có ExamType vô hiệu",
                "Orphan quiz_attempts",
                "Orphan quiz_questions",
                "Orphan quiz_question_options",
                "Orphan quiz_attempt_questions",
                "Orphan quiz_attempt_options",
                "Orphan quiz_answers",
                "Orphan flashcards",
                "Orphan flashcard_tags",
                "Orphan card_progress",
                "Orphan review_sessions",
                "Orphan srs_reviews",
                "Orphan deck_enrollments"
            };

            for (int i = 0; i < queries.length; i++) {
                try (ResultSet rs = stmt.executeQuery(queries[i])) {
                    if (rs.next()) {
                        System.out.println(names[i] + ": " + rs.getInt(1));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
