package com.lela.config;

import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.users.domain.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductionSeedAccountSecurityRunnerTest {

    @Mock
    private UsersRepository usersRepository;

    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
    }

    @Test
    @DisplayName("Prod: Vô hiệu hóa learner1 nếu vẫn dùng mật khẩu mặc định 123456")
    void shouldDeactivateLearnerAccountWhenUsingDefaultPassword() {
        Users learner1 = new Users();
        learner1.setUsername("learner1");
        learner1.setStatus(UserStatus.ACTIVE);
        learner1.setPasswordHash(ProductionSeedAccountSecurityRunner.V31_DEFAULT_HASH);

        when(usersRepository.findByUsername("learner1")).thenReturn(Optional.of(learner1));
        when(usersRepository.findByUsername("learner2")).thenReturn(Optional.empty());

        ProductionSeedAccountSecurityRunner runner = new ProductionSeedAccountSecurityRunner(
                usersRepository, passwordEncoder, null
        );

        runner.secureLearnerSeedAccounts();

        assertThat(learner1.getStatus()).isEqualTo(UserStatus.DEACTIVATED);
        assertThat(learner1.getPasswordHash()).startsWith("DISABLED_");
        verify(usersRepository).save(learner1);
    }

    @Test
    @DisplayName("Prod: KHÔNG vô hiệu hóa learner1 nếu đã đổi sang mật khẩu riêng (khác 123456)")
    void shouldNotDeactivateLearnerAccountWhenPasswordAlreadyChanged() {
        Users learner1 = new Users();
        learner1.setUsername("learner1");
        learner1.setStatus(UserStatus.ACTIVE);
        learner1.setPasswordHash(passwordEncoder.encode("LearnerCustomPass#2026"));

        when(usersRepository.findByUsername("learner1")).thenReturn(Optional.of(learner1));
        when(usersRepository.findByUsername("learner2")).thenReturn(Optional.empty());

        ProductionSeedAccountSecurityRunner runner = new ProductionSeedAccountSecurityRunner(
                usersRepository, passwordEncoder, null
        );

        runner.secureLearnerSeedAccounts();

        assertThat(learner1.getStatus()).isEqualTo(UserStatus.ACTIVE);
        verify(usersRepository, never()).save(learner1);
    }

    @Test
    @DisplayName("Prod: Vô hiệu hóa admin nếu dùng mật khẩu mặc định và KHÔNG có ADMIN_INITIAL_PASSWORD")
    void shouldDeactivateAdminWhenUsingDefaultPasswordAndNoInitialPasswordEnv() {
        Users admin = new Users();
        admin.setUsername("admin");
        admin.setStatus(UserStatus.ACTIVE);
        admin.setPasswordHash(ProductionSeedAccountSecurityRunner.V31_DEFAULT_HASH);

        when(usersRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        ProductionSeedAccountSecurityRunner runner = new ProductionSeedAccountSecurityRunner(
                usersRepository, passwordEncoder, null
        );

        runner.secureAdminSeedAccount();

        assertThat(admin.getStatus()).isEqualTo(UserStatus.DEACTIVATED);
        assertThat(admin.getPasswordHash()).startsWith("DISABLED_");
        verify(usersRepository).save(admin);
    }

    @Test
    @DisplayName("Prod: Cập nhật mật khẩu mới và duy trì ACTIVE cho admin nếu CÓ ADMIN_INITIAL_PASSWORD dài >= 12 ký tự")
    void shouldUpdateAdminPasswordWhenInitialPasswordEnvProvidedAndValid() {
        Users admin = new Users();
        admin.setUsername("admin");
        admin.setStatus(UserStatus.ACTIVE);
        admin.setPasswordHash(ProductionSeedAccountSecurityRunner.V31_DEFAULT_HASH);

        when(usersRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        String newSecret = "ProductionSecurePass@2026";
        ProductionSeedAccountSecurityRunner runner = new ProductionSeedAccountSecurityRunner(
                usersRepository, passwordEncoder, newSecret
        );

        runner.secureAdminSeedAccount();

        assertThat(admin.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(passwordEncoder.matches(newSecret, admin.getPasswordHash())).isTrue();
        verify(usersRepository).save(admin);
    }

    @Test
    @DisplayName("Prod: Khóa admin (DEACTIVATED) nếu ADMIN_INITIAL_PASSWORD quá ngắn (< 12 ký tự)")
    void shouldDeactivateAdminWhenInitialPasswordIsTooShort() {
        Users admin = new Users();
        admin.setUsername("admin");
        admin.setStatus(UserStatus.ACTIVE);
        admin.setPasswordHash(ProductionSeedAccountSecurityRunner.V31_DEFAULT_HASH);

        when(usersRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        String shortSecret = "Short123!"; // 9 ký tự < 12
        ProductionSeedAccountSecurityRunner runner = new ProductionSeedAccountSecurityRunner(
                usersRepository, passwordEncoder, shortSecret
        );

        runner.secureAdminSeedAccount();

        assertThat(admin.getStatus()).isEqualTo(UserStatus.DEACTIVATED);
        assertThat(admin.getPasswordHash()).startsWith("DISABLED_");
        verify(usersRepository).save(admin);
    }

    @Test
    @DisplayName("Prod: Không thay đổi nếu admin đã có mật khẩu riêng không phải mặc định")
    void shouldNotTouchAdminIfPasswordAlreadyChanged() {
        Users admin = new Users();
        admin.setUsername("admin");
        admin.setStatus(UserStatus.ACTIVE);
        admin.setPasswordHash(passwordEncoder.encode("AlreadyCustomPass@999"));

        when(usersRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        ProductionSeedAccountSecurityRunner runner = new ProductionSeedAccountSecurityRunner(
                usersRepository, passwordEncoder, null
        );

        runner.secureAdminSeedAccount();

        assertThat(admin.getStatus()).isEqualTo(UserStatus.ACTIVE);
        verify(usersRepository, never()).save(admin);
    }
}
