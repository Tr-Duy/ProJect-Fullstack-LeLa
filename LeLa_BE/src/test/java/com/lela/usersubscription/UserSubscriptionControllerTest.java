package com.lela.usersubscription;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.usersubscription.domain.UserSubscriptionStatus;
import com.lela.usersubscription.dto.UserSubscriptionRequest;
import com.lela.usersubscription.dto.UserSubscriptionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserSubscriptionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserSubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserSubscriptionService userSubscriptionService;

    @MockitoBean
    private JwtService jwtService;

    private UserSubscriptionResponse userSubscriptionResponse;

    @BeforeEach
    void setUp() {
        userSubscriptionResponse = new UserSubscriptionResponse();
        userSubscriptionResponse.setId(1L);
        userSubscriptionResponse.setUserId(1L);
        userSubscriptionResponse.setPlanId(1L);
        userSubscriptionResponse.setStatus(UserSubscriptionStatus.ACTIVE);
    }

    @Test
    void getAll_Success() throws Exception {
        List<UserSubscriptionResponse> list = Arrays.asList(userSubscriptionResponse);
        Page<UserSubscriptionResponse> page = new PageImpl<>(list);
        
        Mockito.when(userSubscriptionService.getAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/user-subscriptions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.data.content[0].userId").value(1L));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(userSubscriptionService.getById(1L)).thenReturn(userSubscriptionResponse);

        mockMvc.perform(get("/user-subscriptions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void create_Success() throws Exception {
        UserSubscriptionRequest request = new UserSubscriptionRequest();
        request.setUserId(1L);
        request.setPlanId(2L);
        request.setStatus(UserSubscriptionStatus.ACTIVE);

        UserSubscriptionResponse createdResponse = new UserSubscriptionResponse();
        createdResponse.setId(2L);
        createdResponse.setUserId(1L);
        createdResponse.setPlanId(2L);
        createdResponse.setStatus(UserSubscriptionStatus.ACTIVE);

        Mockito.when(userSubscriptionService.create(any(UserSubscriptionRequest.class))).thenReturn(createdResponse);

        mockMvc.perform(post("/user-subscriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk()) // Controller doesn't use ResponseEntity to set 201
                .andExpect(jsonPath("$.message").value("Created"))
                .andExpect(jsonPath("$.data.id").value(2L))
                .andExpect(jsonPath("$.data.planId").value(2L));
    }

    @Test
    void update_Success() throws Exception {
        UserSubscriptionRequest request = new UserSubscriptionRequest();
        request.setStatus(UserSubscriptionStatus.CANCELLED);

        UserSubscriptionResponse updatedResponse = new UserSubscriptionResponse();
        updatedResponse.setId(1L);
        updatedResponse.setUserId(1L);
        updatedResponse.setPlanId(1L);
        updatedResponse.setStatus(UserSubscriptionStatus.CANCELLED);

        Mockito.when(userSubscriptionService.update(eq(1L), any(UserSubscriptionRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/user-subscriptions/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Updated"))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(userSubscriptionService).delete(1L);

        mockMvc.perform(delete("/user-subscriptions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted"));
    }
}
