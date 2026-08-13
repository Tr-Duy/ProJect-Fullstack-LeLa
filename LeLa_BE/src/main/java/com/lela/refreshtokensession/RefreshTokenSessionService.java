package com.lela.refreshtokensession;

import com.lela.refreshtokensession.dto.RefreshTokenSessionCreateRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionPatchRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionResponse;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenSessionService {
    // Lấy danh sách toàn bộ phiên làm việc.
    List<RefreshTokenSessionResponse> findAll();

    // Tìm kiếm phiên làm việc theo ID.
    Optional<RefreshTokenSessionResponse> findById(Long id);

    // Tạo mới phiên làm việc.
    RefreshTokenSessionResponse create(RefreshTokenSessionCreateRequest request);

    // Cập nhật một phần thông tin phiên làm việc (PATCH).
    RefreshTokenSessionResponse patch(Long id, RefreshTokenSessionPatchRequest request);

    // Xóa phiên làm việc theo ID.
    void deleteById(Long id);
}
