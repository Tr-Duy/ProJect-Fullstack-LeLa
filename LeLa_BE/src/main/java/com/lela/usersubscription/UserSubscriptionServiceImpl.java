package com.lela.usersubscription;

import com.lela.common.exception.NotFoundExeception;
import com.lela.subscriptionplan.domain.SubscriptionPlan;
import com.lela.users.domain.Users;
import com.lela.usersubscription.domain.UserSubscription;
import com.lela.usersubscription.dto.UserSubscriptionRequest;
import com.lela.usersubscription.dto.UserSubscriptionResponse;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSubscriptionServiceImpl implements UserSubscriptionService {

    private final UserSubscriptionRepository repository;
    private final com.lela.users.UsersRepository usersRepository;
    private final EntityManager entityManager;
    private final ModelMapper modelMapper;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserSubscriptionResponse> getAll(Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Users user = usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"));

        boolean isAdmin = user.getRoleAssignments().stream()
                .anyMatch(role -> "ADMIN".equals(role.getRole().getRoleCode()));

        if (isAdmin) {
            return repository.findAll(pageable).map(this::mapToResponse);
        } else {
            return repository.findByUserId(user.getId(), pageable).map(this::mapToResponse);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserSubscriptionResponse getById(Long id) {
        UserSubscription entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy đăng ký gói với ID: " + id));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Users currentUser = usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"));

        boolean isAdmin = currentUser.getRoleAssignments().stream()
                .anyMatch(role -> "ADMIN".equals(role.getRole().getRoleCode()));

        if (!isAdmin && !entity.getUser().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền truy cập thông tin này.");
        }
        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public UserSubscriptionResponse create(UserSubscriptionRequest request) {
        UserSubscription entity = new UserSubscription();
        entity.setUser(entityManager.getReference(Users.class, getCurrentUserId()));
        entity.setPlan(entityManager.getReference(SubscriptionPlan.class, request.getPlanId()));

        updateSubscriptionFields(entity, request);
        return mapToResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public UserSubscriptionResponse update(Long id, UserSubscriptionRequest request) {
        UserSubscription entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy đăng ký với ID: " + id));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Users currentUser = usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"));

        boolean isAdmin = currentUser.getRoleAssignments().stream()
                .anyMatch(role -> "ADMIN".equals(role.getRole().getRoleCode()));

        if (!isAdmin && !entity.getUser().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền chỉnh sửa gói đăng ký này.");
        }

        if (request.getPlanId() != null) {
            entity.setPlan(entityManager.getReference(SubscriptionPlan.class, request.getPlanId()));
        }

        updateSubscriptionFields(entity, request);
        return mapToResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        UserSubscription entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy đăng ký để xóa."));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Users currentUser = usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"));

        boolean isAdmin = currentUser.getRoleAssignments().stream()
                .anyMatch(role -> "ADMIN".equals(role.getRole().getRoleCode()));

        if (!isAdmin && !entity.getUser().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền xóa gói đăng ký này.");
        }
        repository.delete(entity);
    }

    private void updateSubscriptionFields(UserSubscription entity, UserSubscriptionRequest request) {
        entity.setStatus(request.getStatus());
        entity.setStartedAt(request.getStartedAt());
        entity.setExpiresAt(request.getExpiresAt());
        entity.setTrialEndsAt(request.getTrialEndsAt());
        entity.setCancelledAt(request.getCancelledAt());
        entity.setAutoRenew(request.getAutoRenew() != null ? request.getAutoRenew() : false);
        entity.setProvider(request.getProvider());
        entity.setProviderSubscriptionId(request.getProviderSubscriptionId());
    }

    private UserSubscriptionResponse mapToResponse(UserSubscription entity) {
        UserSubscriptionResponse response = modelMapper.map(entity, UserSubscriptionResponse.class);
        if (entity.getUser() != null) response.setUserId(entity.getUser().getId());
        if (entity.getPlan() != null) response.setPlanId(entity.getPlan().getId());
        return response;
    }
}