package com.lela.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
public class FixAdminPasswordTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void fixAdminPassword() {
        try {
            String newHash = passwordEncoder.encode("123456");
            int rows = jdbcTemplate.update("UPDATE users SET password_hash = ? WHERE username = 'admin'", newHash);
            System.out.println("UPDATED ADMIN PASSWORD! Rows affected: " + rows);
        } catch (Exception e) {
            System.out.println("COULD NOT UPDATE: " + e.getMessage());
        }
    }
}
