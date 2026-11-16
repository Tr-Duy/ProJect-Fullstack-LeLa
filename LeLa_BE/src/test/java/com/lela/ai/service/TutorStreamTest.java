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
    @Test void liteOnlyForShortTranslationAndCorrection() {
        for(String mode:List.of("translation","sentence","chat","grammar")) {
            var client=mock(GeminiClient.class);var service=service(chunk("Done.","STOP",3),client);service.liteEnabled=true;
            var request=request();service.generateStream(request,"id",mode,text->{},()->false);
            verify(client).streamGenerateContent(eq(Set.of("translation","sentence").contains(mode)?"gemini-3.5-flash-lite":"gemini-3.6-flash"),any());
            assertEquals("minimal",request.getGenerationConfig().getThinkingConfig().getThinkingLevel());
        }
    }
}
