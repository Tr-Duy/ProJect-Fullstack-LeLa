package com.lela.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 30, message = "Tên đăng nhập phải từ 3 đến 30 ký tự")
    @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9._]{2,29}$", message = "Tên đăng nhập phải bắt đầu bằng chữ cái và chỉ chứa chữ cái, số, dấu gạch dưới hoặc dấu chấm")
    @Pattern(regexp = "^(?!\\d+$).*$", message = "Tên đăng nhập không được chỉ gồm toàn chữ số")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Size(max = 190, message = "Email phải ít hơn 190 ký tự")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=\\[\\]{};':\"\\\\|,.<>/?])(?=\\S+$).{8,100}$",
        message = "Mật khẩu phải từ 8 đến 100 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt và không chứa khoảng trắng"
    )
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 150, message = "Họ và tên phải từ 2 đến 150 ký tự")
    @Pattern(regexp = "^[\\p{L}\\s]{2,150}$", message = "Họ và tên chỉ bao gồm chữ cái và khoảng trắng")
    @Pattern(regexp = "^(?!\\d+$).*$", message = "Họ và tên không được chỉ gồm toàn chữ số")
    private String fullName;

    private String timezone;
    private Long nativeLanguageId;
    private Long targetLanguageId;
    private Integer dailyGoalCards;
}
