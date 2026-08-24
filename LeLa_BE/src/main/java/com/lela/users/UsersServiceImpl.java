package com.lela.users;

import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;
import com.lela.common.exception.ConflictException;
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
        return repository.findById(id)
                .map(this::mapToResponse);
    }

    @Override
    public UsersResponse create(UsersCreateRequest request) {
        String normalizedUsername = request.getUsername() != null ? request.getUsername().trim() : null;
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;

        if (normalizedUsername != null && repository.existsByUsername(normalizedUsername)) {
            throw new ConflictException("Tên đăng nhập đã được sử dụng");
        }
        if (normalizedEmail != null && repository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email đã được đăng ký");
        }

        Users entity = modelMapper.map(request, Users.class);
        if (normalizedUsername != null) {
            entity.setUsername(normalizedUsername);
        }
        if (normalizedEmail != null) {
            entity.setEmail(normalizedEmail);
        }
        if (request.getFullName() != null) {
            entity.setFullName(request.getFullName().trim());
        }

        // Hash password
        entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Default values for progression
        entity.setXpTotal(0L);
        entity.setStreakCurrent(0);
        entity.setStreakLongest(0);

        if (request.getNativeLanguageId() != null) {
            Language nativeLang = languageRepository.findById(request.getNativeLanguageId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found Language with id " + request.getNativeLanguageId()));
            entity.setNativeLanguage(nativeLang);
        }

        if (request.getTargetLanguageId() != null) {
            Language targetLang = languageRepository.findById(request.getTargetLanguageId())
                    .orElseThrow(() -> new NotFoundExeception(
                            "Not found Language with id " + request.getTargetLanguageId()));
            entity.setTargetLanguage(targetLang);
        }

        entity = repository.save(entity);
        return mapToResponse(entity);
    }

    @Override
    public UsersResponse patch(Long id, UsersPatchRequest request) {
        Users entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Not found Users with id " + id));

        if (request.getUsername() != null) {
            String newUsername = request.getUsername().trim();
            if (!newUsername.equalsIgnoreCase(entity.getUsername()) && repository.existsByUsername(newUsername)) {
                throw new ConflictException("Tên đăng nhập đã được sử dụng");
            }
            entity.setUsername(newUsername);
        }
        if (request.getEmail() != null) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(entity.getEmail()) && repository.existsByEmail(newEmail)) {
                throw new ConflictException("Email đã được đăng ký");
            }
            entity.setEmail(newEmail);
        }
        if (request.getPassword() != null)
            entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        if (request.getFullName() != null)
            entity.setFullName(request.getFullName().trim());
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
