package com.lela.dailylearningactivity;

import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Disabled;
@Disabled
@ExtendWith(MockitoExtension.class)
public class DailyLearningActivityServiceImplTest {

    @Mock
    private DailyLearningActivityRepository repository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private com.lela.users.UsersRepository usersRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private com.lela.notification.SseService sseService;

    @Mock
    private com.lela.achievement.AchievementService achievementService;

    @InjectMocks
    private DailyLearningActivityServiceImpl service;

    private DailyLearningActivity entity;
    private DailyLearningActivityResponse response;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

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

        entity = new DailyLearningActivity();
        entity.setId(1L);
        entity.setUser(user);
        entity.setActivityDate(LocalDate.now());
        entity.setReviewCount(0);
        entity.setCardsLearned(0);
        entity.setQuizCount(0);
        entity.setMinutesSpent(0);
        entity.setXpEarned(0);

        response = new DailyLearningActivityResponse();
        response.setId(1L);
    }

    @Test
    void logActivity_NewActivity_Success() {
        DailyLearningActivityRequest request = new DailyLearningActivityRequest();
        request.setXpEarned(100);

        Users user = new Users();
        user.setId(1L);

        when(repository.findByUserIdAndActivityDate(eq(1L), any(LocalDate.class))).thenReturn(Optional.empty());
        when(entityManager.getReference(Users.class, 1L)).thenReturn(user);
        when(repository.save(any(DailyLearningActivity.class))).thenReturn(entity);
        when(modelMapper.map(any(), eq(DailyLearningActivityResponse.class))).thenReturn(response);

        DailyLearningActivityResponse result = service.logActivity(request);

        assertNotNull(result);
        verify(repository).save(any(DailyLearningActivity.class));
    }

    @Test
    void logActivity_ExistingActivity_Success() {
        DailyLearningActivityRequest request = new DailyLearningActivityRequest();
        request.setXpEarned(100);

        when(repository.findByUserIdAndActivityDate(eq(1L), any(LocalDate.class))).thenReturn(Optional.of(entity));
        when(repository.save(any(DailyLearningActivity.class))).thenReturn(entity);
        when(modelMapper.map(any(), eq(DailyLearningActivityResponse.class))).thenReturn(response);

        DailyLearningActivityResponse result = service.logActivity(request);

        assertNotNull(result);
        verify(repository).save(entity);
        assertEquals(100, entity.getXpEarned());
    }

    @Test
    void getTodayActivity_Success() {
        when(repository.findByUserIdAndActivityDate(eq(1L), any(LocalDate.class))).thenReturn(Optional.of(entity));
        when(modelMapper.map(any(), eq(DailyLearningActivityResponse.class))).thenReturn(response);

        DailyLearningActivityResponse result = service.getTodayActivity();

        assertNotNull(result);
    }
}
