package com.lela.role;

import com.lela.role.dto.RoleCreateRequest;
import com.lela.role.dto.RolePatchRequest;
import com.lela.role.dto.RoleResponse;
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
@RequestMapping("/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {
    private final RoleService service;

    // API lấy danh sách toàn bộ vai trò.
    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(), "Lấy danh sách thành công"));
    }

    // API tìm kiếm vai trò theo ID.
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Tìm thấy vai trò")))
                .orElse(ResponseEntity.notFound().build());
    }

    // API tạo mới vai trò.
    @PostMapping
    public ResponseEntity<ApiResponse<RoleResponse>> create(@Valid @RequestBody RoleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(request), "Tạo vai trò thành công"));
    }

    // API cập nhật một phần thông tin vai trò (PATCH).
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> patch(@PathVariable Long id, @Valid @RequestBody RolePatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.patch(id, request), "Cập nhật thành công"));
    }

    // API xóa vai trò theo ID.
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteById(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Xóa thành công"));
    }
}
