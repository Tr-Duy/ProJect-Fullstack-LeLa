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
import static org.mockito.ArgumentMatchers.any;
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
    @DisplayName("Prod: Vô hiệu hóa learner1 và learner2 nếu còn tồn tại hoặc dùng mật khẩu mặc định")
    void shouldDeactivateLearnerAccountsInProd() {
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
    @DisplayName("Prod: Cập nhật mật khẩu mới và duy trì ACTIVE cho admin nếu CÓ ADMIN_INITIAL_PASSWORD")
    void shouldUpdateAdminPasswordWhenInitialPasswordEnvProvided() {
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
