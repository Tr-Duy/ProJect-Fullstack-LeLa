package com.lela.srsreview.dto;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.*;
import java.util.List;

@Getter
@Setter
public class SyncReviewRequest {

    @NotBlank(message = "Session Public ID không được để trống")
    @Size(min = 36, max = 36, message = "Session Public ID phải đúng định dạng UUID 36 ký tự")
    private String sessionPublicId;

    @NotEmpty(message = "Danh sách sự kiện ôn tập không được rỗng")
    private List<@Valid ReviewEventDto> events;
}