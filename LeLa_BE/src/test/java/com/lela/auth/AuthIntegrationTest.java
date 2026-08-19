package com.lela.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.dto.LoginRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("A. Verify project PasswordEncoder matches 123456 hash")
    void testA_BCryptPasswordEncoderVerification() {
        String rawPassword = "123456";
        String generatedHash = passwordEncoder.encode(rawPassword);
        
        assertNotNull(generatedHash, "Generated hash must not be null");
        assertTrue(passwordEncoder.matches(rawPassword, generatedHash), 
                "passwordEncoder.matches('123456', generatedHash) MUST be true");
    }

    @Test
    @DisplayName("B1. Admin login with correct password (123456) => SUCCESS")
    void testB1_AdminLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail("admin");
        request.setPassword("123456");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.user.username").value("admin"))
                .andExpect(jsonPath("$.data.user.roles[0]").value("ADMIN"));
    }

    @Test
    @DisplayName("B2. Admin login with wrong password => FAILURE")
    void testB2_AdminLoginWrongPasswordFailure() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail("admin");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C. Learner login with correct password (123456) => SUCCESS")
    void testC_LearnerLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail("learner1");
        request.setPassword("123456");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.user.username").value("learner1"));
    }

    @Test
    @DisplayName("D. Verify UserDetails Authorities for Admin and Learner")
    void testD_AuthoritiesVerification() {
        UserDetails adminDetails = customUserDetailsService.loadUserByUsername("admin");
        Collection<? extends GrantedAuthority> adminAuthorities = adminDetails.getAuthorities();
        boolean hasAdminRole = adminAuthorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        assertTrue(hasAdminRole, "Admin user must have ROLE_ADMIN authority");

        UserDetails learnerDetails = customUserDetailsService.loadUserByUsername("learner1");
        Collection<? extends GrantedAuthority> learnerAuthorities = learnerDetails.getAuthorities();
        boolean learnerHasAdminRole = learnerAuthorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean learnerHasLearnerRole = learnerAuthorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LEARNER"));
        
        assertFalse(learnerHasAdminRole, "Learner user must NOT have ROLE_ADMIN authority");
        assertTrue(learnerHasLearnerRole, "Learner user must have ROLE_LEARNER authority");
    }

    @Test
    @DisplayName("E. Verify Authorization for Guest, Learner, and Admin on /admin/metrics")
    void testE_AuthorizationVerification() throws Exception {
        // 1. Guest request to protected admin API => Blocked (401 or 403)
        mockMvc.perform(get("/admin/metrics"))
                .andExpect(status().is4xxClientError());

        // 2. Obtain Learner Access Token
        LoginRequest learnerLogin = new LoginRequest();
        learnerLogin.setUsernameOrEmail("learner1");
        learnerLogin.setPassword("123456");
        MvcResult learnerResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(learnerLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String learnerJson = learnerResult.getResponse().getContentAsString();
        String learnerToken = objectMapper.readTree(learnerJson).get("data").get("accessToken").asText();

        // Learner accessing admin API => 403 Forbidden
        mockMvc.perform(get("/admin/metrics")
                .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden());

        // 3. Obtain Admin Access Token
        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsernameOrEmail("admin");
        adminLogin.setPassword("123456");
        MvcResult adminResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String adminJson = adminResult.getResponse().getContentAsString();
        String adminToken = objectMapper.readTree(adminJson).get("data").get("accessToken").asText();

        // Admin accessing admin API => 200 OK
        mockMvc.perform(get("/admin/metrics")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
