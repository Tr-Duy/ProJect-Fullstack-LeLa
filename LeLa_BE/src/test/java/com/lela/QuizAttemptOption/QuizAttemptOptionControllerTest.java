package com.lela.QuizAttemptOption;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionRequest;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionResponse;
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

@WebMvcTest(QuizAttemptOptionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuizAttemptOptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuizAttemptOptionService quizAttemptOptionService;

    @MockitoBean
    private JwtService jwtService;

    private QuizAttemptOptionResponse optionResponse;

    @BeforeEach
    void setUp() {
        optionResponse = new QuizAttemptOptionResponse();
        optionResponse.setId(1L);
        optionResponse.setOptionKey("A");
        optionResponse.setOptionText("Object Oriented");
    }

    @Test
    void getAll_Success() throws Exception {
        List<QuizAttemptOptionResponse> list = Arrays.asList(optionResponse);
        Page<QuizAttemptOptionResponse> page = new PageImpl<>(list);

        Mockito.when(quizAttemptOptionService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/quiz-attempt-options")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(quizAttemptOptionService.findById(1L)).thenReturn(optionResponse);

        mockMvc.perform(get("/quiz-attempt-options/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void create_Success() throws Exception {
        QuizAttemptOptionRequest request = new QuizAttemptOptionRequest();
        request.setAttemptQuestionId(1L);
        request.setOptionKey("A");
        request.setOptionText("Object Oriented");
        request.setIsCorrect(true);
        request.setDisplayOrder(1);

        Mockito.when(quizAttemptOptionService.create(any(QuizAttemptOptionRequest.class))).thenReturn(optionResponse);

        mockMvc.perform(post("/quiz-attempt-options")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void update_Success() throws Exception {
        QuizAttemptOptionRequest request = new QuizAttemptOptionRequest();
        request.setAttemptQuestionId(1L);
        request.setOptionKey("B");
        request.setOptionText("Functional");
        request.setIsCorrect(false);
        request.setDisplayOrder(2);

        QuizAttemptOptionResponse updatedResponse = new QuizAttemptOptionResponse();
        updatedResponse.setId(1L);
        updatedResponse.setOptionKey("B");

        Mockito.when(quizAttemptOptionService.update(eq(1L), any(QuizAttemptOptionRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/quiz-attempt-options/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.optionKey").value("B"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(quizAttemptOptionService).delete(1L);

        mockMvc.perform(delete("/quiz-attempt-options/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
    }
}
