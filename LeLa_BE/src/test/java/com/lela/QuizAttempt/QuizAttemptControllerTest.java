package com.lela.QuizAttempt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.QuizAttempt.dto.QuizAttemptRequest;
import com.lela.QuizAttempt.dto.QuizAttemptReponse;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.auth.JwtService;
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

@WebMvcTest(QuizAttemptController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuizAttemptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuizAttemptService quizAttemptService;

    @MockitoBean
    private JwtService jwtService;

    private QuizAttemptReponse attemptResponse;

    @BeforeEach
    void setUp() {
        attemptResponse = new QuizAttemptReponse();
        attemptResponse.setPublicId("attempt-123");
        attemptResponse.setQuizTitle("Sample Quiz");
        attemptResponse.setAttemptNumber(1);
        attemptResponse.setStatus(QuizAttemptStatus.IN_PROGRESS);
    }

    @Test
    void getAll_Success() throws Exception {
        List<QuizAttemptReponse> list = Arrays.asList(attemptResponse);
        Page<QuizAttemptReponse> page = new PageImpl<>(list);

        Mockito.when(quizAttemptService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/quiz-attempts")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].publicId").value("attempt-123"));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(quizAttemptService.findById(1L)).thenReturn(attemptResponse);

        mockMvc.perform(get("/quiz-attempts/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publicId").value("attempt-123"));
    }

    @Test
    void create_Success() throws Exception {
        QuizAttemptRequest request = new QuizAttemptRequest();
        request.setQuizId(1L);
        request.setUserId(1L);
        request.setAttemptNumber(1);

        Mockito.when(quizAttemptService.create(any(QuizAttemptRequest.class))).thenReturn(attemptResponse);

        mockMvc.perform(post("/quiz-attempts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publicId").value("attempt-123"));
    }

    @Test
    void update_Success() throws Exception {
        QuizAttemptRequest request = new QuizAttemptRequest();
        request.setQuizId(1L);
        request.setUserId(1L);
        request.setAttemptNumber(2);

        QuizAttemptReponse updatedResponse = new QuizAttemptReponse();
        updatedResponse.setPublicId("attempt-456");

        Mockito.when(quizAttemptService.update(eq(1L), any(QuizAttemptRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/quiz-attempts/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publicId").value("attempt-456"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(quizAttemptService).delete(1L);

        mockMvc.perform(delete("/quiz-attempts/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
    }
}
