package com.lela.userroleassignment;

import com.lela.role.RoleRepository;
import com.lela.role.domain.Role;
import com.lela.userroleassignment.domain.UserRoleAssignment;
import com.lela.userroleassignment.dto.UserRoleAssignmentCreateRequest;
import com.lela.userroleassignment.dto.UserRoleAssignmentId;
import com.lela.userroleassignment.dto.UserRoleAssignmentResponse;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserRoleAssignmentServiceImplTest {

    @Mock
    private UserRoleAssignmentRepository repository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private UserRoleAssignmentServiceImpl service;

    private UserRoleAssignment entity;
    private UserRoleAssignmentResponse response;

    @BeforeEach
    void setUp() {
        Users user = new Users();
        user.setId(1L);

        Role role = new Role();
        role.setId(2L);

        entity = new UserRoleAssignment();
        entity.setId(new UserRoleAssignmentId(1L, 2L));
        entity.setUser(user);
        entity.setRole(role);

        response = new UserRoleAssignmentResponse();
    }

    @Test
    void findByUserId_Success() {
        when(repository.findAll()).thenReturn(Arrays.asList(entity));
        when(modelMapper.map(entity, UserRoleAssignmentResponse.class)).thenReturn(response);

        List<UserRoleAssignmentResponse> result = service.findByUserId(1L);

        assertEquals(1, result.size());
    }

    @Test
    void assignRole_Success() {
        UserRoleAssignmentCreateRequest request = new UserRoleAssignmentCreateRequest();
        request.setUserId(1L);
        request.setRoleId(2L);

        Users user = new Users();
        user.setId(1L);

        Role role = new Role();
        role.setId(2L);

        when(usersRepository.findById(1L)).thenReturn(Optional.of(user));
        when(roleRepository.findById(2L)).thenReturn(Optional.of(role));
        when(usersRepository.findById(3L)).thenReturn(Optional.of(new Users()));
        when(repository.save(any(UserRoleAssignment.class))).thenReturn(entity);
        when(modelMapper.map(entity, UserRoleAssignmentResponse.class)).thenReturn(response);

        UserRoleAssignmentResponse result = service.assignRole(request, 3L);

        assertNotNull(result);
        verify(repository).save(any(UserRoleAssignment.class));
    }

    @Test
    void unassignRole_Success() {
        service.unassignRole(1L, 2L);
        verify(repository).deleteById(any(UserRoleAssignmentId.class));
    }
}
