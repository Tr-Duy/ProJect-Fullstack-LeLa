package com.lela.deck;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.deck.domain.DeckDifficulty;
import com.lela.deck.domain.DeckVisibility;
import com.lela.deck.dto.DeckRequest;
import com.lela.deck.dto.DeckResponse;
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

@WebMvcTest(DeckController.class)
@AutoConfigureMockMvc(addFilters = false)
public class DeckControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DeckService deckService;

    @MockitoBean
    private JwtService jwtService;

    private DeckResponse deckResponse;

    @BeforeEach
    void setUp() {
        deckResponse = new DeckResponse();
        deckResponse.setId(1L);
        deckResponse.setTitle("Java Basics");
        deckResponse.setDescription("Learn Java");
        deckResponse.setDifficulty(DeckDifficulty.BEGINNER);
        deckResponse.setVisibility(DeckVisibility.PUBLIC);
        deckResponse.setOwnerId(1L);
    }

    @Test
    void createDeck_Success() throws Exception {
        DeckRequest request = new DeckRequest();
        request.setTitle("Java Basics");
        request.setDescription("Learn Java");
        request.setDifficulty(DeckDifficulty.BEGINNER);
        request.setVisibility(DeckVisibility.PUBLIC);
        request.setOwnerId(1L);

        Mockito.when(deckService.createDeck(any(DeckRequest.class))).thenReturn(deckResponse);

        mockMvc.perform(post("/decks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("Java Basics"));
    }

    @Test
    void updateDeck_Success() throws Exception {
        DeckRequest request = new DeckRequest();
        request.setTitle("Java Advanced");

        DeckResponse updatedResponse = new DeckResponse();
        updatedResponse.setId(1L);
        updatedResponse.setTitle("Java Advanced");

        Mockito.when(deckService.updateDeck(eq(1L), any(DeckRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/decks/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Java Advanced"));
    }

    @Test
    void getDeckById_Success() throws Exception {
        Mockito.when(deckService.getDeckById(1L)).thenReturn(deckResponse);

        mockMvc.perform(get("/decks/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getAllDecks_Success() throws Exception {
        List<DeckResponse> list = Arrays.asList(deckResponse);
        Page<DeckResponse> page = new PageImpl<>(list);

        Mockito.when(deckService.getAllDecks(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/decks")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    void getDecksByOwner_Success() throws Exception {
        List<DeckResponse> list = Arrays.asList(deckResponse);
        Page<DeckResponse> page = new PageImpl<>(list);

        Mockito.when(deckService.getDecksByOwner(eq(1L), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/decks/owner/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    void deleteDeck_Success() throws Exception {
        Mockito.doNothing().when(deckService).deleteDeck(1L);

        mockMvc.perform(delete("/decks/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}
