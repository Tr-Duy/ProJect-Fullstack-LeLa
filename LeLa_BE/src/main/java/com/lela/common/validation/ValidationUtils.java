package com.lela.common.validation;

import java.util.regex.Pattern;

public class ValidationUtils {

    // Password: 8-100 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char, NO whitespace
    public static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=\\[\\]{};':\"\\\\|,.<>/?])(?=\\S+$).{8,100}$";
    public static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);
    public static final String PASSWORD_MESSAGE = "Mật khẩu phải từ 8 đến 100 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt và không chứa khoảng trắng";

    // Username: 3-30 chars, starts with letter, letters/digits/_/., not all digits
    public static final String USERNAME_REGEX = "^[a-zA-Z][a-zA-Z0-9._]{2,29}$";
    public static final Pattern USERNAME_PATTERN = Pattern.compile(USERNAME_REGEX);
    public static final String USERNAME_MESSAGE = "Tên đăng nhập phải từ 3-30 ký tự, bắt đầu bằng chữ cái, chỉ chứa chữ, số, dấu gạch dưới, dấu chấm và không được chỉ gồm toàn số";

    // Phone: VN phone 10 digits starting with 03|05|07|08|09 or +84
    public static final String PHONE_REGEX = "^(\\+84|0)(3|5|7|8|9)[0-9]{8}$";
    public static final Pattern PHONE_PATTERN = Pattern.compile(PHONE_REGEX);
    public static final String PHONE_MESSAGE = "Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam hợp lệ)";

    // FullName: 2-150 chars, Unicode letters and spaces, not digits only
    public static final String FULLNAME_REGEX = "^[\\p{L}\\s]{2,150}$";
    public static final Pattern FULLNAME_PATTERN = Pattern.compile(FULLNAME_REGEX);
    public static final String FULLNAME_MESSAGE = "Họ và tên không hợp lệ (từ 2 đến 150 ký tự, hỗ trợ tiếng Việt, không chứa chữ số hoặc ký tự đặc biệt)";

    public static boolean isValidUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }
        String trimmed = username.trim();
        if (trimmed.matches("^\\d+$")) {
            return false;
        }
        return USERNAME_PATTERN.matcher(trimmed).matches();
    }

    public static boolean isValidPassword(String password) {
        if (password == null) {
            return false;
        }
        return PASSWORD_PATTERN.matcher(password).matches();
    }

    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return true; // Phone is optional in some contexts unless @NotBlank is applied
        }
        return PHONE_PATTERN.matcher(phone.trim()).matches();
    }

    public static boolean isValidFullName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return false;
        }
        String trimmed = fullName.trim();
        if (trimmed.matches("^\\d+$")) {
            return false;
        }
        return FULLNAME_PATTERN.matcher(trimmed).matches();
    }
}
