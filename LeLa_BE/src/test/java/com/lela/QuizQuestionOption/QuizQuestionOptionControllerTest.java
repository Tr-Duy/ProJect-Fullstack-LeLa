package com.lela.QuizQuestionOption;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionResponse;
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

@WebMvcTest(QuizQuestionOptionController.class)
@AutoConfigureMockMvc(addFilters = false)
public class QuizQuestionOptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuizQuestionOptionService quizQuestionOptionService;

    @MockitoBean
    private JwtService jwtService;

    private QuizQuestionOptionResponse optionResponse;

    @BeforeEach
    void setUp() {
        optionResponse = new QuizQuestionOptionResponse();
        optionResponse.setId(1L);
        optionResponse.setOptionKey("A");
        optionResponse.setOptionText("Object Oriented");
    }

    @Test
    void getAll_Success() throws Exception {
        List<QuizQuestionOptionResponse> list = Arrays.asList(optionResponse);
        Page<QuizQuestionOptionResponse> page = new PageImpl<>(list);

        Mockito.when(quizQuestionOptionService.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/quiz-question-options")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(quizQuestionOptionService.findById(1L)).thenReturn(optionResponse);

        mockMvc.perform(get("/quiz-question-options/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void create_Success() throws Exception {
        QuizQuestionOptionRequest request = new QuizQuestionOptionRequest();
        request.setQuestionId(1L);
        request.setOptionKey("A");
        request.setOptionText("Object Oriented");
        request.setIsCorrect(true);
        request.setDisplayOrder(1);

        Mockito.when(quizQuestionOptionService.create(any(QuizQuestionOptionRequest.class))).thenReturn(optionResponse);

        mockMvc.perform(post("/quiz-question-options")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void update_Success() throws Exception {
        QuizQuestionOptionRequest request = new QuizQuestionOptionRequest();
        request.setQuestionId(1L);
        request.setOptionKey("B");
        request.setOptionText("Functional");
        request.setIsCorrect(false);
        request.setDisplayOrder(2);

        QuizQuestionOptionResponse updatedResponse = new QuizQuestionOptionResponse();
        updatedResponse.setId(1L);
        updatedResponse.setOptionKey("B");

        Mockito.when(quizQuestionOptionService.update(eq(1L), any(QuizQuestionOptionRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/quiz-question-options/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.optionKey").value("B"));
    }

    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(quizQuestionOptionService).delete(1L);

        mockMvc.perform(delete("/quiz-question-options/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted successfully"));
    }
}
