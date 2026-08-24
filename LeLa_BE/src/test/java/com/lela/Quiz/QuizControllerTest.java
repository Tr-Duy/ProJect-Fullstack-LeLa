package com.lela.Quiz;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.Quiz.dto.QuizRequest;
import com.lela.Quiz.dto.QuizResponse;
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

@WebMvcTest(QuizController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuizControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuizService quizService;

    @MockitoBean
    private JwtService jwtService;

    private QuizResponse quizResponse;

    @BeforeEach
    void setUp() {
        quizResponse = new QuizResponse();
        quizResponse.setId(1L);
        quizResponse.setDeckId(1L);
        quizResponse.setTitle("Sample Quiz");
        quizResponse.setQuizCode("Q123");
    }

    @Test
    void findAll_Success() throws Exception {
        List<QuizResponse> list = Arrays.asList(quizResponse);
        Page<QuizResponse> page = new PageImpl<>(list);

        Mockito.when(quizService.findAll(
                any(Pageable.class),
                org.mockito.ArgumentMatchers.nullable(com.lela.Quiz.domain.QuizCategory.class),
                org.mockito.ArgumentMatchers.nullable(Long.class),
                org.mockito.ArgumentMatchers.nullable(Long.class),
                org.mockito.ArgumentMatchers.nullable(com.lela.Quiz.domain.QuizDifficulty.class),
                org.mockito.ArgumentMatchers.nullable(Long.class),
                org.mockito.ArgumentMatchers.nullable(String.class))).thenReturn(page);


        mockMvc.perform(get("/quizzes")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void findById_Success() throws Exception {
        Mockito.when(quizService.findById(1L)).thenReturn(quizResponse);

        mockMvc.perform(get("/quizzes/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void create_Success() throws Exception {
        QuizRequest request = new QuizRequest();
        request.setDeckId(1L);
        request.setCreatedById(1L);
        request.setQuizCode("Q123");
        request.setTitle("Sample Quiz");

        Mockito.when(quizService.create(any(QuizRequest.class))).thenReturn(quizResponse);

        mockMvc.perform(post("/quizzes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void update_Success() throws Exception {
        QuizRequest request = new QuizRequest();
        request.setDeckId(1L);
        request.setCreatedById(1L);
        request.setQuizCode("Q123");
        request.setTitle("Updated Quiz");

        QuizResponse updatedResponse = new QuizResponse();
        updatedResponse.setId(1L);
        updatedResponse.setTitle("Updated Quiz");

        Mockito.when(quizService.update(eq(1L), any(QuizRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/quizzes/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated Quiz"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(quizService).delete(1L);

        mockMvc.perform(delete("/quizzes/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
    }
}
