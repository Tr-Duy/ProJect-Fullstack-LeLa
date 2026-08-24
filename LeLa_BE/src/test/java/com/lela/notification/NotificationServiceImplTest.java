package com.lela.notification;

import com.lela.notification.domain.Notification;
import com.lela.notification.dto.NotificationResponse;
import com.lela.users.domain.Users;
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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.List;
import com.lela.notification.domain.NotificationType;
import com.lela.notification.domain.NotificationChannel;
import com.lela.notification.domain.NotificationStatus;
import com.lela.notification.dto.NotificationRequest;
import com.lela.users.UsersRepository;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceImplTest {

    @Mock
    private NotificationRepository repository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private SseService sseService;

    @InjectMocks
    private NotificationServiceImpl service;

    private Notification entity;
    private NotificationResponse response;

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

        entity = new Notification();
        entity.setId(1L);
        entity.setUser(user);
        entity.setIsRead(false);

        response = new NotificationResponse();
        response.setId(1L);
    }

    @Test
    void getAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAllByUserId(1L, pageable)).thenReturn(page);
        when(modelMapper.map(entity, NotificationResponse.class)).thenReturn(response);

        Page<NotificationResponse> result = service.getAll(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getUnread_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findUnreadByUserId(1L, pageable)).thenReturn(page);
        when(modelMapper.map(entity, NotificationResponse.class)).thenReturn(response);

        Page<NotificationResponse> result = service.getUnread(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void markAsRead_Success() {
        when(repository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(entity));

        service.markAsRead(1L);

        assertTrue(entity.getIsRead());
        assertNotNull(entity.getReadAt());
        verify(repository).save(entity);
    }

    @Test
    void markAllAsRead_Success() {
        service.markAllAsRead();
        verify(repository).markAllAllAsReadByUserId(eq(1L), any(LocalDateTime.class));
    }

    @Test
    void broadcast_Success() {
        Users user1 = new Users();
        user1.setId(1L);
        Users user2 = new Users();
        user2.setId(2L);
        when(usersRepository.findAll()).thenReturn(Arrays.asList(user1, user2));

        NotificationRequest request = new NotificationRequest();
        request.setTitle("System Update");
        request.setMessage("Backend is working perfectly.");
        request.setType(NotificationType.SYSTEM);

        when(modelMapper.map(any(Notification.class), eq(NotificationResponse.class)))
                .thenReturn(new NotificationResponse());

        service.broadcast(request);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());

        List<Notification> savedNotifications = captor.getValue();
        assertEquals(2, savedNotifications.size());
        assertEquals("System Update", savedNotifications.get(0).getTitle());
        assertEquals(NotificationType.SYSTEM, savedNotifications.get(0).getType());
        assertEquals(NotificationChannel.IN_APP, savedNotifications.get(0).getChannel());
        assertEquals(NotificationStatus.SENT, savedNotifications.get(0).getStatus());
    }
}
