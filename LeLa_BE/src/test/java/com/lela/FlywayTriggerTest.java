package com.lela;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class FlywayTriggerTest {
    @Test
    void contextLoads() {
        System.out.println("Spring Boot context loaded. Flyway should have executed.");
    }
}
