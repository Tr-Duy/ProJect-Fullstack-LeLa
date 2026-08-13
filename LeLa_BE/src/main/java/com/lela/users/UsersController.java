package com.lela.users;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.lela.users.dto.UsersCreateRequest;
import com.lela.users.dto.UsersPatchRequest;
import com.lela.users.dto.UsersResponse;
import jakarta.validation.Valid;
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
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UsersController {
    private final UsersService service;

    // API lấy danh sách toàn bộ người dùng.
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UsersResponse>>> findAll(
            @org.springframework.web.bind.annotation.RequestParam(value = "search", required = false) String search,
            @org.springframework.web.bind.annotation.RequestParam(value = "role", required = false) String role,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(search, role, pageable), "Lấy danh sách thành công"));
    }

    // API tìm kiếm người dùng theo ID.
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsersResponse>> findById(@PathVariable("id") Long id) {
        return service.findById(id)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Tìm thấy người dùng")))
                .orElse(ResponseEntity.notFound().build());
    }

    // API tạo mới người dùng.
    @PostMapping
    public ResponseEntity<ApiResponse<UsersResponse>> create(@Valid @RequestBody UsersCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(request), "Tạo người dùng thành công"));
    }

    // API cập nhật một phần thông tin người dùng (PATCH).
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<UsersResponse>> patch(@PathVariable("id") Long id, @Valid @RequestBody UsersPatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.patch(id, request), "Cập nhật thành công"));
    }

    // API xóa người dùng theo ID.
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteById(@PathVariable("id") Long id) {
        service.deleteById(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Xóa thành công"));
    }
}
