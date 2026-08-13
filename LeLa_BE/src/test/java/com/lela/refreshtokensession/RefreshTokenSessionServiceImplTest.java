package com.lela.refreshtokensession;

import com.lela.refreshtokensession.domain.RefreshTokenSession;
import com.lela.refreshtokensession.dto.RefreshTokenSessionCreateRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionPatchRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionResponse;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RefreshTokenSessionServiceImplTest {

    @Mock
    private RefreshTokenSessionRepository repository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private RefreshTokenSessionServiceImpl service;

    private RefreshTokenSession entity;
    private RefreshTokenSessionResponse response;

    @BeforeEach
    void setUp() {
        entity = new RefreshTokenSession();
        entity.setId(1L);
        entity.setTokenHash("hash123");

        response = new RefreshTokenSessionResponse();
        response.setId(1L);
        response.setTokenHash("hash123");
    }

    @Test
    void findAll_Success() {
        when(repository.findAll()).thenReturn(Arrays.asList(entity));
        when(modelMapper.map(entity, RefreshTokenSessionResponse.class)).thenReturn(response);

        List<RefreshTokenSessionResponse> result = service.findAll();

        assertEquals(1, result.size());
    }

    @Test
    void findById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(modelMapper.map(entity, RefreshTokenSessionResponse.class)).thenReturn(response);

        Optional<RefreshTokenSessionResponse> result = service.findById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void create_Success() {
        RefreshTokenSessionCreateRequest request = new RefreshTokenSessionCreateRequest();
        request.setUserId(1L);

        Users user = new Users();
        user.setId(1L);

        when(modelMapper.map(request, RefreshTokenSession.class)).thenReturn(entity);
        when(usersRepository.findById(1L)).thenReturn(Optional.of(user));
        when(repository.save(entity)).thenReturn(entity);
        when(modelMapper.map(entity, RefreshTokenSessionResponse.class)).thenReturn(response);

        RefreshTokenSessionResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void patch_Success() {
        RefreshTokenSessionPatchRequest request = new RefreshTokenSessionPatchRequest();
        request.setTokenHash("hash456");

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        when(modelMapper.map(entity, RefreshTokenSessionResponse.class)).thenReturn(response);

        RefreshTokenSessionResponse result = service.patch(1L, request);

        assertNotNull(result);
        assertEquals("hash456", entity.getTokenHash());
        verify(repository).save(entity);
    }

    @Test
    void deleteById_Success() {
        service.deleteById(1L);
        verify(repository).deleteById(1L);
    }
}
