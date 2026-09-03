package com.lela.auth;

import com.lela.auth.dto.AuthResponse;
import com.lela.common.exception.NotFoundExeception;
import com.lela.refreshtokensession.RefreshTokenSessionRepository;
import com.lela.refreshtokensession.domain.RefreshTokenSession;
import com.lela.role.RoleRepository;
import com.lela.role.domain.Role;
import com.lela.subscriptionplan.SubscriptionPlanRepository;
import com.lela.subscriptionplan.domain.SubscriptionPlan;
import com.lela.userroleassignment.UserRoleAssignmentRepository;
import com.lela.userroleassignment.domain.UserRoleAssignment;
import com.lela.userroleassignment.dto.UserRoleAssignmentId;
import com.lela.users.UsersRepository;
import com.lela.users.domain.UserStatus;
import com.lela.users.domain.Users;
import com.lela.usersubscription.UserSubscriptionRepository;
import com.lela.usersubscription.domain.UserSubscription;
import com.lela.usersubscription.domain.UserSubscriptionStatus;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UsersRepository usersRepository;
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final JwtService jwtService;
    private final RefreshTokenSessionRepository refreshTokenSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final OAuth2Service oauth2Service;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        if (email == null) {
            response.sendRedirect(frontendUrl + "/login?error=email_not_found");
            return;
        }

        // 1. Find or create user
        Users user = usersRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = Users.builder()
                    .username("google_" + UUID.randomUUID().toString().substring(0, 8))
                    .email(email)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .fullName(name != null ? name : "Google User")
                    .avatarUrl(picture)
                    .status(UserStatus.ACTIVE)
                    .timezone("UTC")
                    .dailyGoalCards(20)
                    .promptDailyGoal(true)
                    .xpTotal(0L)
                    .streakCurrent(0)
                    .streakLongest(0)
                    .build();
            user = usersRepository.save(user);

            Role role = roleRepository.findByRoleCode("LEARNER")
                    .orElseThrow(() -> new NotFoundExeception("Không tìm thấy vai trò mặc định LEARNER"));

            UserRoleAssignmentId assignmentId = new UserRoleAssignmentId(user.getId(), role.getId());
            UserRoleAssignment assignment = UserRoleAssignment.builder()
                    .id(assignmentId)
                    .user(user)
                    .role(role)
                    .build();
            userRoleAssignmentRepository.save(assignment);

            Optional<SubscriptionPlan> freePlanOpt = subscriptionPlanRepository.findFirstByPrice(BigDecimal.ZERO);
            if (freePlanOpt.isPresent()) {
                UserSubscription freeSubscription = new UserSubscription();
                freeSubscription.setUser(user);
                freeSubscription.setPlan(freePlanOpt.get());
                freeSubscription.setStatus(UserSubscriptionStatus.ACTIVE);
                freeSubscription.setStartedAt(LocalDateTime.now());
                freeSubscription.setAutoRenew(false);
                freeSubscription.setProvider("SYSTEM");
                userSubscriptionRepository.save(freeSubscription);
            }
        }

        // 2. Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        String tokenHash = hashToken(refreshToken);

        Instant expiresInstant = jwtService.extractExpiration(refreshToken);
        LocalDateTime expiresAt = expiresInstant != null
                ? LocalDateTime.ofInstant(expiresInstant, ZoneId.systemDefault())
                : LocalDateTime.now().plusDays(7);

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        RefreshTokenSession session = RefreshTokenSession.builder()
                .user(user)
                .tokenHash(tokenHash)
                .tokenFamilyId(UUID.randomUUID().toString())
                .deviceName(request.getHeader("User-Agent"))
                .ipAddress(ip)
                .userAgent(request.getHeader("User-Agent"))
                .expiresAt(expiresAt)
                .lastUsedAt(LocalDateTime.now())
                .build();
        refreshTokenSessionRepository.save(session);

        // 3. Build AuthResponse
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoleCodes())
                .timezone(user.getTimezone())
                .dailyGoalCards(user.getDailyGoalCards())
                .promptDailyGoal(user.getPromptDailyGoal() != null ? user.getPromptDailyGoal() : true)
                .nativeLanguageId(user.getNativeLanguage() != null ? user.getNativeLanguage().getId() : null)
                .targetLanguageId(user.getTargetLanguage() != null ? user.getTargetLanguage().getId() : null)
                .currentExamType(user.getCurrentExamType() != null ? toExamTypeDto(user.getCurrentExamType()) : null)
                .currentLevel(user.getCurrentLevel() != null ? toLevelDto(user.getCurrentLevel()) : null)
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();

        // 4. Cache it and get code
        String exchangeCode = oauth2Service.cacheAuthResponse(authResponse);

        // 5. Redirect to frontend with exchange code
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/oauth2/redirect?code=" + exchangeCode);
    }

    private ExamTypeDTO toExamTypeDto(com.lela.common.domain.ExamType examType) {
        if (examType == null) return null;
        ExamTypeDTO dto = new ExamTypeDTO();
        dto.setId(examType.getId());
        dto.setCode(examType.getCode());
        dto.setName(examType.getName());
        dto.setMaxScaleScore(examType.getMaxScaleScore());
        return dto;
    }

    private ProficiencyLevelDTO toLevelDto(com.lela.common.domain.ProficiencyLevel level) {
        if (level == null) return null;
        ProficiencyLevelDTO dto = new ProficiencyLevelDTO();
        dto.setId(level.getId());
        dto.setExamTypeId(level.getExamType() != null ? level.getExamType().getId() : null);
        dto.setCode(level.getCode());
        dto.setName(level.getName());
        dto.setMinScore(level.getMinScore());
        dto.setMaxScore(level.getMaxScore());
        dto.setDisplayOrder(level.getDisplayOrder());
        return dto;
    }

    private String hashToken(String token) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi băm token", e);
        }
    }
}
