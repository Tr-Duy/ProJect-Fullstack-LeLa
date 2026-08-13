package com.lela.auth;

import com.lela.common.ApiResponse;
import com.lela.common.exception.BadRequestException;
import com.lela.common.exception.NotFoundExeception;
import com.lela.role.domain.Role;
import com.lela.role.RoleRepository;
import com.lela.auth.dto.AuthResponse;
import com.lela.auth.dto.LoginRequest;
import com.lela.auth.dto.RefreshTokenRequest;
import com.lela.auth.dto.RegisterRequest;
import com.lela.auth.dto.ExchangeRequest;
import com.lela.userroleassignment.domain.UserRoleAssignment;
import com.lela.userroleassignment.UserRoleAssignmentRepository;
import com.lela.userroleassignment.dto.UserRoleAssignmentId;
import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import com.lela.users.domain.UserStatus;
import com.lela.refreshtokensession.domain.RefreshTokenSession;
import com.lela.refreshtokensession.RefreshTokenSessionRepository;
import com.lela.language.domain.Language;
import com.lela.language.LanguageRepository;
import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;
import com.lela.auth.dto.ProfileUpdateRequest;
import com.lela.subscriptionplan.domain.SubscriptionPlan;
import com.lela.subscriptionplan.SubscriptionPlanRepository;
import com.lela.usersubscription.domain.UserSubscription;
import com.lela.usersubscription.domain.UserSubscriptionStatus;
import com.lela.usersubscription.UserSubscriptionRepository;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.PatchMapping;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Các API xác thực: đăng ký, đăng nhập, đăng xuất, và làm mới token")
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;
        private final UsersRepository usersRepository;
        private final RoleRepository roleRepository;
        private final UserRoleAssignmentRepository userRoleAssignmentRepository;
        private final RefreshTokenSessionRepository refreshTokenSessionRepository;
        private final PasswordEncoder passwordEncoder;
        private final LanguageRepository languageRepository;
        private final SubscriptionPlanRepository subscriptionPlanRepository;
        private final UserSubscriptionRepository userSubscriptionRepository;
        private final OAuth2Service oauth2Service;

        @GetMapping("/check-username")
        @Operation(summary = "Kiểm tra tồn tại Tên đăng nhập", description = "Trả về true nếu tên đăng nhập đã được sử dụng.")
        public ResponseEntity<ApiResponse<Boolean>> checkUsername(
                        @org.springframework.web.bind.annotation.RequestParam String username) {
                boolean exists = usersRepository.existsByUsername(username);
                return ResponseEntity.ok(ApiResponse.success(exists, "Kiểm tra thành công"));
        }

        @GetMapping("/check-email")
        @Operation(summary = "Kiểm tra tồn tại Email", description = "Trả về true nếu email đã được sử dụng.")
        public ResponseEntity<ApiResponse<Boolean>> checkEmail(
                        @org.springframework.web.bind.annotation.RequestParam String email) {
                boolean exists = usersRepository.existsByEmail(email);
                return ResponseEntity.ok(ApiResponse.success(exists, "Kiểm tra thành công"));
        }

        @PostMapping("/register")
        @Transactional
        @Operation(summary = "Đăng ký tài khoản", description = "Tạo tài khoản người dùng mới và gán vai trò mặc định LEARNER.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng ký thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Yêu cầu không hợp lệ hoặc tên đăng nhập/email đã được sử dụng")
        })
        public ResponseEntity<ApiResponse<Void>> register(@RequestBody @Valid RegisterRequest request) {
                if (usersRepository.existsByUsername(request.getUsername())) {
                        throw new BadRequestException("Tên đăng nhập đã được sử dụng");
                }
                if (usersRepository.existsByEmail(request.getEmail())) {
                        throw new BadRequestException("Email đã được đăng ký");
                }

                Language nativeLang = null;
                if (request.getNativeLanguageId() != null) {
                        nativeLang = languageRepository.findById(request.getNativeLanguageId()).orElse(null);
                }

                Language targetLang = null;
                if (request.getTargetLanguageId() != null) {
                        targetLang = languageRepository.findById(request.getTargetLanguageId()).orElse(null);
                }

                Users user = Users.builder()
                                .username(request.getUsername())
                                .email(request.getEmail())
                                .passwordHash(passwordEncoder.encode(request.getPassword()))
                                .fullName(request.getFullName())
                                .status(UserStatus.ACTIVE)
                                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                                .dailyGoalCards(request.getDailyGoalCards() != null ? request.getDailyGoalCards() : 20)
                                .promptDailyGoal(true)
                                .nativeLanguage(nativeLang)
                                .targetLanguage(targetLang)
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

                // Assign default free plan
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

                return ResponseEntity.ok(ApiResponse.successMessage("Đăng ký thành công"));
        }

        @PostMapping("/login")
        @Transactional
        @Operation(summary = "Đăng nhập người dùng", description = "Xác thực tài khoản và trả về cặp access token, refresh token.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng nhập thành công", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Tên đăng nhập/email hoặc mật khẩu không chính xác")
        })
        public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid LoginRequest loginRequest,
                        HttpServletRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequest.getUsernameOrEmail(),
                                                loginRequest.getPassword()));

                Users user = usersRepository.findByUsername(loginRequest.getUsernameOrEmail())
                                .or(() -> usersRepository.findByEmail(loginRequest.getUsernameOrEmail()))
                                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy người dùng"));

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
                                .nativeLanguageId(user.getNativeLanguage() != null ? user.getNativeLanguage().getId()
                                                : null)
                                .targetLanguageId(user.getTargetLanguage() != null ? user.getTargetLanguage().getId()
                                                : null)
                                .build();

                AuthResponse authResponse = AuthResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .user(buildUserInfo(user))
                                .build();

                return ResponseEntity.ok(ApiResponse.success(authResponse, "Đăng nhập thành công"));
        }

        private AuthResponse.UserInfo buildUserInfo(Users user) {
                return AuthResponse.UserInfo.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .avatarUrl(user.getAvatarUrl())
                                .roles(user.getRoleCodes())
                                .timezone(user.getTimezone())
                                .dailyGoalCards(user.getDailyGoalCards())
                                .promptDailyGoal(user.getPromptDailyGoal() != null ? user.getPromptDailyGoal() : true)
                                .nativeLanguageId(user.getNativeLanguage() != null ? user.getNativeLanguage().getId()
                                                : null)
                                .targetLanguageId(user.getTargetLanguage() != null ? user.getTargetLanguage().getId()
                                                : null)
                                .currentExamType(user.getCurrentExamType() != null
                                                ? toExamTypeDto(user.getCurrentExamType())
                                                : null)
                                .currentLevel(user.getCurrentLevel() != null ? toLevelDto(user.getCurrentLevel())
                                                : null)
                                .build();
        }

        private ExamTypeDTO toExamTypeDto(com.lela.common.domain.ExamType examType) {
                ExamTypeDTO dto = new ExamTypeDTO();
                dto.setId(examType.getId());
                dto.setCode(examType.getCode());
                dto.setName(examType.getName());
                dto.setMaxScaleScore(examType.getMaxScaleScore());
                return dto;
        }

        private ProficiencyLevelDTO toLevelDto(com.lela.common.domain.ProficiencyLevel level) {
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

        @PostMapping("/refresh-token")
        @Transactional
        @Operation(summary = "Làm mới access token", description = "Cấp access token mới khi refresh token còn hiệu lực.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Làm mới token thành công", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Refresh token không hợp lệ, hết hạn hoặc đã bị thu hồi")
        })
        public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
                        @RequestBody @Valid RefreshTokenRequest refreshRequest) {
                String refreshToken = refreshRequest.getRefreshToken();
                if (refreshToken == null || !jwtService.isRefreshToken(refreshToken)) {
                        throw new BadRequestException("Định dạng refresh token không hợp lệ");
                }

                String tokenHash = hashToken(refreshToken);
                RefreshTokenSession session = refreshTokenSessionRepository.findByTokenHash(tokenHash)
                                .orElseThrow(() -> new BadRequestException(
                                                "Không tìm thấy phiên làm việc của refresh token"));

                if (session.getRevokedAt() != null) {
                        throw new BadRequestException("Refresh token đã bị thu hồi");
                }
                if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
                        throw new BadRequestException("Refresh token đã hết hạn");
                }

                Users user = session.getUser();
                String newAccessToken = jwtService.generateAccessToken(user);

                session.setLastUsedAt(LocalDateTime.now());
                refreshTokenSessionRepository.save(session);

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
                                .nativeLanguageId(user.getNativeLanguage() != null ? user.getNativeLanguage().getId()
                                                : null)
                                .targetLanguageId(user.getTargetLanguage() != null ? user.getTargetLanguage().getId()
                                                : null)
                                .build();

                AuthResponse authResponse = AuthResponse.builder()
                                .accessToken(newAccessToken)
                                .refreshToken(refreshToken)
                                .user(buildUserInfo(user))
                                .build();

                return ResponseEntity.ok(ApiResponse.success(authResponse, "Làm mới token thành công"));
        }

        @PostMapping("/oauth2/exchange")
        @Transactional(readOnly = true)
        @Operation(summary = "Đổi mã xác thực OAuth2", description = "Đổi mã xác thực một lần lấy AuthResponse")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đổi mã thành công", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Mã xác thực không hợp lệ hoặc đã hết hạn")
        })
        public ResponseEntity<ApiResponse<AuthResponse>> exchangeOAuth2Code(
                        @RequestBody @Valid ExchangeRequest request) {
                AuthResponse authResponse = oauth2Service.exchangeCode(request.getCode());
                if (authResponse == null) {
                        throw new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn");
                }
                return ResponseEntity.ok(ApiResponse.success(authResponse, "Đăng nhập Google thành công"));
        }

        @PostMapping("/logout")
        @Transactional
        @Operation(summary = "Đăng xuất", description = "Hủy phiên làm việc của refresh token để chặn yêu cầu cấp lại token mới.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đăng xuất thành công")
        })
        public ResponseEntity<ApiResponse<Void>> logout(@RequestBody @Valid RefreshTokenRequest logoutRequest) {
                String refreshToken = logoutRequest.getRefreshToken();
                String tokenHash = hashToken(refreshToken);
                Optional<RefreshTokenSession> sessionOpt = refreshTokenSessionRepository.findByTokenHash(tokenHash);

                if (sessionOpt.isPresent()) {
                        RefreshTokenSession session = sessionOpt.get();
                        session.setRevokedAt(LocalDateTime.now());
                        session.setRevokeReason("Đã đăng xuất");
                        refreshTokenSessionRepository.save(session);
                }

                return ResponseEntity.ok(ApiResponse.successMessage("Đăng xuất thành công"));
        }

        @GetMapping("/profile")
        @Transactional(readOnly = true)
        @Operation(summary = "Lấy thông tin cá nhân", description = "Lấy thông tin tài khoản đang đăng nhập hiện tại (yêu cầu access token hợp lệ).")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy thông tin cá nhân thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực - access token không hợp lệ hoặc bị thiếu")
        })
        public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getProfile(Authentication authentication) {
                if (authentication == null) {
                        return ResponseEntity.status(401).build();
                }
                String username = authentication.getName();
                Users user = usersRepository.findByUsername(username)
                                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy người dùng"));
                return ResponseEntity.ok(ApiResponse.success(buildUserInfo(user), "Lấy thông tin cá nhân thành công"));
        }

        @PatchMapping("/profile")
        @Transactional
        @Operation(summary = "Cập nhật thông tin cá nhân", description = "Cập nhật các thông tin của tài khoản đang đăng nhập.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật thông tin cá nhân thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực - access token không hợp lệ hoặc bị thiếu")
        })
        public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> updateProfile(Authentication authentication,
                        @RequestBody @Valid ProfileUpdateRequest request) {
                if (authentication == null) {
                        return ResponseEntity.status(401).build();
                }
                String username = authentication.getName();
                Users user = usersRepository.findByUsername(username)
                                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy người dùng"));

                if (request.getFullName() != null)
                        user.setFullName(request.getFullName());
                if (request.getAvatarUrl() != null)
                        user.setAvatarUrl(request.getAvatarUrl());
                if (request.getTimezone() != null)
                        user.setTimezone(request.getTimezone());
                if (request.getDailyGoalCards() != null)
                        user.setDailyGoalCards(request.getDailyGoalCards());

                if (request.getNativeLanguageId() != null) {
                        user.setNativeLanguage(languageRepository.findById(request.getNativeLanguageId()).orElse(null));
                }
                if (request.getTargetLanguageId() != null) {
                        user.setTargetLanguage(languageRepository.findById(request.getTargetLanguageId()).orElse(null));
                }
                if (request.getPromptDailyGoal() != null) {
                        user.setPromptDailyGoal(request.getPromptDailyGoal());
                }

                usersRepository.save(user);

                return ResponseEntity
                                .ok(ApiResponse.success(buildUserInfo(user), "Cập nhật thông tin cá nhân thành công"));
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
