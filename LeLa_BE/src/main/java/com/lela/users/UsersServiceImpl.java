package com.lela.users;

import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;
import com.lela.common.exception.NotFoundExeception;
import com.lela.language.domain.Language;
import com.lela.language.LanguageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import com.lela.users.domain.Users;
import com.lela.users.dto.UsersCreateRequest;
import com.lela.users.dto.UsersPatchRequest;
import com.lela.users.dto.UsersResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UsersServiceImpl implements UsersService {
    private final UsersRepository repository;
    private final LanguageRepository languageRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;

    private UsersResponse mapToResponse(Users entity) {
        if (entity == null)
            return null;
        UsersResponse response = modelMapper.map(entity, UsersResponse.class);
        response.setRoles(entity.getRoleCodes());
        return response;
    }

    @Override
    public Page<UsersResponse> findAll(String search, String role, Pageable pageable) {
        return repository.searchUsers(search, role, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public Optional<UsersResponse> findById(Long id) {
        // Tìm thực thể người dùng theo ID, nếu tồn tại thì ánh xạ sang DTO phản hồi
        return repository.findById(id)
                .map(this::mapToResponse);
    }

    @Override
    public UsersResponse create(UsersCreateRequest request) {
        // Ánh xạ dữ liệu từ request DTO sang thực thể người dùng (Users)
        Users entity = modelMapper.map(request, Users.class);

        // Hash password
        entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Default values for progression
        entity.setXpTotal(0L);
        entity.setStreakCurrent(0);
        entity.setStreakLongest(0);

        // Nếu request có truyền nativeLanguageId, tiến hành kiểm tra tồn tại và gán vào
        // entity
        if (request.getNativeLanguageId() != null) {
            Language nativeLang = languageRepository.findById(request.getNativeLanguageId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found Language with id " + request.getNativeLanguageId()));
            entity.setNativeLanguage(nativeLang);
        }

        // Nếu request có truyền targetLanguageId, tiến hành kiểm tra tồn tại và gán vào
        // entity
        if (request.getTargetLanguageId() != null) {
            Language targetLang = languageRepository.findById(request.getTargetLanguageId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found Language with id " + request.getTargetLanguageId()));
            entity.setTargetLanguage(targetLang);
        }

        // Lưu thông tin người dùng mới vào cơ sở dữ liệu
        entity = repository.save(entity);
        // Trả về thông tin chi tiết người dùng dưới dạng DTO phản hồi
        return mapToResponse(entity);
    }

    @Override
    public UsersResponse patch(Long id, UsersPatchRequest request) {
        // Tìm kiếm thông tin người dùng hiện tại trong cơ sở dữ liệu, ném ngoại lệ nếu
        // không tìm thấy
        Users entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Not found Users with id " + id));

        // Cập nhật từng trường thông tin nếu giá trị trong request khác null (Null-safe
        // partial update)
        if (request.getUsername() != null)
            entity.setUsername(request.getUsername());
        if (request.getEmail() != null)
            entity.setEmail(request.getEmail());
        if (request.getPassword() != null)
            entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        if (request.getFullName() != null)
            entity.setFullName(request.getFullName());
        if (request.getAvatarUrl() != null)
            entity.setAvatarUrl(request.getAvatarUrl());
        if (request.getStatus() != null)
            entity.setStatus(request.getStatus());
        if (request.getTimezone() != null)
            entity.setTimezone(request.getTimezone());
        if (request.getDailyGoalCards() != null)
            entity.setDailyGoalCards(request.getDailyGoalCards());

        // Kiểm tra và cập nhật thông tin Ngôn ngữ mẹ đẻ nếu có sự thay đổi
        if (request.getNativeLanguageId() != null) {
            Language nativeLang = languageRepository.findById(request.getNativeLanguageId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found Language with id " + request.getNativeLanguageId()));
            entity.setNativeLanguage(nativeLang);
        }

        // Kiểm tra và cập nhật thông tin Ngôn ngữ mục tiêu nếu có sự thay đổi
        if (request.getTargetLanguageId() != null) {
            Language targetLang = languageRepository.findById(request.getTargetLanguageId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found Language with id " + request.getTargetLanguageId()));
            entity.setTargetLanguage(targetLang);
        }

        // Lưu thông tin cập nhật vào DB
        entity = repository.save(entity);
        // Trả về thông tin chi tiết của người dùng sau khi cập nhật
        return mapToResponse(entity);
    }

    @Override
    public void deleteById(Long id) {
        // Thực hiện xóa người dùng theo ID
        repository.deleteById(id);
    }
}
