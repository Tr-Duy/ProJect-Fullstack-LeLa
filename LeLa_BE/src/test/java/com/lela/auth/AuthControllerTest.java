package com.lela.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.dto.LoginRequest;
import com.lela.auth.dto.RefreshTokenRequest;
import com.lela.auth.dto.RegisterRequest;
import com.lela.refreshtokensession.RefreshTokenSessionRepository;
import com.lela.refreshtokensession.domain.RefreshTokenSession;
import com.lela.role.RoleRepository;
import com.lela.role.domain.Role;
import com.lela.userroleassignment.UserRoleAssignmentRepository;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for basic unit testing
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthenticationManager authenticationManager;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UsersRepository usersRepository;

    @MockitoBean
    private RoleRepository roleRepository;

    @MockitoBean
    private UserRoleAssignmentRepository userRoleAssignmentRepository;

    @MockitoBean
    private RefreshTokenSessionRepository refreshTokenSessionRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private com.lela.language.LanguageRepository languageRepository;

    @MockitoBean
    private com.lela.subscriptionplan.SubscriptionPlanRepository subscriptionPlanRepository;

    @MockitoBean
    private com.lela.usersubscription.UserSubscriptionRepository userSubscriptionRepository;

    @MockitoBean
    private OAuth2Service oauth2Service;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    private Users testUser;

    @BeforeEach
    void setUp() {
        testUser = Users.builder()
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hashedpassword")
                .fullName("Test User")
                .build();
        testUser.setId(1L);
    }

    @Test
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("Password123!");
        request.setFullName("New User");

        Mockito.when(usersRepository.existsByUsername(request.getUsername())).thenReturn(false);
        Mockito.when(usersRepository.existsByEmail(request.getEmail())).thenReturn(false);
        
        Mockito.when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed");
        
        Mockito.when(usersRepository.save(any(Users.class))).thenAnswer(i -> {
            Users u = i.getArgument(0);
            u.setId(1L);
            return u;
        });

        Role role = new Role();
        role.setId(1L);
        role.setRoleCode("LEARNER");
        Mockito.when(roleRepository.findByRoleCode("LEARNER")).thenReturn(Optional.of(role));

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng ký thành công"));
    }

    @Test
    void register_UsernameExists_ThrowsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existinguser");
        request.setEmail("new@example.com");
        request.setPassword("Password123!");
        request.setFullName("New User");

        Mockito.when(usersRepository.existsByUsername(request.getUsername())).thenReturn(true);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tên đăng nhập đã được sử dụng"));
    }

    @Test
    void login_Success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail("testuser");
        request.setPassword("Password123!");

        Mockito.when(usersRepository.findByUsername(request.getUsernameOrEmail())).thenReturn(Optional.of(testUser));
        Mockito.when(jwtService.generateAccessToken(testUser)).thenReturn("access-token");
        Mockito.when(jwtService.generateRefreshToken(testUser)).thenReturn("refresh-token");
        Mockito.when(jwtService.extractExpiration("refresh-token")).thenReturn(Instant.now().plusSeconds(3600));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng nhập thành công"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"));
    }

    @Test
    void refreshToken_Success() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("valid-refresh-token");

        Mockito.when(jwtService.isRefreshToken(request.getRefreshToken())).thenReturn(true);
        
        RefreshTokenSession session = RefreshTokenSession.builder()
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();
        
        Mockito.when(refreshTokenSessionRepository.findByTokenHash(any(String.class)))
                .thenReturn(Optional.of(session));
        
        Mockito.when(jwtService.generateAccessToken(testUser)).thenReturn("new-access-token");

        mockMvc.perform(post("/auth/refresh-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Làm mới token thành công"))
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("valid-refresh-token"));
    }
}
