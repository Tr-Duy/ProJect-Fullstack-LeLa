package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.service.GeminiClient;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.dto.*;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class VoiceSummaryServiceTest {
    final GeminiClient client = mock(GeminiClient.class);
    final ObjectMapper mapper = new ObjectMapper();
    final VoiceConfigurationProperties props = new VoiceConfigurationProperties();
    final VoiceReportResponse report = new VoiceReportResponse("summary-session", 80, null, 80, 80, 0,
            "KEEP", null, 200, 200, 50, false, List.of(),
            List.of(new VoiceTurnCorrectionDto(1, "I likes coffee", List.of("I like"), "I like coffee")), false);
    VoiceSummaryService service() { props.setTurnModel("lite"); props.setSummaryModel("strong"); return new VoiceSummaryService(client, mapper, props); }

    @Test void strongModelSummaryIsCachedAndNeverChangesScoresXpOrDifficulty() throws Exception {
        var service = service(); HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn(mapper.writeValueAsString(Map.of("candidates", List.of(Map.of("content", Map.of("parts", List.of(Map.of("text", "{\"summary\":\"Use I like.\"}"))))))));
        when(client.generateContent(eq("strong"), any())).thenReturn(CompletableFuture.completedFuture(response));
        var result = service.enrich(report);
        assertEquals("Use I like.", result.coachSummary());
        assertEquals(report.xpAwarded(), result.xpAwarded()); assertEquals(report.overallScore(), result.overallScore());
        assertEquals(report.newLevel(), result.newLevel()); assertEquals(report.corrections(), result.corrections());
        assertEquals(result, service.enrich(report));
        verify(client, times(1)).generateContent(eq("strong"), any());
        verify(client, never()).generateContent(eq("lite"), any());
    }

    @Test void quotaFailureIsNotRetriedAndCannotRollBackAnAlreadyFinishedReport() {
        var service = service(); HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(429);
        when(client.generateContent(eq("strong"), any())).thenReturn(CompletableFuture.completedFuture(response));
        assertEquals(report, service.enrich(report)); assertEquals(report, service.enrich(report));
        verify(client, times(1)).generateContent(eq("strong"), any());
    }

    @Test void summaryCannotBeCalledInsideTheScoringTransaction() {
        var service = service();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try { assertThrows(IllegalStateException.class, () -> service.enrich(report)); }
        finally { TransactionSynchronizationManager.setActualTransactionActive(false); }
        verifyNoInteractions(client);
    }
}
