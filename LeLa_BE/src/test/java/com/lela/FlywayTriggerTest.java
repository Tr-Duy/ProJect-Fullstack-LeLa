package com.lela;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class FlywayTriggerTest {
    @Test
    void contextLoads() {
        System.out.println("Spring Boot context loaded. Flyway should have executed.");
    }
}
