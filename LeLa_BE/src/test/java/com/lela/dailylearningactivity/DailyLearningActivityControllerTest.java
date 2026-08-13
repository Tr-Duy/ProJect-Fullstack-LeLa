package com.lela.dailylearningactivity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;
import com.lela.auth.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DailyLearningActivityController.class)
@AutoConfigureMockMvc(addFilters = false)
public class DailyLearningActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DailyLearningActivityService dailyLearningActivityService;

    @MockitoBean
    private JwtService jwtService;

    private DailyLearningActivityResponse activityResponse;

    @BeforeEach
    void setUp() {
        activityResponse = new DailyLearningActivityResponse();
        activityResponse.setId(1L);
        activityResponse.setUserId(1L);
        activityResponse.setActivityDate(LocalDate.now());
        activityResponse.setXpEarned(100);
    }

    @Test
    void logActivity_Success() throws Exception {
        DailyLearningActivityRequest request = new DailyLearningActivityRequest();
        request.setUserId(1L);
        request.setActivityDate(LocalDate.now());
        request.setXpEarned(100);

        Mockito.when(dailyLearningActivityService.logActivity(any(DailyLearningActivityRequest.class))).thenReturn(activityResponse);

        mockMvc.perform(post("/daily-activities/log")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.message").value("Ghi nhận tiến độ học tập thành công."));
    }

    @Test
    void getTodayActivity_Success() throws Exception {
        Mockito.when(dailyLearningActivityService.getTodayActivity()).thenReturn(activityResponse);

        mockMvc.perform(get("/daily-activities/today")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải tiến độ học tập hôm nay thành công."));
    }
}
