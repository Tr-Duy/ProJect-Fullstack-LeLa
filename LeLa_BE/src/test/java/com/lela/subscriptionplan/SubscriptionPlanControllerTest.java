package com.lela.subscriptionplan;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.subscriptionplan.dto.SubscriptionPlanCreateRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanPatchRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
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

@WebMvcTest(SubscriptionPlanController.class)
@AutoConfigureMockMvc(addFilters = false)
public class SubscriptionPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SubscriptionPlanService subscriptionPlanService;

    @MockitoBean
    private JwtService jwtService;

    private SubscriptionPlanResponse planResponse;

    @BeforeEach
    void setUp() {
        planResponse = new SubscriptionPlanResponse();
        planResponse.setId(1L);
        planResponse.setPlanCode("PRO");
        planResponse.setName("Pro Plan");
        planResponse.setPrice(new BigDecimal("9.99"));
    }

    @Test
    void findAll_Success() throws Exception {
        List<SubscriptionPlanResponse> list = Arrays.asList(planResponse);

        Mockito.when(subscriptionPlanService.findAll()).thenReturn(list);

        mockMvc.perform(get("/subscription-plans")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(1L))
                .andExpect(jsonPath("$.message").value("Lấy danh sách thành công"));
    }

    @Test
    void findById_Success() throws Exception {
        Mockito.when(subscriptionPlanService.findById(1L)).thenReturn(Optional.of(planResponse));

        mockMvc.perform(get("/subscription-plans/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.message").value("Tìm thấy gói đăng ký"));
    }

    @Test
    void findById_NotFound() throws Exception {
        Mockito.when(subscriptionPlanService.findById(2L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/subscription-plans/2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_Success() throws Exception {
        SubscriptionPlanCreateRequest request = new SubscriptionPlanCreateRequest();
        request.setPlanCode("PRO");
        request.setName("Pro Plan");
        request.setDescription("Pro Plan Description");
        request.setPrice(new BigDecimal("9.99"));
        request.setCurrencyCode("USD");
        request.setBillingCycle("MONTHLY");
        request.setBillingIntervalCount(1);
        request.setMaxOwnedDecks(50);
        request.setMaxCardsPerDeck(1000);
        request.setMaxDailyReviews(500);
        request.setQuizEnabled(true);
        request.setLeaderboardEnabled(true);
        request.setOfflineEnabled(true);
        request.setFeaturesJson("{}");
        request.setIsActive(true);
        request.setDisplayOrder(1);

        Mockito.when(subscriptionPlanService.create(any(SubscriptionPlanCreateRequest.class))).thenReturn(planResponse);

        mockMvc.perform(post("/subscription-plans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.message").value("Tạo gói đăng ký thành công"));
    }

    @Test
    void patch_Success() throws Exception {
        SubscriptionPlanPatchRequest request = new SubscriptionPlanPatchRequest();
        request.setName("Pro Plan Updated");

        SubscriptionPlanResponse updatedResponse = new SubscriptionPlanResponse();
        updatedResponse.setId(1L);
        updatedResponse.setName("Pro Plan Updated");

        Mockito.when(subscriptionPlanService.patch(eq(1L), any(SubscriptionPlanPatchRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/subscription-plans/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Pro Plan Updated"))
                .andExpect(jsonPath("$.message").value("Cập nhật thành công"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(subscriptionPlanService).deleteById(1L);

        mockMvc.perform(delete("/subscription-plans/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa thành công"));
    }
}
