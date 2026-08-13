package com.lela.deckenrollment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.deckenrollment.domain.DeckEnrollmentStatus;
import com.lela.deckenrollment.dto.DeckEnrollmentRequest;
import com.lela.deckenrollment.dto.DeckEnrollmentResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DeckEnrollmentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class DeckEnrollmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DeckEnrollmentService deckEnrollmentService;

    @MockitoBean
    private JwtService jwtService;

    private DeckEnrollmentResponse deckEnrollmentResponse;

    @BeforeEach
    void setUp() {
        deckEnrollmentResponse = new DeckEnrollmentResponse();
        deckEnrollmentResponse.setId(1L);
        deckEnrollmentResponse.setUserId(1L);
        deckEnrollmentResponse.setDeckId(1L);
        deckEnrollmentResponse.setStatus(DeckEnrollmentStatus.ACTIVE);
    }

    @Test
    void enrollDeck_Success() throws Exception {
        DeckEnrollmentRequest request = new DeckEnrollmentRequest();
        request.setUserId(1L);
        request.setDeckId(1L);
        request.setStatus(DeckEnrollmentStatus.ACTIVE);

        Mockito.when(deckEnrollmentService.enrollDeck(any(DeckEnrollmentRequest.class))).thenReturn(deckEnrollmentResponse);

        mockMvc.perform(post("/enrollments/decks/1/enroll")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng ký tham gia bộ thẻ học thành công."))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void updateStatus_Success() throws Exception {
        DeckEnrollmentRequest request = new DeckEnrollmentRequest();
        request.setStatus(DeckEnrollmentStatus.PAUSED);

        DeckEnrollmentResponse updatedResponse = new DeckEnrollmentResponse();
        updatedResponse.setId(1L);
        updatedResponse.setStatus(DeckEnrollmentStatus.PAUSED);

        Mockito.when(deckEnrollmentService.updateStatus(any(DeckEnrollmentRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/enrollments/decks/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật trạng thái học tập thành công."))
                .andExpect(jsonPath("$.data.status").value("PAUSED"));
    }

    @Test
    void getUserEnrollList_Success() throws Exception {
        List<DeckEnrollmentResponse> list = Arrays.asList(deckEnrollmentResponse);
        Page<DeckEnrollmentResponse> page = new PageImpl<>(list);

        Mockito.when(deckEnrollmentService.getUserEnrollList(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/enrollments/my-list")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tải danh sách đăng ký học thành công."))
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getReviewToday_Success() throws Exception {
        List<DeckEnrollmentResponse> list = Arrays.asList(deckEnrollmentResponse);
        Page<DeckEnrollmentResponse> page = new PageImpl<>(list);

        Mockito.when(deckEnrollmentService.getReviewToday(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/enrollments/today-reviews")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tải danh sách lịch hẹn ôn tập hôm nay thành công."))
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }
}
