package com.lela.ai.service;
import com.lela.ai.controller.AiController;
import com.lela.ai.dto.AiChatResponse;
import com.lela.ai.prompt.LearningContextBuilder;
import com.lela.users.UsersRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AiControllerFormatTest {
    @Test void jsonClientReceivesCompletionMetadata() throws Exception {
        var service=mock(AiService.class);
        when(service.chat(any())).thenReturn(new AiChatResponse("Xin chào.\nĐã xong.","STOP",true,"model",null,null,"id"));
        var mvc=MockMvcBuilders.standaloneSetup(new AiController(service,mock(LearningContextBuilder.class),mock(UsersRepository.class))).build();
        mvc.perform(post("/ai/chat").contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON).content("{\"message\":\"Hello\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.complete").value(true)).andExpect(jsonPath("$.data.finishReason").value("STOP"));
    }
    @Test void existingMobileSseClientReceivesOneFullAnswer() throws Exception {
        var service=mock(AiService.class);
        when(service.chat(any())).thenReturn(new AiChatResponse("Xin chào.\nĐã xong.","STOP",true,"model",null,null,"id"));
        var mvc=MockMvcBuilders.standaloneSetup(new AiController(service,mock(LearningContextBuilder.class),mock(UsersRepository.class))).build();
        mvc.perform(post("/ai/chat").contentType(MediaType.APPLICATION_JSON).accept(MediaType.TEXT_EVENT_STREAM).content("{\"message\":\"Hello\"}"))
                .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andExpect(content().string("event:message\ndata:Xin chào.\ndata:Đã xong.\n\n"));
    }
    @Test void incompleteMobileAnswerIsAnErrorNotACompletedEvent() throws Exception {
        var service=mock(AiService.class);
        when(service.chat(any())).thenReturn(new AiChatResponse("Partial","MAX_TOKENS",false,"model",null,"AI_TRUNCATED","id"));
        var mvc=MockMvcBuilders.standaloneSetup(new AiController(service,mock(LearningContextBuilder.class),mock(UsersRepository.class))).build();
        mvc.perform(post("/ai/chat").contentType(MediaType.APPLICATION_JSON).accept(MediaType.TEXT_EVENT_STREAM).content("{\"message\":\"Hello\"}"))
                .andExpect(status().isServiceUnavailable()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Partial"))));
    }
}
