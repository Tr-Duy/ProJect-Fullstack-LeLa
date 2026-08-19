package com.lela.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class FixAdminPasswordTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void testBCryptPasswordEncoder() {
        String rawPassword = "123456";
        String encodedHash = passwordEncoder.encode(rawPassword);
        System.out.println("GENERATED_BCRYPT_HASH_START>>>" + encodedHash + "<<<GENERATED_BCRYPT_HASH_END");
        
        boolean matches = passwordEncoder.matches(rawPassword, encodedHash);
        System.out.println("VERIFY MATCHES RESULT: " + matches);
        
        assertTrue(matches, "passwordEncoder.matches('123456', generatedHash) MUST be true");
    }
}
