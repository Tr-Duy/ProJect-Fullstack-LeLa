package com.lela.userroleassignment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.userroleassignment.dto.UserRoleAssignmentCreateRequest;
import com.lela.userroleassignment.dto.UserRoleAssignmentResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.lela.role.dto.RoleResponse;
import com.lela.users.dto.UsersResponse;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserRoleAssignmentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserRoleAssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserRoleAssignmentService userRoleAssignmentService;

    @MockitoBean
    private JwtService jwtService;

    private UserRoleAssignmentResponse userRoleAssignmentResponse;

    @BeforeEach
    void setUp() {
        UsersResponse user = new UsersResponse();
        user.setId(1L);
        RoleResponse role = new RoleResponse();
        role.setId(1L);

        userRoleAssignmentResponse = new UserRoleAssignmentResponse();
        userRoleAssignmentResponse.setUser(user);
        userRoleAssignmentResponse.setRole(role);
        userRoleAssignmentResponse.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void findByUserId_Success() throws Exception {
        List<UserRoleAssignmentResponse> list = Arrays.asList(userRoleAssignmentResponse);
        Mockito.when(userRoleAssignmentService.findByUserId(1L)).thenReturn(list);

        mockMvc.perform(get("/user-roles/user/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lấy danh sách thành công"))
                .andExpect(jsonPath("$.data[0].user.id").value(1L))
                .andExpect(jsonPath("$.data[0].role.id").value(1L));
    }

    @Test
    void assignRole_Success() throws Exception {
        UserRoleAssignmentCreateRequest request = new UserRoleAssignmentCreateRequest();
        request.setUserId(1L);
        request.setRoleId(2L);

        UsersResponse user = new UsersResponse();
        user.setId(1L);
        RoleResponse role = new RoleResponse();
        role.setId(2L);

        UserRoleAssignmentResponse createdResponse = new UserRoleAssignmentResponse();
        createdResponse.setUser(user);
        createdResponse.setRole(role);

        Mockito.when(userRoleAssignmentService.assignRole(any(UserRoleAssignmentCreateRequest.class), isNull())).thenReturn(createdResponse);

        mockMvc.perform(post("/user-roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Gán vai trò thành công"))
                .andExpect(jsonPath("$.data.user.id").value(1L))
                .andExpect(jsonPath("$.data.role.id").value(2L));
    }

    @Test
    void unassignRole_Success() throws Exception {
        Mockito.doNothing().when(userRoleAssignmentService).unassignRole(1L, 2L);

        mockMvc.perform(delete("/user-roles/user/1/role/2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Hủy gán vai trò thành công"));
    }
}
