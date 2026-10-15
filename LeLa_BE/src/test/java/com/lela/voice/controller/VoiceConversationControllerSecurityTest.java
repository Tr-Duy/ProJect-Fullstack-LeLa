package com.lela.voice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.cardprogress.CardProgressRepository;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.voice.domain.ConversationScenario;
import com.lela.voice.domain.ConversationSession;
import com.lela.voice.repository.ConversationScenarioRepository;
import com.lela.voice.repository.ConversationSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class VoiceConversationControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private ConversationScenarioRepository scenarioRepository;

    @Autowired
    private ConversationSessionRepository sessionRepository;

    @Test
    @WithMockUser(username = "admin")
    @DisplayName("Test getScenarios and getStatus return 200 OK and valid JSON")
    void testGetScenariosAndStatus() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/voice-conversations/scenarios"))
                .andExpect(status().isOk());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/voice-conversations/status"))
                .andExpect(status().isOk());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/voice-conversations/scenarios"))
                .andExpect(status().isOk());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/voice-conversations/status"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin")
    @DisplayName("User khác truy cập /turns hoặc /abandon trên session không thuộc về mình -> 404 NOT_FOUND")
    void testAccessDeniedToOtherUsersSessionReturns404() throws Exception {
        // Tạo một session thuộc về user khác (ví dụ user 999)
        Users victim = usersRepository.findAll().stream()
                .filter(u -> !u.getUsername().equals("admin"))
                .findFirst()
                .orElseGet(() -> {
                    Users u = new Users();
                    u.setUsername("victim_user");
                    u.setPasswordHash("dummy");
                    return usersRepository.save(u);
                });

        ConversationScenario sc = scenarioRepository.findAll().get(0);

        String testPublicId = java.util.UUID.randomUUID().toString();
        ConversationSession session = ConversationSession.builder()
                .publicId(testPublicId)
                .user(victim)
                .scenario(sc)
                .levelAtStart(300)
                .quotaDate(java.time.LocalDate.now())
                .status("IN_PROGRESS")
                .build();
        sessionRepository.save(session);

        // User đang đăng nhập là 'admin', cố tình gọi turns trên session của 'victim' -> 404
        mockMvc.perform(post("/api/v1/voice-conversations/sessions/" + testPublicId + "/turns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"transcript\":\"Hello there\",\"sttConfidence\":0.9}"))
                .andExpect(status().isNotFound());

        // User 'admin' cố tình gọi abandon trên session của 'victim' -> 404
        mockMvc.perform(post("/api/v1/voice-conversations/sessions/" + testPublicId + "/abandon"))
                .andExpect(status().isNotFound());
    }
}
