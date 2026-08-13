package com.lela.users;

import com.lela.common.exception.NotFoundExeception;
import com.lela.language.LanguageRepository;
import com.lela.language.domain.Language;
import com.lela.users.domain.Users;
import com.lela.users.dto.UsersCreateRequest;
import com.lela.users.dto.UsersPatchRequest;
import com.lela.users.dto.UsersResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UsersServiceImplTest {

    @Mock
    private UsersRepository repository;

    @Mock
    private LanguageRepository languageRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsersServiceImpl usersService;

    private Users userEntity;
    private UsersResponse userResponse;

    @BeforeEach
    void setUp() {
        userEntity = new Users();
        userEntity.setId(1L);
        userEntity.setUsername("testuser");
        userEntity.setEmail("test@example.com");

        userResponse = new UsersResponse();
        userResponse.setId(1L);
        userResponse.setUsername("testuser");
        userResponse.setEmail("test@example.com");
    }

    @Test
    void findAll_Success() {
        // Arrange
        Page<Users> page = new PageImpl<>(Arrays.asList(userEntity));
        when(repository.searchUsers(any(), any(), any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(userEntity, UsersResponse.class)).thenReturn(userResponse);

        // Act
        Page<UsersResponse> result = usersService.findAll(null, null, PageRequest.of(0, 10));

        // Assert
        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getContent().get(0).getId());
        verify(repository).searchUsers(any(), any(), any(Pageable.class));
    }

    @Test
    void findById_Success() {
        // Arrange
        when(repository.findById(1L)).thenReturn(Optional.of(userEntity));
        when(modelMapper.map(userEntity, UsersResponse.class)).thenReturn(userResponse);

        // Act
        Optional<UsersResponse> result = usersService.findById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        verify(repository).findById(1L);
    }

    @Test
    void findById_NotFound() {
        // Arrange
        when(repository.findById(99L)).thenReturn(Optional.empty());

        // Act
        Optional<UsersResponse> result = usersService.findById(99L);

        // Assert
        assertFalse(result.isPresent());
        verify(repository).findById(99L);
    }

    @Test
    void create_Success() {
        // Arrange
        UsersCreateRequest request = new UsersCreateRequest();
        request.setUsername("testuser");
        request.setPassword("password");
        request.setNativeLanguageId(10L);

        Language nativeLang = new Language();
        nativeLang.setId(10L);

        when(modelMapper.map(request, Users.class)).thenReturn(userEntity);
        when(passwordEncoder.encode("password")).thenReturn("encoded_password");
        when(languageRepository.findById(10L)).thenReturn(Optional.of(nativeLang));
        when(repository.save(any(Users.class))).thenReturn(userEntity);
        when(modelMapper.map(userEntity, UsersResponse.class)).thenReturn(userResponse);

        // Act
        UsersResponse result = usersService.create(request);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(passwordEncoder).encode("password");
        verify(languageRepository).findById(10L);
        verify(repository).save(userEntity);
    }

    @Test
    void create_NativeLanguageNotFound_ThrowsException() {
        // Arrange
        UsersCreateRequest request = new UsersCreateRequest();
        request.setUsername("testuser");
        request.setPassword("password");
        request.setNativeLanguageId(99L);

        when(modelMapper.map(request, Users.class)).thenReturn(userEntity);
        when(passwordEncoder.encode("password")).thenReturn("encoded_password");
        when(languageRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        NotFoundExeception exception = assertThrows(NotFoundExeception.class, () -> {
            usersService.create(request);
        });

        assertTrue(exception.getMessage().contains("Not found Language with id 99"));
        verify(repository, Mockito.never()).save(any());
    }

    @Test
    void patch_Success() {
        // Arrange
        UsersPatchRequest request = new UsersPatchRequest();
        request.setUsername("updated_user");
        request.setPassword("new_password");

        when(repository.findById(1L)).thenReturn(Optional.of(userEntity));
        when(passwordEncoder.encode("new_password")).thenReturn("encoded_new_password");
        when(repository.save(userEntity)).thenReturn(userEntity);
        
        UsersResponse updatedResponse = new UsersResponse();
        updatedResponse.setId(1L);
        updatedResponse.setUsername("updated_user");
        when(modelMapper.map(userEntity, UsersResponse.class)).thenReturn(updatedResponse);

        // Act
        UsersResponse result = usersService.patch(1L, request);

        // Assert
        assertNotNull(result);
        assertEquals("updated_user", result.getUsername());
        assertEquals("encoded_new_password", userEntity.getPasswordHash());
        verify(repository).save(userEntity);
    }

    @Test
    void patch_UserNotFound_ThrowsException() {
        // Arrange
        UsersPatchRequest request = new UsersPatchRequest();
        when(repository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        NotFoundExeception exception = assertThrows(NotFoundExeception.class, () -> {
            usersService.patch(99L, request);
        });

        assertTrue(exception.getMessage().contains("Not found Users with id 99"));
        verify(repository, Mockito.never()).save(any());
    }

    @Test
    void deleteById_Success() {
        // Act
        usersService.deleteById(1L);

        // Assert
        verify(repository).deleteById(1L);
    }
}
