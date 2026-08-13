package com.lela.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuestStartChatRequest {
    @NotBlank(message = "Họ tên không được để trống")
    private String guestName;

    private String guestEmail;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String guestPhone;

    private String guestDepartment;
    
    @NotBlank(message = "Nội dung tin nhắn đầu tiên không được để trống")
    private String message;
}
