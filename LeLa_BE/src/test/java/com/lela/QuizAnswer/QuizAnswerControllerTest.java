package com.lela.QuizAnswer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.QuizAnswer.dto.QuizAnswerRequest;
import com.lela.QuizAnswer.dto.QuizAnswerResponse;
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

@WebMvcTest(QuizAnswerController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuizAnswerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuizAnswerService quizAnswerService;

    @MockitoBean
    private JwtService jwtService;

    private QuizAnswerResponse answerResponse;

    @BeforeEach
    void setUp() {
        answerResponse = new QuizAnswerResponse();
        answerResponse.setId(1L);
        answerResponse.setAnswerText("A");
        answerResponse.setIsCorrect(true);
    }

    @Test
    void findAll_Success() throws Exception {
        List<QuizAnswerResponse> list = Arrays.asList(answerResponse);
        Page<QuizAnswerResponse> page = new PageImpl<>(list);

        Mockito.when(quizAnswerService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/quiz-answers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(quizAnswerService.findById(1L)).thenReturn(answerResponse);

        mockMvc.perform(get("/quiz-answers/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void create_Success() throws Exception {
        QuizAnswerRequest request = new QuizAnswerRequest();
        request.setAttemptId(1L);
        request.setAttemptQuestionId(1L);
        request.setAnswerText("A");

        Mockito.when(quizAnswerService.create(any(QuizAnswerRequest.class))).thenReturn(answerResponse);

        mockMvc.perform(post("/quiz-answers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void update_Success() throws Exception {
        QuizAnswerRequest request = new QuizAnswerRequest();
        request.setAttemptId(1L);
        request.setAttemptQuestionId(1L);
        request.setAnswerText("B");

        QuizAnswerResponse updatedResponse = new QuizAnswerResponse();
        updatedResponse.setId(1L);
        updatedResponse.setAnswerText("B");

        Mockito.when(quizAnswerService.update(eq(1L), any(QuizAnswerRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/quiz-answers/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.answerText").value("B"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(quizAnswerService).delete(1L);

        mockMvc.perform(delete("/quiz-answers/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
    }
}
