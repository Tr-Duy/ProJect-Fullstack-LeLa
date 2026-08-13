package com.lela.subscriptionplan;

import com.lela.subscriptionplan.dto.SubscriptionPlanCreateRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanPatchRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanResponse;
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
@RequestMapping("/subscription-plans")
@RequiredArgsConstructor
public class SubscriptionPlanController {
    private final SubscriptionPlanService service;

    // API lấy danh sách toàn bộ gói đăng ký.
    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(), "Lấy danh sách thành công"));
    }

    // API tìm kiếm gói đăng ký theo ID.
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Tìm thấy gói đăng ký")))
                .orElse(ResponseEntity.notFound().build());
    }

    // API tạo mới gói đăng ký.
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> create(@Valid @RequestBody SubscriptionPlanCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(request), "Tạo gói đăng ký thành công"));
    }

    // API cập nhật một phần thông tin gói đăng ký (PATCH).
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> patch(@PathVariable Long id,
            @Valid @RequestBody SubscriptionPlanPatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.patch(id, request), "Cập nhật thành công"));
    }

    // API xóa gói đăng ký theo ID.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteById(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Xóa thành công"));
    }
}
