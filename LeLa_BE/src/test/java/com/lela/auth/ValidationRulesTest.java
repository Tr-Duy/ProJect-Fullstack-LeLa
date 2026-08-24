package com.lela.auth;

import com.lela.common.validation.ValidationUtils;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ValidationRulesTest {

    @Test
    public void testPasswordValidation() {
        // VALID
        assertTrue(ValidationUtils.isValidPassword("Abc@1234"));

        // INVALID
        assertFalse(ValidationUtils.isValidPassword("12345678"), "Should reject password without letters/symbols");
        assertFalse(ValidationUtils.isValidPassword("abcdefgh"), "Should reject password without uppercase/digits/symbols");
        assertFalse(ValidationUtils.isValidPassword("ABCDEFGH"), "Should reject password without lowercase/digits/symbols");
        assertFalse(ValidationUtils.isValidPassword("Abcdefgh"), "Should reject password without digits/symbols");
        assertFalse(ValidationUtils.isValidPassword("Abcdefg1"), "Should reject password without symbols");
        assertFalse(ValidationUtils.isValidPassword("Abc 12345"), "Should reject password with spaces");
        assertFalse(ValidationUtils.isValidPassword("abc@1234"), "Should reject password without uppercase");
        assertFalse(ValidationUtils.isValidPassword("ABC@1234"), "Should reject password without lowercase");
    }

    @Test
    public void testUsernameValidation() {
        // VALID
        assertTrue(ValidationUtils.isValidUsername("duy"));
        assertTrue(ValidationUtils.isValidUsername("duy123"));
        assertTrue(ValidationUtils.isValidUsername("duy_123"));
        assertTrue(ValidationUtils.isValidUsername("duy.truong"));

        // INVALID
        assertFalse(ValidationUtils.isValidUsername("123456"), "Should reject digits-only username");
        assertFalse(ValidationUtils.isValidUsername("12duy"), "Should reject username starting with digits");
        assertFalse(ValidationUtils.isValidUsername("_duy"), "Should reject username starting with underscore");
        assertFalse(ValidationUtils.isValidUsername(".duy"), "Should reject username starting with dot");
        assertFalse(ValidationUtils.isValidUsername("!!!"), "Should reject special symbols");
        assertFalse(ValidationUtils.isValidUsername("a"), "Should reject username shorter than 3 chars");
        assertFalse(ValidationUtils.isValidUsername("thisusernameiswaytoolongexceedingthirtycharacters"), "Should reject username longer than 30 chars");
    }

    @Test
    public void testFullNameValidation() {
        // VALID - Vietnamese Unicode
        assertTrue(ValidationUtils.isValidFullName("Trường Duy Doan"));
        assertTrue(ValidationUtils.isValidFullName("Nguyễn Văn An"));
        assertTrue(ValidationUtils.isValidFullName("Đặng Thị Hồng"));

        // INVALID
        assertFalse(ValidationUtils.isValidFullName("123456"), "Should reject digits-only name");
        assertFalse(ValidationUtils.isValidFullName("a"), "Should reject name shorter than 2 chars");
    }

    @Test
    public void testPhoneValidation() {
        // VALID - VN phone format
        assertTrue(ValidationUtils.isValidPhone("0912345678"));
        assertTrue(ValidationUtils.isValidPhone("0987654321"));
        assertTrue(ValidationUtils.isValidPhone("+84912345678"));

        // INVALID
        assertFalse(ValidationUtils.isValidPhone("abc"));
        assertFalse(ValidationUtils.isValidPhone("123"));
        assertFalse(ValidationUtils.isValidPhone("phone@example.com"));
        assertFalse(ValidationUtils.isValidPhone("12-34-56"));
    }
}
