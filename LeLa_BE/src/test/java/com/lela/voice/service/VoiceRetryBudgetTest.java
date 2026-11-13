package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.service.GeminiClient;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.ConversationScenario;
import org.junit.jupiter.api.Test;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class VoiceRetryBudgetTest {
    class TimedService extends VoiceAiService {
        long clock = 1_000_000_000L;
        List<Long> sleeps = new ArrayList<>();
        TimedService(GeminiClient client, VoiceConfigurationProperties props) { super(client, new ObjectMapper(), props, null); }
        @Override long nanoTime() { return clock; }
        @Override void sleepMs(long ms) { sleeps.add(ms); clock += ms * 1_000_000; }
    }
    final GeminiClient client = mock(GeminiClient.class);
    final VoiceConfigurationProperties props = new VoiceConfigurationProperties();
    final List<Long> budgets = new ArrayList<>();
    final List<String> models = new ArrayList<>();
    final TimedService service;
    VoiceRetryBudgetTest() {
        props.setTurnModel("lite"); props.setFallbackModel("strong");
        service = new TimedService(client, props);
    }
    CompletableFuture<HttpResponse<String>> response(int status, long cost, String retryAfter) {
        HttpResponse<String> response = mock(HttpResponse.class);
        lenient().when(response.statusCode()).thenReturn(status);
        lenient().when(response.body()).thenReturn(status == 200 ? "{\"aiReply\":\"Hello\",\"usageMetadata\":{\"totalTokenCount\":17}}" : "{\"error\":\"quota PerDay\"}");
        lenient().when(response.headers()).thenReturn(HttpHeaders.of(retryAfter == null ? Map.of() : Map.of("Retry-After", List.of(retryAfter)), (a,b) -> true));
        return new CompletableFuture<>() {
            @Override public HttpResponse<String> get(long timeout, TimeUnit unit) throws TimeoutException {
                long ms = unit.toMillis(timeout); budgets.add(ms);
                service.clock += Math.min(ms, cost) * 1_000_000;
                if (cost > ms) throw new TimeoutException();
                return response;
            }
        };
    }
    VoiceAiService.TurnAiOutput run() {
        return service.generateTurnResponse(ConversationScenario.builder().openingLine("Hello").fallbackLinesJson("[]").build(),
                200, "Coffee", List.of(), Set.of(), List.of());
    }
    @Test void quick503RetriesExactlyOnceWith400msAndNoFallbackOnSuccess() {
        var first = response(503, 1000, null); var second = response(200, 1500, null);
        when(client.generateContent(eq("lite"), any())).thenReturn(first, second);
        var output = run();
        assertFalse(output.getDegraded()); assertEquals(2, output.getAiAttempts()); assertEquals(1, output.getAiRetries());
        assertEquals(List.of(400L), service.sleeps);
        assertTrue(budgets.get(1) >= 2500 && budgets.get(1) <= 3350);
        verify(client, never()).generateContent(eq("strong"), any());
    }
    @Test void two503sUseFullStrongBudgetWithoutAThirdLiteAttempt() {
        var first = response(503, 1000, null); var second = response(503, 1000, null);
        when(client.generateContent(eq("lite"), any())).thenReturn(first, second);
        when(client.generateContent(eq("strong"), any())).thenAnswer(invocation -> response(200, 1000, null));
        var output = run();
        assertEquals(3, output.getAiAttempts()); assertEquals(1, output.getAiRetries());
        assertTrue(budgets.get(2) >= 3000);
        verify(client, times(2)).generateContent(eq("lite"), any());
        verify(client, times(1)).generateContent(eq("strong"), any());
    }
    @Test void timeoutsCancelFuturesAndGiveFallbackAtLeastThreeRealSecondsWithinEight() {
        var primary = response(200, 10_000, null); var strong = response(200, 10_000, null);
        when(client.generateContent(eq("lite"), any())).thenReturn(primary);
        when(client.generateContent(eq("strong"), any())).thenReturn(strong);
        var output = run();
        assertTrue(output.getDegraded()); assertTrue(primary.isCancelled()); assertTrue(strong.isCancelled());
        assertEquals(4000L, budgets.get(0));
        assertEquals(3750L, budgets.get(1));
        assertTrue(service.clock - 1_000_000_000L < TimeUnit.SECONDS.toNanos(8));
        assertEquals(0, output.getAiRetries());
    }
    @Test void daily429SwitchesModelWithoutRetryOrSleep() {
        when(client.generateContent(eq("lite"), any())).thenAnswer(invocation -> response(429, 200, "73016"));
        when(client.generateContent(eq("strong"), any())).thenAnswer(invocation -> response(200, 1000, null));
        var output = run();
        assertFalse(output.getDegraded()); assertEquals(0, output.getAiRetries()); assertTrue(service.sleeps.isEmpty());
        verify(client, times(1)).generateContent(eq("lite"), any());
        assertEquals(7550L, budgets.get(1));
    }
    @Test void slow503SkipsRetryRatherThanTakingTheFallbackBudget() {
        when(client.generateContent(eq("lite"), any())).thenAnswer(invocation -> response(503, 3000, null));
        when(client.generateContent(eq("strong"), any())).thenAnswer(invocation -> response(200, 1000, null));
        var output = run(); assertEquals(0, output.getAiRetries());
        assertTrue(service.sleeps.isEmpty()); assertEquals(4750L, budgets.get(1));
    }
    @Test void longRetryAfterAndStrong503AreNeverRetried() {
        when(client.generateContent(eq("lite"), any())).thenAnswer(invocation -> response(503, 200, "10"));
        when(client.generateContent(eq("strong"), any())).thenAnswer(invocation -> response(503, 200, null));
        var output = run(); assertTrue(output.getDegraded()); assertEquals(2, output.getAiAttempts());
        assertEquals(0, output.getAiRetries()); assertTrue(service.sleeps.isEmpty());
    }
}
