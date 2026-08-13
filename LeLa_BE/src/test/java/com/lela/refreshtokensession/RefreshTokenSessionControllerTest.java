package com.lela.refreshtokensession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.refreshtokensession.dto.RefreshTokenSessionCreateRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionPatchRequest;
import com.lela.refreshtokensession.dto.RefreshTokenSessionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
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

@WebMvcTest(RefreshTokenSessionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class RefreshTokenSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RefreshTokenSessionService sessionService;

    @MockitoBean
    private JwtService jwtService;

    private RefreshTokenSessionResponse sessionResponse;

    @BeforeEach
    void setUp() {
        sessionResponse = new RefreshTokenSessionResponse();
        sessionResponse.setId(1L);
        sessionResponse.setTokenHash("hash123");
        sessionResponse.setTokenFamilyId("family123");
    }

    @Test
    void findAll_Success() throws Exception {
        List<RefreshTokenSessionResponse> list = Arrays.asList(sessionResponse);
        Mockito.when(sessionService.findAll()).thenReturn(list);

        // Note: This controller returns List directly, not ApiResponse.
        mockMvc.perform(get("/refresh-token-sessions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void findById_Success() throws Exception {
        Mockito.when(sessionService.findById(1L)).thenReturn(Optional.of(sessionResponse));

        // Returns object directly or 404
        mockMvc.perform(get("/refresh-token-sessions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void findById_NotFound() throws Exception {
        Mockito.when(sessionService.findById(2L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/refresh-token-sessions/2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_Success() throws Exception {
        RefreshTokenSessionCreateRequest request = new RefreshTokenSessionCreateRequest();
        request.setUserId(1L);
        request.setTokenHash("hash123");
        request.setTokenFamilyId("family123");
        request.setDeviceName("device");
        request.setIpAddress("127.0.0.1");
        request.setUserAgent("Mozilla");
        request.setExpiresAt(LocalDateTime.now().plusDays(7));
        request.setLastUsedAt(LocalDateTime.now());

        Mockito.when(sessionService.create(any(RefreshTokenSessionCreateRequest.class))).thenReturn(sessionResponse);

        mockMvc.perform(post("/refresh-token-sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void patch_Success() throws Exception {
        RefreshTokenSessionPatchRequest request = new RefreshTokenSessionPatchRequest();
        request.setRevokeReason("expired");

        RefreshTokenSessionResponse updatedResponse = new RefreshTokenSessionResponse();
        updatedResponse.setId(1L);
        updatedResponse.setRevokeReason("expired");

        Mockito.when(sessionService.patch(eq(1L), any(RefreshTokenSessionPatchRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/refresh-token-sessions/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revokeReason").value("expired"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(sessionService).deleteById(1L);

        mockMvc.perform(delete("/refresh-token-sessions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}
