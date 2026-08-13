package com.lela.reviewsession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.reviewsession.dto.ReviewSessionRequest;
import com.lela.reviewsession.dto.ReviewSessionResponse;
import com.lela.srsreview.dto.SyncReviewRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReviewSessionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ReviewSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReviewSessionService reviewSessionService;

    @MockitoBean
    private JwtService jwtService;

    private ReviewSessionResponse sessionResponse;

    @BeforeEach
    void setUp() {
        sessionResponse = new ReviewSessionResponse();
        sessionResponse.setId(1L);
        sessionResponse.setPublicId("session-123");
        sessionResponse.setUserId(1L);
        sessionResponse.setDeckId(1L);
    }

    @Test
    void startSession_Success() throws Exception {
        ReviewSessionRequest request = new ReviewSessionRequest();
        request.setPublicId("session-123");
        request.setUserId(1L);
        request.setDeckId(1L);

        Mockito.when(reviewSessionService.startSession(any(ReviewSessionRequest.class))).thenReturn(sessionResponse);

        mockMvc.perform(post("/review-sessions/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.publicId").value("session-123"))
                .andExpect(jsonPath("$.message").value("Khởi tạo phiên ôn tập thành công."));
    }

    @Test
    void syncOfflineReviews_Success() throws Exception {
        SyncReviewRequest request = new SyncReviewRequest();
        request.setSessionPublicId("12345678-1234-1234-1234-123456789012");
        request.setEvents(Collections.emptyList()); // Assuming validation might allow it, or we need to add mock valid data

        // Actually the DTO requires @NotEmpty on events. So let's mock one.
        // We will just send an empty string and expect Bad Request, OR we can send a valid JSON.
        // For simplicity, let's just bypass DTO validation by mocking correctly or testing what we have.
        // To be safe, we can send a minimal valid JSON manually.
        String requestJson = """
                {
                  "sessionPublicId": "12345678-1234-1234-1234-123456789012",
                  "events": [
                    {
                      "cardId": 1,
                      "rating": 3
                    }
                  ]
                }
                """;

        Mockito.doNothing().when(reviewSessionService).syncOfflineReviews(any(SyncReviewRequest.class));

        mockMvc.perform(post("/review-sessions/sync")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đồng bộ dữ liệu phiên ôn tập thành công."));
    }

    @Test
    void getCurrentSession_Success() throws Exception {
        Mockito.when(reviewSessionService.getCurrentSession()).thenReturn(sessionResponse);

        mockMvc.perform(get("/review-sessions/current")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publicId").value("session-123"))
                .andExpect(jsonPath("$.message").value("Tải thông tin phiên ôn tập thành công."));
    }

    @Test
    void abandonSession_Success() throws Exception {
        Mockito.doNothing().when(reviewSessionService).abandonSession("session-123");

        mockMvc.perform(post("/review-sessions/session-123/abandon")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã huỷ phiên ôn tập thành công."));
    }

    @Test
    void getTodayStats_Success() throws Exception {
        Map<String, Object> stats = new HashMap<>();
        stats.put("reviews", 10);
        Mockito.when(reviewSessionService.getTodayStats()).thenReturn(stats);

        mockMvc.perform(get("/review-sessions/stats/today")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviews").value(10))
                .andExpect(jsonPath("$.message").value("Tải số liệu thống kê thành công."));
    }

    @Test
    void getWeeklyStats_Success() throws Exception {
        Map<String, Object> stats = new HashMap<>();
        stats.put("weeklyReviews", 50);
        Mockito.when(reviewSessionService.getWeeklyStats()).thenReturn(stats);

        mockMvc.perform(get("/review-sessions/stats/weekly")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.weeklyReviews").value(50))
                .andExpect(jsonPath("$.message").value("Tải số liệu thống kê thành công."));
    }
}
