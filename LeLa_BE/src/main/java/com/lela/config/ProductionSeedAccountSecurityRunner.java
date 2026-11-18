package com.lela.config;

import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.users.domain.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Thành phần bảo mật khởi động chỉ chạy ở profile "prod".
 * Nhiệm vụ:
 * 1. Kiểm tra tài khoản seed (admin, learner1, learner2).
 * 2. Vô hiệu hóa và xáo trộn password hash của learner1, learner2.
 * 3. Với tài khoản admin: nếu còn dùng mật khẩu mặc định (123456 từ V31):
 *    - Nếu có biến môi trường ADMIN_INITIAL_PASSWORD: cập nhật mật khẩu mới và duy trì ACTIVE.
 *    - Nếu không có biến môi trường: vô hiệu hóa admin (DEACTIVATED) để ngăn chặn truy cập trái phép.
 */
@Component
@Profile("prod")
public class ProductionSeedAccountSecurityRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductionSeedAccountSecurityRunner.class);

    public static final String V31_DEFAULT_HASH = "$2a$10$70NHF6uEzsz.eR97n0I29..XrPftergfKlJwDR0AhQ.boDRn73ble";
    public static final String DEFAULT_RAW_PASSWORD = "123456";

    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminInitialPassword;

    public ProductionSeedAccountSecurityRunner(
            UsersRepository usersRepository,
            PasswordEncoder passwordEncoder,
            @Value("${ADMIN_INITIAL_PASSWORD:#{null}}") String adminInitialPassword
    ) {
        this.usersRepository = usersRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminInitialPassword = adminInitialPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        secureLearnerSeedAccounts();
        secureAdminSeedAccount();
    }

    public void secureLearnerSeedAccounts() {
        for (String username : List.of("learner1", "learner2")) {
            usersRepository.findByUsername(username).ifPresent(user -> {
                boolean matchesDefault = isDefaultPassword(user.getPasswordHash());
                if (matchesDefault || user.getStatus() != UserStatus.DEACTIVATED) {
                    user.setStatus(UserStatus.DEACTIVATED);
                    user.setPasswordHash("DISABLED_" + UUID.randomUUID());
                    usersRepository.save(user);
                    log.warn("Production security: Seed account '{}' has been deactivated and password scrambled.", username);
                }
            });
        }
    }

    public void secureAdminSeedAccount() {
        usersRepository.findByUsername("admin").ifPresent(admin -> {
            boolean matchesDefault = isDefaultPassword(admin.getPasswordHash());
            if (matchesDefault) {
                if (adminInitialPassword != null && !adminInitialPassword.trim().isBlank()) {
                    admin.setPasswordHash(passwordEncoder.encode(adminInitialPassword.trim()));
                    admin.setStatus(UserStatus.ACTIVE);
                    usersRepository.save(admin);
                    log.info("Production security: Admin account password has been securely initialized from ADMIN_INITIAL_PASSWORD.");
                } else {
                    admin.setStatus(UserStatus.DEACTIVATED);
                    admin.setPasswordHash("DISABLED_" + UUID.randomUUID());
                    usersRepository.save(admin);
                    log.warn("Production security: Admin account disabled in production because it is using the default seed password (123456) and ADMIN_INITIAL_PASSWORD was not provided.");
                }
            }
        });
    }

    private boolean isDefaultPassword(String currentHash) {
        if (currentHash == null) {
            return false;
        }
        if (V31_DEFAULT_HASH.equals(currentHash)) {
            return true;
        }
        try {
            return passwordEncoder.matches(DEFAULT_RAW_PASSWORD, currentHash);
        } catch (Exception e) {
            return false;
        }
    }
}
