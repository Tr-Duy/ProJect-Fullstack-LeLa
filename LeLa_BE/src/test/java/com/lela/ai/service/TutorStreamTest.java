package com.lela.ai.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class TutorStreamTest {
    InputStream bytes(String text) {
        return new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8)) {
            public synchronized int read(byte[] b,int off,int len){return super.read(b,off,Math.min(len,1));}
        };
    }
    @Test void oneByteUtf8MultilineAndMissingLastNewline() throws Exception {
        var events=new ArrayList<String>();
        TutorSseReader.read(bytes(": comment\r\ndata: Tiếng Việt 😀\r\ndata:  space  \r\n\r\ndata:last"),events::add);
        assertEquals(List.of("Tiếng Việt 😀\n space  ","last"),events);
    }
    @SuppressWarnings("unchecked")
    TutorGenerationService service(String stream,GeminiClient client) {
        HttpResponse<InputStream> response=mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);when(response.body()).thenReturn(bytes(stream));
        when(client.streamGenerateContent(anyString(),any())).thenReturn(CompletableFuture.completedFuture(response));
        var service=new TutorGenerationService(client,new ObjectMapper());service.retryDelayMs=0;return service;
    }
    GeminiRequest request(){return GeminiRequest.builder().contents(List.of(new GeminiRequest.Content("user",List.of(new GeminiRequest.Part("Hello")))))
            .generationConfig(GeminiRequest.GenerationConfig.builder().maxOutputTokens(8192).build()).build();}
    String chunk(String text,String reason,int tokens) {
        try {return "data:"+new ObjectMapper().writeValueAsString(Map.of("modelVersion","model","candidates",List.of(Map.of(
                "content",Map.of("parts",List.of(Map.of("text",text),Map.of("text","hidden","thought",true))),
                "finishReason",reason)),"usageMetadata",Map.of("candidatesTokenCount",tokens)))+"\n\n";}
        catch(Exception e){throw new RuntimeException(e);}
    }
    @Test void allPartsExactWhitespaceAndCumulativeUsage() {
        var client=mock(GeminiClient.class);var service=service(chunk("  Xin chào","",2)+chunk("\nXong. ","STOP",5),client);
        var deltas=new ArrayList<String>();var result=service.generateStream(request(),"id","translation",deltas::add,()->false);
        assertTrue(result.complete());assertEquals("  Xin chào\nXong. ",result.content());
        assertEquals(result.content(),String.join("",deltas));assertEquals(5,result.usageMetadata().getCandidatesTokenCount());
        verify(client,times(1)).streamGenerateContent(anyString(),any());
    }
    @Test void errorAfterTextNeverRetriesOrReportsComplete() {
        var client=mock(GeminiClient.class);var service=service(chunk("Một phần","",2)+"data:{\"error\":{\"code\":500}}\n\n",client);
        var result=service.generateStream(request(),"id","chat",text->{},()->false);
        assertFalse(result.complete());assertEquals("Một phần",result.content());
        verify(client,times(1)).streamGenerateContent(anyString(),any());
    }
    @Test void eofWithoutStopIsIncomplete() {
        var service=service(chunk("partial","",2),mock(GeminiClient.class));
        assertFalse(service.generateStream(request(),"id","grammar",text->{},()->false).complete());
    }
    @Test void stopCancelsBeforeProviderRequest() {
        var client=mock(GeminiClient.class);var service=new TutorGenerationService(client,new ObjectMapper());
        assertThrows(CancellationException.class,()->service.generateStream(request(),"id","chat",text->{},()->true));
        verifyNoInteractions(client);
    }
    @Test void liteRoutesLearningModesAndChatDeepAnalysisRoutesPrimary() {
        for(String mode:List.of("translation","sentence","grammar","vocabulary")) {
            var client=mock(GeminiClient.class);var service=service(chunk("Done.","STOP",3),client);service.liteEnabled=true;
            var request=request();service.generateStream(request,"id",mode,text->{},()->false);
            verify(client).streamGenerateContent(eq("gemini-3.5-flash-lite"),any());
            assertEquals("minimal",request.getGenerationConfig().getThinkingConfig().getThinkingLevel());
        }

        // Long prompt / deep analysis in chat mode routes to streamModel (primary)
        var client=mock(GeminiClient.class);var service=service(chunk("Done.","STOP",3),client);service.liteEnabled=true;
        var deepRequest=GeminiRequest.builder().contents(List.of(new GeminiRequest.Content("user",
                List.of(new GeminiRequest.Part("Phân tích sâu bài đọc hiểu Part 7 sau đây"))))).build();
        service.generateStream(deepRequest,"id","chat",text->{},()->false);
        verify(client).streamGenerateContent(eq("gemini-3.6-flash"),any());
    }

    @Test void fallbackTwoWaysLiteToPrimaryAndPrimaryToLite() throws Exception {
        // 1. Lite -> Primary fallback on 500 error
        var client=mock(GeminiClient.class);
        HttpResponse<InputStream> error500=mock(HttpResponse.class);
        when(error500.statusCode()).thenReturn(500);
        when(error500.body()).thenReturn(new ByteArrayInputStream("Internal Error".getBytes(StandardCharsets.UTF_8)));

        HttpResponse<InputStream> successPrimary=mock(HttpResponse.class);
        when(successPrimary.statusCode()).thenReturn(200);
        when(successPrimary.body()).thenReturn(bytes(chunk("Recovered by Primary","STOP",4)));

        when(client.streamGenerateContent(eq("gemini-3.5-flash-lite"),any()))
                .thenReturn(CompletableFuture.completedFuture(error500));
        when(client.streamGenerateContent(eq("gemini-3.6-flash"),any()))
                .thenReturn(CompletableFuture.completedFuture(successPrimary));

        var service=new TutorGenerationService(client,new ObjectMapper());
        service.retryDelayMs=0;
        var result=service.generateStream(request(),"id","translation",text->{},()->false);
        assertTrue(result.complete());
        assertEquals("Recovered by Primary",result.content());
        verify(client,atLeastOnce()).streamGenerateContent(eq("gemini-3.5-flash-lite"),any());
        verify(client,times(1)).streamGenerateContent(eq("gemini-3.6-flash"),any());

        // 2. Primary -> Lite fallback on 500 error
        var client2=mock(GeminiClient.class);
        when(client2.streamGenerateContent(eq("gemini-3.6-flash"),any()))
                .thenReturn(CompletableFuture.completedFuture(error500));
        HttpResponse<InputStream> successLite=mock(HttpResponse.class);
        when(successLite.statusCode()).thenReturn(200);
        when(successLite.body()).thenReturn(bytes(chunk("Recovered by Lite","STOP",4)));
        when(client2.streamGenerateContent(eq("gemini-3.5-flash-lite"),any()))
                .thenReturn(CompletableFuture.completedFuture(successLite));

        var service2=new TutorGenerationService(client2,new ObjectMapper());
        service2.retryDelayMs=0;
        var deepRequest=GeminiRequest.builder().contents(List.of(new GeminiRequest.Content("user",
                List.of(new GeminiRequest.Part("Phân tích sâu bài đọc hiểu Part 7"))))).build();
        var result2=service2.generateStream(deepRequest,"id","chat",text->{},()->false);
        assertTrue(result2.complete());
        assertEquals("Recovered by Lite",result2.content());
        verify(client2,atLeastOnce()).streamGenerateContent(eq("gemini-3.6-flash"),any());
        verify(client2,times(1)).streamGenerateContent(eq("gemini-3.5-flash-lite"),any());
    }

    @Test void dailyQuotaExhaustionDoesNotRetryInTurn() throws Exception {
        var client=mock(GeminiClient.class);
        HttpResponse<InputStream> daily429=mock(HttpResponse.class);
        when(daily429.statusCode()).thenReturn(429);
        when(daily429.body()).thenReturn(new ByteArrayInputStream(
                "{\"error\":{\"details\":[{\"violations\":[{\"quotaId\":\"GenerateRequestsPerDayPerProjectPerModel\"}]}]}}"
                .getBytes(StandardCharsets.UTF_8)));

        when(client.streamGenerateContent(eq("gemini-3.5-flash-lite"),any()))
                .thenReturn(CompletableFuture.completedFuture(daily429));
        HttpResponse<InputStream> successPrimary=mock(HttpResponse.class);
        when(successPrimary.statusCode()).thenReturn(200);
        when(successPrimary.body()).thenReturn(bytes(chunk("Primary Works","STOP",3)));
        when(client.streamGenerateContent(eq("gemini-3.6-flash"),any()))
                .thenReturn(CompletableFuture.completedFuture(successPrimary));

        var service=new TutorGenerationService(client,new ObjectMapper());
        service.retryDelayMs=0;
        var result=service.generateStream(request(),"id","translation",text->{},()->false);
        assertTrue(result.complete());
        assertEquals("Primary Works",result.content());
        verify(client,times(1)).streamGenerateContent(eq("gemini-3.5-flash-lite"),any());
        verify(client,times(1)).streamGenerateContent(eq("gemini-3.6-flash"),any());
    }
}
