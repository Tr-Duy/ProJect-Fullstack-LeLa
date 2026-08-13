package com.lela.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.payment.domain.PaymentStatus;
import com.lela.payment.dto.PaymentRequest;
import com.lela.payment.dto.PaymentResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaymentService paymentService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private SepayWebhookValidator sepayWebhookValidator;

    private PaymentResponse paymentResponse;

    @BeforeEach
    void setUp() {
        paymentResponse = new PaymentResponse();
        paymentResponse.setId(1L);
        paymentResponse.setUserId(1L);
        paymentResponse.setAmount(new BigDecimal("9.99"));
        paymentResponse.setStatus(PaymentStatus.SUCCEEDED);
    }

    @Test
    void getAll_Success() throws Exception {
        List<PaymentResponse> list = Arrays.asList(paymentResponse);
        Page<PaymentResponse> page = new PageImpl<>(list);

        Mockito.when(paymentService.getAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/payments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void getById_Success() throws Exception {
        Mockito.when(paymentService.getById(1L)).thenReturn(paymentResponse);

        mockMvc.perform(get("/payments/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void checkout_Success() throws Exception {
        com.lela.payment.dto.CheckoutRequest request = new com.lela.payment.dto.CheckoutRequest();
        request.setPlanId(2L);

        com.lela.payment.dto.CheckoutResponse response = com.lela.payment.dto.CheckoutResponse.builder()
                .paymentId(1L)
                .paymentCode("LELA123")
                .amount(new BigDecimal("79000"))
                .qrUrl("https://qr.sepay.vn")
                .build();

        Mockito.when(paymentService.checkout(any(com.lela.payment.dto.CheckoutRequest.class))).thenReturn(response);

        mockMvc.perform(post("/payments/checkout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentId").value(1L))
                .andExpect(jsonPath("$.message").value("Checkout created"));
    }



    @Test
    void delete_Success() throws Exception {
        Mockito.doNothing().when(paymentService).delete(1L);

        mockMvc.perform(delete("/payments/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Deleted"));
    }
}
