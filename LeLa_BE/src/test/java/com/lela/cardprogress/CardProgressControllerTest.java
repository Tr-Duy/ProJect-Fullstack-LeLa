package com.lela.cardprogress;

import com.lela.cardprogress.domain.CardProgressState;
import com.lela.cardprogress.dto.CardProgressResponse;
import com.lela.cardprogress.dto.CardProgressSummaryRepponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CardProgressController.class)
@AutoConfigureMockMvc(addFilters = false)
public class CardProgressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CardProgressService cardProgressService;

    @MockitoBean
    private JwtService jwtService;

    private CardProgressResponse progressResponse;
    private CardProgressSummaryRepponse summaryResponse;

    @BeforeEach
    void setUp() {
        progressResponse = new CardProgressResponse();
        progressResponse.setId(1L);
        progressResponse.setCardId(1L);
        progressResponse.setState(CardProgressState.LEARNING);

        summaryResponse = new CardProgressSummaryRepponse();
        summaryResponse.setId(1L);
        summaryResponse.setCardId(1L);
        summaryResponse.setState(CardProgressState.NEW);
    }

    @Test
    void getProgressDetail_Success() throws Exception {
        Mockito.when(cardProgressService.getProgressDetail(1L)).thenReturn(progressResponse);

        mockMvc.perform(get("/card-progress/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.cardId").value(1L));
    }

    @Test
    void getProgressByDeck_Success() throws Exception {
        List<CardProgressSummaryRepponse> list = Arrays.asList(summaryResponse);
        Page<CardProgressSummaryRepponse> page = new PageImpl<>(list);

        Mockito.when(cardProgressService.getProgressByDeck(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/card-progress/deck/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    void getReviewCards_Success() throws Exception {
        List<CardProgressSummaryRepponse> list = Arrays.asList(summaryResponse);
        Page<CardProgressSummaryRepponse> page = new PageImpl<>(list);

        Mockito.when(cardProgressService.getReviewCards(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/card-progress/deck/1/review")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    void getNewCards_Success() throws Exception {
        List<CardProgressSummaryRepponse> list = Arrays.asList(summaryResponse);
        Page<CardProgressSummaryRepponse> page = new PageImpl<>(list);

        Mockito.when(cardProgressService.getNewCards(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/card-progress/deck/1/new")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    void suspendCard_Success() throws Exception {
        Mockito.doNothing().when(cardProgressService).suspendCard(1L);

        mockMvc.perform(post("/card-progress/suspend/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void resetProgress_Success() throws Exception {
        Mockito.doNothing().when(cardProgressService).resetProgress(1L);

        mockMvc.perform(post("/card-progress/reset/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
