package com.lela.refreshtokensession;

import com.lela.refreshtokensession.dto.RefreshTokenSessionCreateRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionPatchRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/refresh-token-sessions")
@RequiredArgsConstructor
public class RefreshTokenSessionController {
    private final RefreshTokenSessionService service;

    // API lấy danh sách toàn bộ phiên làm việc.
    @GetMapping
    public List<RefreshTokenSessionResponse> findAll() {
        return service.findAll();
    }

    // API tìm kiếm phiên làm việc theo ID.
    @GetMapping("/{id}")
    public ResponseEntity<RefreshTokenSessionResponse> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // API tạo mới phiên làm việc.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RefreshTokenSessionResponse create(@Valid @RequestBody RefreshTokenSessionCreateRequest request) {
        return service.create(request);
    }

    // API cập nhật một phần thông tin phiên làm việc (PATCH).
    @PatchMapping("/{id}")
    public RefreshTokenSessionResponse patch(@PathVariable Long id,
            @Valid @RequestBody RefreshTokenSessionPatchRequest request) {
        return service.patch(id, request);
    }

    // API xóa phiên làm việc theo ID.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteById(@PathVariable Long id) {
        service.deleteById(id);
    }
}
