package com.lela.ai.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.*;
import com.lela.ai.prompt.*;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.chat.*;
import com.lela.chat.domain.ChatConversation;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class AiServiceImplTest {
    TutorGenerationService generator; ChatMessageRepository messages; AiServiceImpl service;
    @BeforeEach void setup() {
        generator=mock(TutorGenerationService.class);messages=mock(ChatMessageRepository.class);
        var contexts=mock(LearningContextBuilder.class);var users=mock(UsersRepository.class);
        var conversations=mock(ChatConversationRepository.class);var user=new Users();user.setId(7L);
        when(users.findByUsername("learner")).thenReturn(Optional.of(user));
        when(contexts.buildContextObjectForUser(user)).thenReturn(new AiContextDto());
        when(conversations.findFirstByUserIdAndChannelTypeAndStatusOrderByCreatedAtDesc(anyLong(),anyString(),any()))
                .thenReturn(Optional.of(new ChatConversation()));
        service=new AiServiceImpl(mock(PromptValidator.class),new SystemPromptBuilder(),contexts,generator,users,new ObjectMapper(),conversations,messages);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("learner",null));
    }
    @AfterEach void clear(){SecurityContextHolder.clearContext();}
    AiChatRequest request(){var r=new AiChatRequest();r.setMessage("Tôi nên ôn gì?");r.setClientMessageId("same-turn");return r;}
    @Test void duplicateTurnUsesOneGenerationAndOneHistoryPair() {
        when(generator.generate(any(),any())).thenReturn(new AiChatResponse("Đã xong.","STOP",true,"model",null,null,"id"));
        assertEquals(service.chat(request()),service.chat(request()));
        verify(generator,times(1)).generate(any(),any());verify(messages,times(1)).saveAll(any());
        var capture=org.mockito.ArgumentCaptor.forClass(GeminiRequest.class);verify(generator).generate(capture.capture(),any());
        assertEquals(8192,capture.getValue().getGenerationConfig().getMaxOutputTokens());
    }
    @Test void incompleteAnswerIsNotPersistedAndCanRetrySameTurn() {
        when(generator.generate(any(),any())).thenReturn(new AiChatResponse("Một phần","MAX_TOKENS",false,"model",null,"AI_TRUNCATED","id"));
        assertFalse(service.chat(request()).complete());assertFalse(service.chat(request()).complete());
        verify(generator,times(2)).generate(any(),any());verifyNoInteractions(messages);
    }
    @Test void sameIdWithDifferentTextIsRejected() {
        when(generator.generate(any(),any())).thenReturn(new AiChatResponse("Đã xong.","STOP",true,"model",null,null,"id"));
        service.chat(request());var changed=request();changed.setMessage("Khác");
        assertThrows(com.lela.ai.exception.AiException.class,()->service.chat(changed));
    }
}
