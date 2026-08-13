package com.lela.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class CheckDataTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void checkData() {
        System.out.println("========== DATABASE DATA CHECK ==========");
        
        Integer topics = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM topics", Integer.class);
        System.out.println("Topics Count: " + topics);
        
        Integer decks = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM decks", Integer.class);
        System.out.println("Decks Count: " + decks);
        
        Integer flashcards = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM flashcards", Integer.class);
        System.out.println("Flashcards Count: " + flashcards);
        
        Integer quizzes = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM quizzes", Integer.class);
        System.out.println("Quizzes Count: " + quizzes);
        
        List<Map<String, Object>> quizList = jdbcTemplate.queryForList("SELECT quiz_code, title FROM quizzes");
        System.out.println("Quizzes: " + quizList);
        
        System.out.println("=========================================");
    }
}
