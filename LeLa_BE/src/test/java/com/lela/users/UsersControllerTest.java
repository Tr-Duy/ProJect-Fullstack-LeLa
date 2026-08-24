package com.lela.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.users.domain.UserStatus;
import com.lela.users.dto.UsersCreateRequest;
import com.lela.users.dto.UsersPatchRequest;
import com.lela.users.dto.UsersResponse;
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
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UsersController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UsersControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UsersService usersService;

    @MockitoBean
    private JwtService jwtService;

    private UsersResponse usersResponse;

    @BeforeEach
    void setUp() {
        usersResponse = new UsersResponse();
        usersResponse.setId(1L);
        usersResponse.setUsername("testuser");
        usersResponse.setEmail("test@example.com");
        usersResponse.setFullName("Test User");
        usersResponse.setStatus(UserStatus.ACTIVE);
    }

    @Test
    void findAll_Success() throws Exception {
        Page<UsersResponse> page = new PageImpl<>(Arrays.asList(usersResponse));
        Mockito.when(usersService.findAll(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/users")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lấy danh sách thành công"))
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.data.content[0].username").value("testuser"));
    }

    @Test
    void findById_Success() throws Exception {
        Mockito.when(usersService.findById(1L)).thenReturn(Optional.of(usersResponse));

        mockMvc.perform(get("/users/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tìm thấy người dùng"))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void findById_NotFound() throws Exception {
        Mockito.when(usersService.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/users/99")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_Success() throws Exception {
        UsersCreateRequest request = new UsersCreateRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("Abc@1234");
        request.setFullName("New User");
        request.setAvatarUrl("http://example.com/avatar.png");
        request.setNativeLanguageId(1L);
        request.setTargetLanguageId(2L);
        request.setStatus(UserStatus.ACTIVE);
        request.setTimezone("UTC");
        request.setDailyGoalCards(10);

        UsersResponse createdResponse = new UsersResponse();
        createdResponse.setId(2L);
        createdResponse.setUsername("newuser");
        createdResponse.setFullName("New User");

        Mockito.when(usersService.create(any(UsersCreateRequest.class))).thenReturn(createdResponse);

        mockMvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Tạo người dùng thành công"))
                .andExpect(jsonPath("$.data.id").value(2L))
                .andExpect(jsonPath("$.data.username").value("newuser"));
    }

    @Test
    void patch_Success() throws Exception {
        UsersPatchRequest request = new UsersPatchRequest();
        request.setFullName("Updated Name");

        UsersResponse patchedResponse = new UsersResponse();
        patchedResponse.setId(1L);
        patchedResponse.setUsername("testuser");
        patchedResponse.setFullName("Updated Name");

        Mockito.when(usersService.patch(eq(1L), any(UsersPatchRequest.class))).thenReturn(patchedResponse);

        mockMvc.perform(patch("/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật thành công"))
                .andExpect(jsonPath("$.data.fullName").value("Updated Name"));
    }

    @Test
    void deleteById_Success() throws Exception {
        Mockito.doNothing().when(usersService).deleteById(1L);

        mockMvc.perform(delete("/users/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa thành công"));
    }
}
