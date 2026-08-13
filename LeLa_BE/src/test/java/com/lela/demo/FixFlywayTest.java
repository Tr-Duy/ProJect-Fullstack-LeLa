package com.lela.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = "spring.flyway.enabled=false")
public class FixFlywayTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void fixFlyway() {
        try {
            int rows = jdbcTemplate.update("DELETE FROM flyway_schema_history WHERE success = 0");
            System.out.println("DELETED " + rows + " FAILED MIGRATIONS!");
        } catch (Exception e) {
            System.out.println("COULD NOT DELETE: " + e.getMessage());
        }
    }
}
