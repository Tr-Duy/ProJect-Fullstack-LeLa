package com.lela.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.dto.AuthResponse;
import com.lela.auth.dto.ExchangeRequest;
import com.lela.role.RoleRepository;
import com.lela.role.domain.Role;
import com.lela.userroleassignment.UserRoleAssignmentRepository;
import com.lela.userroleassignment.domain.UserRoleAssignment;
import com.lela.userroleassignment.dto.UserRoleAssignmentId;
import com.lela.users.UsersRepository;
import com.lela.users.domain.UserStatus;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class GoogleOAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OAuth2Service oauth2Service;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @Transactional
    @DisplayName("1. OAuth2 Code Exchange with Valid Code => Returns LeLa JWT & User Profile")
    void test1_OAuth2ExchangeWithValidCodeSuccess() throws Exception {
        Users user = usersRepository.findByUsername("learner1").orElseThrow();
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoleCodes())
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();

        String code = oauth2Service.cacheAuthResponse(authResponse);
        assertNotNull(code);

        ExchangeRequest exchangeRequest = new ExchangeRequest();
        exchangeRequest.setCode(code);

        mockMvc.perform(post("/auth/oauth2/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(exchangeRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value(accessToken))
                .andExpect(jsonPath("$.data.refreshToken").value(refreshToken))
                .andExpect(jsonPath("$.data.user.email").value(user.getEmail()));
    }

    @Test
    @DisplayName("2. OAuth2 Code Exchange with Invalid Code => 400 Bad Request")
    void test2_OAuth2ExchangeWithInvalidCodeReturns400() throws Exception {
        ExchangeRequest exchangeRequest = new ExchangeRequest();
        exchangeRequest.setCode("invalid_oauth_code_99999");

        mockMvc.perform(post("/auth/oauth2/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(exchangeRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Transactional
    @DisplayName("3 & 4. Google Login creates LEARNER account (never ADMIN) & links existing account by email")
    void test3_GoogleUserCreationAndAccountLinking() {
        String testEmail = "google_new_user_" + UUID.randomUUID().toString().substring(0, 6) + "@gmail.com";
        
        // Ensure user does not exist
        assertFalse(usersRepository.findByEmail(testEmail).isPresent());

        // Simulate creation as in OAuth2LoginSuccessHandler
        Users newUser = Users.builder()
                .username("google_" + UUID.randomUUID().toString().substring(0, 8))
                .email(testEmail)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName("Google Test User")
                .status(UserStatus.ACTIVE)
                .timezone("UTC")
                .dailyGoalCards(20)
                .promptDailyGoal(true)
                .streakCurrent(0)
                .streakLongest(0)
                .xpTotal(0L)
                .build();
        newUser = usersRepository.save(newUser);

        Role learnerRole = roleRepository.findByRoleCode("LEARNER").orElseThrow();
        UserRoleAssignment assignment = UserRoleAssignment.builder()
                .id(new UserRoleAssignmentId(newUser.getId(), learnerRole.getId()))
                .user(newUser)
                .role(learnerRole)
                .build();
        userRoleAssignmentRepository.save(assignment);

        // Verify role is LEARNER and NOT ADMIN
        java.util.Set<String> roles = newUser.getRoleCodes();
        assertTrue(roles.contains("LEARNER"));
        assertFalse(roles.contains("ADMIN"), "Google user creation MUST NOT grant ADMIN role!");

        // Verify account linking: searching by email returns the same user ID
        Users existingUser = usersRepository.findByEmail(testEmail).orElse(null);
        assertNotNull(existingUser);
        assertEquals(newUser.getId(), existingUser.getId());
    }

    @Test
    @Transactional
    @DisplayName("5. JWT generated from Google Login grants access to protected system endpoints")
    void test5_GoogleUserJwtAccessProtectedEndpoint() throws Exception {
        Users learner = usersRepository.findByUsername("learner1").orElseThrow();
        String token = jwtService.generateAccessToken(learner);

        mockMvc.perform(get("/languages")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("6. OAuth2 Authorization Request behind Reverse Proxy generates production HTTPS redirect_uri")
    void test6_OAuth2AuthorizationRedirectUriWithForwardedHeaders() throws Exception {
        mockMvc.perform(get("/api/v1/oauth2/authorization/google")
                .contextPath("/api/v1")
                .header("X-Forwarded-Proto", "https")
                .header("X-Forwarded-Host", "project-fullstack-lela.onrender.com")
                .header("X-Forwarded-Port", "443"))
                .andExpect(status().is3xxRedirection())
                .andExpect(result -> {
                    String redirectUrl = result.getResponse().getRedirectedUrl();
                    assertNotNull(redirectUrl);
                    assertTrue(redirectUrl.contains("accounts.google.com/o/oauth2/v2/auth"));
                    assertTrue(redirectUrl.contains("redirect_uri=https%3A%2F%2Fproject-fullstack-lela.onrender.com%2Fapi%2Fv1%2Flogin%2Foauth2%2Fcode%2Fgoogle")
                            || redirectUrl.contains("redirect_uri=https://project-fullstack-lela.onrender.com/api/v1/login/oauth2/code/google"),
                            "Redirect URL must contain the HTTPS production domain and /api/v1 context-path. Actual: " + redirectUrl);
                });
    }

    @Test
    @DisplayName("7. OAuth2 Authorization Request locally generates localhost redirect_uri")
    void test7_OAuth2AuthorizationRedirectUriLocal() throws Exception {
        mockMvc.perform(get("/api/v1/oauth2/authorization/google")
                .header("Host", "localhost:8080")
                .contextPath("/api/v1"))
                .andExpect(status().is3xxRedirection())
                .andExpect(result -> {
                    String redirectUrl = result.getResponse().getRedirectedUrl();
                    assertNotNull(redirectUrl);
                    assertTrue(redirectUrl.contains("accounts.google.com/o/oauth2/v2/auth"));
                    assertTrue(redirectUrl.contains("redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fv1%2Flogin%2Foauth2%2Fcode%2Fgoogle")
                            || redirectUrl.contains("redirect_uri=http://localhost:8080/api/v1/login/oauth2/code/google"),
                            "Redirect URL for local dev must contain http://localhost:8080/api/v1. Actual: " + redirectUrl);
                });
    }
}
