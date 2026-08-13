package com.lela.language;

import com.lela.language.dto.LanguageCreateRequest;
import com.lela.language.dto.LanguagePatchRequest;
import com.lela.language.dto.LanguageResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lela.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/languages")
@RequiredArgsConstructor
public class LanguageController {
    private final LanguageService service;

    // API lấy danh sách toàn bộ ngôn ngữ.
    @GetMapping
    public ResponseEntity<ApiResponse<List<LanguageResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(), "Lấy danh sách thành công"));
    }

    // API tìm kiếm ngôn ngữ theo ID.
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LanguageResponse>> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Tìm thấy ngôn ngữ")))
                .orElse(ResponseEntity.notFound().build());
    }

    // API tạo mới ngôn ngữ.
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LanguageResponse>> create(@Valid @RequestBody LanguageCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(request), "Tạo ngôn ngữ thành công"));
    }

    // API cập nhật một phần thông tin ngôn ngữ (PATCH).
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LanguageResponse>> patch(@PathVariable Long id, @Valid @RequestBody LanguagePatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.patch(id, request), "Cập nhật thành công"));
    }

    // API xóa ngôn ngữ theo ID.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteById(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Xóa thành công"));
    }
}
