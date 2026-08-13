package com.lela.QuizAttemptQuestion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionRequest;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse;
import com.lela.QuizQuestion.domain.QuestionType;
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

@WebMvcTest(QuizAttemptQuestionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuizAttemptQuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuizAttemptQuestionService quizAttemptQuestionService;

    @MockitoBean
    private JwtService jwtService;

    private QuizAttemptQuestionResponse questionResponse;

    @BeforeEach
    void setUp() {
        questionResponse = new QuizAttemptQuestionResponse();
        questionResponse.setId(1L);
        questionResponse.setQuestionText("What is Java?");
        questionResponse.setQuestionType(QuestionType.MULTIPLE_CHOICE);
    }

    @Test
    void getAll_Success() throws Exception {
        List<QuizAttemptQuestionResponse> list = Arrays.asList(questionResponse);
        Page<QuizAttemptQuestionResponse> page = new PageImpl<>(list);

        Mockito.when(quizAttemptQuestionService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/quiz-attempt-questions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(quizAttemptQuestionService.findById(1L)).thenReturn(questionResponse);

        mockMvc.perform(get("/quiz-attempt-questions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void create_Success() throws Exception {
        QuizAttemptQuestionRequest request = new QuizAttemptQuestionRequest();
        request.setAttemptId(1L);
        request.setQuestionText("What is Java?");
        request.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        request.setPoints(1);
        request.setDisplayOrder(1);

        Mockito.when(quizAttemptQuestionService.create(any(QuizAttemptQuestionRequest.class))).thenReturn(questionResponse);

        mockMvc.perform(post("/quiz-attempt-questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void update_Success() throws Exception {
        QuizAttemptQuestionRequest request = new QuizAttemptQuestionRequest();
        request.setAttemptId(1L);
        request.setQuestionText("What is Spring?");
        request.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        request.setPoints(1);
        request.setDisplayOrder(1);

        QuizAttemptQuestionResponse updatedResponse = new QuizAttemptQuestionResponse();
        updatedResponse.setId(1L);
        updatedResponse.setQuestionText("What is Spring?");

        Mockito.when(quizAttemptQuestionService.update(eq(1L), any(QuizAttemptQuestionRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/quiz-attempt-questions/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questionText").value("What is Spring?"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(quizAttemptQuestionService).delete(1L);

        mockMvc.perform(delete("/quiz-attempt-questions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
    }
}
