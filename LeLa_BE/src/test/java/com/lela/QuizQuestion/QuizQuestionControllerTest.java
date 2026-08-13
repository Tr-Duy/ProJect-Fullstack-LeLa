package com.lela.QuizQuestion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.QuizQuestion.domain.QuestionType;
import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import com.lela.QuizQuestion.dto.QuizQuestionResponse;
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

@WebMvcTest(QuizQuestionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuizQuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuizQuestionService quizQuestionService;

    @MockitoBean
    private JwtService jwtService;

    private QuizQuestionResponse quizQuestionResponse;

    @BeforeEach
    void setUp() {
        quizQuestionResponse = new QuizQuestionResponse();
        quizQuestionResponse.setId(1L);
        quizQuestionResponse.setQuestionText("What is Java?");
        quizQuestionResponse.setQuestionType(QuestionType.MULTIPLE_CHOICE);
    }

    @Test
    void getAll_Success() throws Exception {
        List<QuizQuestionResponse> list = Arrays.asList(quizQuestionResponse);
        Page<QuizQuestionResponse> page = new PageImpl<>(list);

        Mockito.when(quizQuestionService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/quiz-questions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(quizQuestionService.findById(1L)).thenReturn(quizQuestionResponse);

        mockMvc.perform(get("/quiz-questions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void create_Success() throws Exception {
        QuizQuestionRequest request = new QuizQuestionRequest();
        request.setQuizId(1L);
        request.setQuestionText("What is Java?");
        request.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        request.setPoints(1);
        request.setDisplayOrder(1);
        request.setIsActive(true);

        Mockito.when(quizQuestionService.create(any(QuizQuestionRequest.class))).thenReturn(quizQuestionResponse);

        mockMvc.perform(post("/quiz-questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void update_Success() throws Exception {
        QuizQuestionRequest request = new QuizQuestionRequest();
        request.setQuizId(1L);
        request.setQuestionText("What is Spring?");
        request.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        request.setPoints(1);
        request.setDisplayOrder(1);
        request.setIsActive(true);

        QuizQuestionResponse updatedResponse = new QuizQuestionResponse();
        updatedResponse.setId(1L);
        updatedResponse.setQuestionText("What is Spring?");

        Mockito.when(quizQuestionService.update(eq(1L), any(QuizQuestionRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/quiz-questions/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questionText").value("What is Spring?"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(quizQuestionService).delete(1L);

        mockMvc.perform(delete("/quiz-questions/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
    }
}
