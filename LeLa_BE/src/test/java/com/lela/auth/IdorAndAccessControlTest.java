package com.lela.auth;

import com.lela.payment.PaymentRepository;
import com.lela.payment.PaymentServiceImpl;
import com.lela.payment.domain.Payment;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class IdorAndAccessControlTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UsersRepository usersRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Users userA;
    private Users userB;
    private Payment paymentUserB;

    @BeforeEach
    void setUp() {
        userA = new Users();
        userA.setId(100L);
        userA.setUsername("userA");
        userA.setRoleAssignments(Collections.emptySet());

        userB = new Users();
        userB.setId(200L);
        userB.setUsername("userB");
        userB.setRoleAssignments(Collections.emptySet());

        paymentUserB = new Payment();
        paymentUserB.setId(555L);
        paymentUserB.setUser(userB);
    }

    @Test
    void testUserACannotAccessPaymentOfUserB() {
        // Authenticate as User A
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("userA", "credentials")
        );

        when(paymentRepository.findById(555L)).thenReturn(Optional.of(paymentUserB));
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));

        // Attempting to fetch User B's payment must throw AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> {
            paymentService.getById(555L);
        });
    }
}
