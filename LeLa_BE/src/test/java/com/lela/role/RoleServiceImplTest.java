package com.lela.role;

import com.lela.role.domain.Role;
import com.lela.role.dto.RoleCreateRequest;
import com.lela.role.dto.RolePatchRequest;
import com.lela.role.dto.RoleResponse;
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
public class RoleServiceImplTest {

    @Mock
    private RoleRepository repository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private RoleServiceImpl service;

    private Role entity;
    private RoleResponse response;

    @BeforeEach
    void setUp() {
        entity = new Role();
        entity.setId(1L);
        entity.setRoleCode("ROLE_USER");
        entity.setName("User");

        response = new RoleResponse();
        response.setId(1L);
        response.setRoleCode("ROLE_USER");
        response.setName("User");
    }

    @Test
    void findAll_Success() {
        when(repository.findAll()).thenReturn(Arrays.asList(entity));
        when(modelMapper.map(entity, RoleResponse.class)).thenReturn(response);

        List<RoleResponse> result = service.findAll();

        assertEquals(1, result.size());
    }

    @Test
    void findById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(modelMapper.map(entity, RoleResponse.class)).thenReturn(response);

        Optional<RoleResponse> result = service.findById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void create_Success() {
        RoleCreateRequest request = new RoleCreateRequest();
        request.setRoleCode("ROLE_ADMIN");

        when(modelMapper.map(request, Role.class)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(modelMapper.map(entity, RoleResponse.class)).thenReturn(response);

        RoleResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void patch_Success() {
        RolePatchRequest request = new RolePatchRequest();
        request.setName("Updated Name");

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        when(modelMapper.map(entity, RoleResponse.class)).thenReturn(response);

        RoleResponse result = service.patch(1L, request);

        assertNotNull(result);
        assertEquals("Updated Name", entity.getName());
        verify(repository).save(entity);
    }

    @Test
    void deleteById_Success() {
        service.deleteById(1L);
        verify(repository).deleteById(1L);
    }
}
