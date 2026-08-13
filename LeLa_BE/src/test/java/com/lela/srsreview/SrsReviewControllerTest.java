package com.lela.srsreview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.srsreview.dto.SrsReviewRequest;
import com.lela.srsreview.dto.SrsReviewResponse;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SrsReviewController.class)
@AutoConfigureMockMvc(addFilters = false)
public class SrsReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SrsReviewService srsReviewService;

    @MockitoBean
    private JwtService jwtService;

    private SrsReviewResponse reviewResponse;

    @BeforeEach
    void setUp() {
        reviewResponse = new SrsReviewResponse();
        reviewResponse.setId(1L);
        reviewResponse.setUserId(1L);
        reviewResponse.setCardId(1L);
        reviewResponse.setRating(3);
    }

    @Test
    void reviewCard_Success() throws Exception {
        SrsReviewRequest request = new SrsReviewRequest();
        request.setUserId(1L);
        request.setCardId(1L);
        request.setRating(3);

        Mockito.when(srsReviewService.reviewCard(any(SrsReviewRequest.class))).thenReturn(reviewResponse);

        // Note: SrsReviewController returns ApiResponse directly, without ResponseEntity.
        // It will still be serialized as JSON.
        mockMvc.perform(post("/srs-reviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.message").value("Review submitted"));
    }

    @Test
    void getReviewHistory_Success() throws Exception {
        List<SrsReviewResponse> list = Arrays.asList(reviewResponse);
        Page<SrsReviewResponse> page = new PageImpl<>(list);

        Mockito.when(srsReviewService.getReviewHistory(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/srs-reviews/history")
                .param("userId", "1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getReviewStatistics_Success() throws Exception {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalReviews", 100);

        Mockito.when(srsReviewService.getReviewStatistics(1L)).thenReturn(stats);

        mockMvc.perform(get("/srs-reviews/statistics")
                .param("userId", "1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalReviews").value(100));
    }
}
