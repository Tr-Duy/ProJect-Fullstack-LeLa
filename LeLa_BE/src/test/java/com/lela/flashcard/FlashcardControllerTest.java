package com.lela.flashcard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.flashcard.dto.FlashcardRequest;
import com.lela.flashcard.dto.FlashcardResponse;
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

@WebMvcTest(FlashcardController.class)
@AutoConfigureMockMvc(addFilters = false)
public class FlashcardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private FlashcardService flashcardService;

    @MockitoBean
    private JwtService jwtService;

    private FlashcardResponse flashcardResponse;

    @BeforeEach
    void setUp() {
        flashcardResponse = new FlashcardResponse();
        flashcardResponse.setId(1L);
        flashcardResponse.setDeckId(1L);
        flashcardResponse.setFrontText("Hello");
        flashcardResponse.setBackText("Xin chào");
    }

    @Test
    void createFlashcard_Success() throws Exception {
        FlashcardRequest request = new FlashcardRequest();
        request.setDeckId(1L);
        request.setFrontText("Hello");
        request.setBackText("Xin chào");

        Mockito.when(flashcardService.createFlashcard(any(FlashcardRequest.class))).thenReturn(flashcardResponse);

        mockMvc.perform(post("/flashcards")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.frontText").value("Hello"));
    }

    @Test
    void updateFlashcard_Success() throws Exception {
        FlashcardRequest request = new FlashcardRequest();
        request.setFrontText("Hi");

        FlashcardResponse updatedResponse = new FlashcardResponse();
        updatedResponse.setId(1L);
        updatedResponse.setFrontText("Hi");

        Mockito.when(flashcardService.updateFlashcard(eq(1L), any(FlashcardRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/flashcards/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.frontText").value("Hi"));
    }

    @Test
    void getFlashcardById_Success() throws Exception {
        Mockito.when(flashcardService.getFlashcardById(1L)).thenReturn(flashcardResponse);

        mockMvc.perform(get("/flashcards/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getFlashcardsByDeck_Success() throws Exception {
        List<FlashcardResponse> list = Arrays.asList(flashcardResponse);
        Page<FlashcardResponse> page = new PageImpl<>(list);

        Mockito.when(flashcardService.getFlashcardsByDeck(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/flashcards/deck/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    void getFlashcardsByTag_Success() throws Exception {
        List<FlashcardResponse> list = Arrays.asList(flashcardResponse);
        Page<FlashcardResponse> page = new PageImpl<>(list);

        Mockito.when(flashcardService.getFlashcardsByTag(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/flashcards/tag/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    void deleteFlashcard_Success() throws Exception {
        Mockito.doNothing().when(flashcardService).deleteFlashcard(1L);

        mockMvc.perform(delete("/flashcards/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}
