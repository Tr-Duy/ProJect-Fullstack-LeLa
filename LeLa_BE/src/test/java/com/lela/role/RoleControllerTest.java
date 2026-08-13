package com.lela.role;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.role.dto.RoleCreateRequest;
import com.lela.role.dto.RolePatchRequest;
import com.lela.role.dto.RoleResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RoleController.class)
@AutoConfigureMockMvc(addFilters = false)
public class RoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RoleService roleService;

    @MockitoBean
    private JwtService jwtService;

    private RoleResponse roleResponse;

    @BeforeEach
    void setUp() {
        roleResponse = new RoleResponse();
        roleResponse.setId(1L);
        roleResponse.setRoleCode("ADMIN");
        roleResponse.setDescription("Administrator role");
    }

    @Test
    void findAll_Success() throws Exception {
        List<RoleResponse> list = Arrays.asList(roleResponse);
        Mockito.when(roleService.findAll()).thenReturn(list);

        mockMvc.perform(get("/roles")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lấy danh sách thành công"))
                .andExpect(jsonPath("$.data[0].id").value(1L))
                .andExpect(jsonPath("$.data[0].roleCode").value("ADMIN"));
    }

    @Test
    void findById_Success() throws Exception {
        Mockito.when(roleService.findById(1L)).thenReturn(Optional.of(roleResponse));

        mockMvc.perform(get("/roles/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tìm thấy vai trò"))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void findById_NotFound() throws Exception {
        Mockito.when(roleService.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/roles/99")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_Success() throws Exception {
        RoleCreateRequest request = new RoleCreateRequest();
        request.setRoleCode("USER");
        request.setName("User");
        request.setDescription("User role");
        request.setIsActive(true);

        RoleResponse createdResponse = new RoleResponse();
        createdResponse.setId(2L);
        createdResponse.setRoleCode("USER");
        createdResponse.setName("User");
        createdResponse.setDescription("User role");
        createdResponse.setIsActive(true);

        Mockito.when(roleService.create(any(RoleCreateRequest.class))).thenReturn(createdResponse);

        mockMvc.perform(post("/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Tạo vai trò thành công"))
                .andExpect(jsonPath("$.data.id").value(2L))
                .andExpect(jsonPath("$.data.roleCode").value("USER"));
    }

    @Test
    void patch_Success() throws Exception {
        RolePatchRequest request = new RolePatchRequest();
        request.setDescription("Updated description");

        RoleResponse patchedResponse = new RoleResponse();
        patchedResponse.setId(1L);
        patchedResponse.setRoleCode("ADMIN");
        patchedResponse.setDescription("Updated description");

        Mockito.when(roleService.patch(eq(1L), any(RolePatchRequest.class))).thenReturn(patchedResponse);

        mockMvc.perform(patch("/roles/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật thành công"))
                .andExpect(jsonPath("$.data.description").value("Updated description"));
    }

    @Test
    void deleteById_Success() throws Exception {
        Mockito.doNothing().when(roleService).deleteById(1L);

        mockMvc.perform(delete("/roles/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa thành công"));
    }
}
