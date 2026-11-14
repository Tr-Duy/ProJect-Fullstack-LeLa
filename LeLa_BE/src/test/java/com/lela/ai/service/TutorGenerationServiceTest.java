package com.lela.ai.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.GeminiRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.net.http.HttpResponse;
import java.util.concurrent.CompletableFuture;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TutorGenerationServiceTest {
    GeminiClient client;
    TutorGenerationService service;
    final String stop = """
        {"modelVersion":"actual-model","candidates":[{"finishReason":"STOP","content":{"parts":[
        {"thought":true,"text":"private reasoning"},{"text":"Xin chào **bạn**."},{"text":"\\nĐã xong."}]}}],
        "usageMetadata":{"promptTokenCount":12,"candidatesTokenCount":10,"thoughtsTokenCount":3}}
        """;
    @BeforeEach void setup() {
        client = mock(GeminiClient.class);
        when(client.getPrimaryModel()).thenReturn("primary"); when(client.getFallbackModel()).thenReturn("backup");
        service = new TutorGenerationService(client, new ObjectMapper()); service.retryDelayMs = 0;
    }
    CompletableFuture<HttpResponse<String>> response(int status, String body) {
        HttpResponse<String> response = new HttpResponse<>() {
            public int statusCode(){return status;}
            public String body(){return body;}
            public java.net.http.HttpRequest request(){return null;}
            public java.util.Optional<HttpResponse<String>> previousResponse(){return java.util.Optional.empty();}
            public java.net.http.HttpHeaders headers(){return java.net.http.HttpHeaders.of(java.util.Map.of(),(a,b)->true);}
            public java.util.Optional<javax.net.ssl.SSLSession> sslSession(){return java.util.Optional.empty();}
            public java.net.URI uri(){return java.net.URI.create("http://localhost/mock");}
            public java.net.http.HttpClient.Version version(){return java.net.http.HttpClient.Version.HTTP_1_1;}
        };
        return CompletableFuture.completedFuture(response);
    }
    @Test void joinsEveryVisiblePartAndOnlyStopIsComplete() {
        when(client.generateContent(eq("primary"),any())).thenReturn(response(200,stop));
        var result=service.generate(new GeminiRequest(),"turn");
        assertTrue(result.complete());assertEquals("Xin chào **bạn**.\nĐã xong.",result.content());
        assertEquals("actual-model",result.model());assertEquals(3,result.usageMetadata().getThoughtsTokenCount());
    }
    @Test void maxTokensIsNeverComplete() {
        when(client.generateContent(eq("primary"),any())).thenReturn(response(200,stop.replace("STOP","MAX_TOKENS")));
        var result=service.generate(new GeminiRequest(),"turn");
        assertFalse(result.complete());assertEquals("AI_TRUNCATED",result.errorCode());
        verify(client,times(2)).generateContent(eq("primary"),any());
    }
    @Test void maxTokensContinuesOnceAndOnlyFinalStopCompletesTheCombinedAnswer() {
        when(client.generateContent(eq("primary"),any())).thenReturn(
                response(200,stop.replace("STOP","MAX_TOKENS")),response(200,stop));
        var result=service.generate(new GeminiRequest(),"turn");
        assertTrue(result.complete());assertEquals("STOP",result.finishReason());
        assertTrue(result.content().startsWith("Xin chào **bạn**."));
        assertEquals(20,result.usageMetadata().getCandidatesTokenCount());
        verify(client,times(2)).generateContent(eq("primary"),any());
    }
    @Test void dailyQuotaSkipsRetryAndRemembersExhaustedModel() {
        when(client.generateContent(eq("primary"),any())).thenReturn(response(429,"""
            {"error":{"details":[{"violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}]}}
            """));
        when(client.generateContent(eq("backup"),any())).thenReturn(response(200,stop));
        assertTrue(service.generate(new GeminiRequest(),"one").complete());
        assertTrue(service.generate(new GeminiRequest(),"two").complete());
        verify(client,times(1)).generateContent(eq("primary"),any());
        verify(client,times(2)).generateContent(eq("backup"),any());
    }
    @Test void transient429RetriesOnlyOnce() {
        when(client.generateContent(eq("primary"),any())).thenReturn(response(429,"{}"),response(200,stop));
        assertTrue(service.generate(new GeminiRequest(),"turn").complete());
        verify(client,times(2)).generateContent(eq("primary"),any());
        verify(client,never()).generateContent(eq("backup"),any());
    }
    @Test void serversDownProduceExplicitFailureAfterFourBoundedCalls() {
        when(client.generateContent(anyString(),any())).thenReturn(response(503,"{}"));
        var result=service.generate(new GeminiRequest(),"turn");
        assertFalse(result.complete());assertEquals("",result.content());assertEquals("AI_BUSY",result.errorCode());
        verify(client,times(4)).generateContent(anyString(),any());
    }
    @Test void timeoutCancelsRequestsAndReturnsFailure() {
        service.timeoutSeconds=0;
        when(client.generateContent(anyString(),any())).thenAnswer(invocation->new CompletableFuture<>());
        assertEquals("AI_BUSY",service.generate(new GeminiRequest(),"turn").errorCode());
        verify(client,times(4)).generateContent(anyString(),any());
    }
    @Test void missingStopOrEmptyPartsCannotBeStoredAsAnAnswer() {
        when(client.generateContent(eq("primary"),any())).thenReturn(response(200,"{\"candidates\":[{\"content\":{\"parts\":[]}}]}"));
        assertFalse(service.generate(new GeminiRequest(),"turn").complete());
    }
}
