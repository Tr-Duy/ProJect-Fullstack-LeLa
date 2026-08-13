package com.lela.refreshtokensession;

import com.lela.common.exception.NotFoundExeception;
import com.lela.refreshtokensession.domain.RefreshTokenSession;
import com.lela.refreshtokensession.dto.RefreshTokenSessionCreateRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionPatchRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionResponse;
import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RefreshTokenSessionServiceImpl implements RefreshTokenSessionService {
    private final RefreshTokenSessionRepository repository;
    private final UsersRepository usersRepository;
    private final ModelMapper modelMapper;

    @Override
    public List<RefreshTokenSessionResponse> findAll() {
        // Lấy toàn bộ danh sách Refresh Token Session từ DB và ánh xạ sang DTO
        return repository.findAll().stream()
                .map(e -> modelMapper.map(e, RefreshTokenSessionResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<RefreshTokenSessionResponse> findById(Long id) {
        // Tìm Session theo ID, ánh xạ sang DTO nếu tìm thấy
        return repository.findById(id)
                .map(entity -> modelMapper.map(entity, RefreshTokenSessionResponse.class));
    }

    @Override
    public RefreshTokenSessionResponse create(RefreshTokenSessionCreateRequest request) {
        // Ánh xạ dữ liệu từ request DTO sang thực thể RefreshTokenSession
        RefreshTokenSession entity = modelMapper.map(request, RefreshTokenSession.class);

        // Truy vấn và gán thực thể User liên quan
        if (request.getUserId() != null) {
            Users user = usersRepository.findById(request.getUserId())
                    .orElseThrow(() -> new NotFoundExeception("Not found Users with id " + request.getUserId()));
            entity.setUser(user);
        }

        // Truy vấn và gán thực thể RefreshTokenSession bị thay thế (nếu có)
        if (request.getReplacedByTokenId() != null) {
            RefreshTokenSession replacedBy = repository.findById(request.getReplacedByTokenId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found RefreshTokenSession with id " + request.getReplacedByTokenId()));
            entity.setReplacedByToken(replacedBy);
        }

        entity = repository.save(entity);
        return modelMapper.map(entity, RefreshTokenSessionResponse.class);
    }

    @Override
    public RefreshTokenSessionResponse patch(Long id, RefreshTokenSessionPatchRequest request) {
        // Tìm phiên làm việc hiện tại, ném ngoại lệ nếu không tồn tại
        RefreshTokenSession entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Not found RefreshTokenSession with id " + id));

        // Cập nhật các trường thông tin lẻ (Null-safe partial update)
        if (request.getTokenHash() != null)
            entity.setTokenHash(request.getTokenHash());
        if (request.getTokenFamilyId() != null)
            entity.setTokenFamilyId(request.getTokenFamilyId());
        if (request.getDeviceName() != null)
            entity.setDeviceName(request.getDeviceName());
        if (request.getIpAddress() != null)
            entity.setIpAddress(request.getIpAddress());
        if (request.getUserAgent() != null)
            entity.setUserAgent(request.getUserAgent());
        if (request.getExpiresAt() != null)
            entity.setExpiresAt(request.getExpiresAt());
        if (request.getLastUsedAt() != null)
            entity.setLastUsedAt(request.getLastUsedAt());
        if (request.getRevokedAt() != null)
            entity.setRevokedAt(request.getRevokedAt());
        if (request.getRevokeReason() != null)
            entity.setRevokeReason(request.getRevokeReason());

        // Cập nhật User nếu được gửi lên
        if (request.getUserId() != null) {
            Users user = usersRepository.findById(request.getUserId())
                    .orElseThrow(() -> new NotFoundExeception("Not found Users with id " + request.getUserId()));
            entity.setUser(user);
        }

        // Cập nhật Token thay thế nếu được gửi lên
        if (request.getReplacedByTokenId() != null) {
            RefreshTokenSession replacedBy = repository.findById(request.getReplacedByTokenId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found RefreshTokenSession with id " + request.getReplacedByTokenId()));
            entity.setReplacedByToken(replacedBy);
        }

        entity = repository.save(entity);
        return modelMapper.map(entity, RefreshTokenSessionResponse.class);
    }

    @Override
    public void deleteById(Long id) {
        // Xóa phiên làm việc khỏi cơ sở dữ liệu
        repository.deleteById(id);
    }
}
