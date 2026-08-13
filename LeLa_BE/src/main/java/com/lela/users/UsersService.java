package com.lela.users;

import com.lela.users.dto.UsersCreateRequest;
import com.lela.users.dto.UsersPatchRequest;
import com.lela.users.dto.UsersResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface UsersService {
    // Lấy danh sách toàn bộ người dùng có phân trang.
    Page<UsersResponse> findAll(String search, String role, Pageable pageable);

    // Tìm kiếm người dùng theo ID.
    Optional<UsersResponse> findById(Long id);

    // Tạo mới người dùng.
    UsersResponse create(UsersCreateRequest request);

    // Cập nhật một phần thông tin người dùng (PATCH).
    UsersResponse patch(Long id, UsersPatchRequest request);

    // Xóa người dùng theo ID.
    void deleteById(Long id);
}
