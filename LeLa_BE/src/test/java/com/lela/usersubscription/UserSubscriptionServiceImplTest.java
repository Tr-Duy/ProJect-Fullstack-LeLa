package com.lela.usersubscription;

import com.lela.subscriptionplan.domain.SubscriptionPlan;
import com.lela.users.domain.Users;
import com.lela.usersubscription.domain.UserSubscription;
import com.lela.usersubscription.dto.UserSubscriptionRequest;
import com.lela.usersubscription.dto.UserSubscriptionResponse;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Disabled;
@Disabled
@ExtendWith(MockitoExtension.class)
public class UserSubscriptionServiceImplTest {

    @Mock
    private UserSubscriptionRepository repository;

    @Mock
    private com.lela.users.UsersRepository usersRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private UserSubscriptionServiceImpl service;

    private UserSubscription entity;
    private UserSubscriptionResponse response;

    @BeforeEach
    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.lenient().when(authentication.getName()).thenReturn("testuser");
        SecurityContextHolder.setContext(securityContext);

        Users user = new Users();
        user.setId(1L);
        Mockito.lenient().when(usersRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setId(2L);

        entity = new UserSubscription();
        entity.setId(1L);
        entity.setUser(user);
        entity.setPlan(plan);
        entity.setAutoRenew(true);

        response = new UserSubscriptionResponse();
        response.setId(1L);
    }

    @Test
    void getAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserSubscription> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAll(pageable)).thenReturn(page);
        when(modelMapper.map(entity, UserSubscriptionResponse.class)).thenReturn(response);

        Page<UserSubscriptionResponse> result = service.getAll(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(modelMapper.map(entity, UserSubscriptionResponse.class)).thenReturn(response);

        UserSubscriptionResponse result = service.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void create_Success() {
        UserSubscriptionRequest request = new UserSubscriptionRequest();
        request.setPlanId(2L);

        when(entityManager.getReference(Users.class, 1L)).thenReturn(new Users());
        when(entityManager.getReference(SubscriptionPlan.class, 2L)).thenReturn(new SubscriptionPlan());
        when(repository.save(any(UserSubscription.class))).thenReturn(entity);
        when(modelMapper.map(entity, UserSubscriptionResponse.class)).thenReturn(response);

        UserSubscriptionResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(any(UserSubscription.class));
    }

    @Test
    void update_Success() {
        UserSubscriptionRequest request = new UserSubscriptionRequest();
        request.setPlanId(2L);
        request.setAutoRenew(false);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(entityManager.getReference(SubscriptionPlan.class, 2L)).thenReturn(new SubscriptionPlan());
        when(repository.save(entity)).thenReturn(entity);
        when(modelMapper.map(entity, UserSubscriptionResponse.class)).thenReturn(response);

        UserSubscriptionResponse result = service.update(1L, request);

        assertNotNull(result);
        assertFalse(entity.getAutoRenew());
        verify(repository).save(entity);
    }

    @Test
    void delete_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        service.delete(1L);
        verify(repository).delete(entity);
    }
}
