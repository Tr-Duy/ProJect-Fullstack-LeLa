package com.lela.notification;

import com.lela.auth.JwtService;
import com.lela.notification.dto.NotificationResponse;
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

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private com.lela.notification.SseService sseService;

    @MockitoBean
    private com.lela.users.UsersRepository usersRepository;

    private NotificationResponse notificationResponse;

    @BeforeEach
    void setUp() {
        notificationResponse = new NotificationResponse();
        notificationResponse.setId(1L);
        notificationResponse.setUserId(1L);
        notificationResponse.setTitle("Welcome");
        notificationResponse.setMessage("Welcome to LeLa!");
        notificationResponse.setIsRead(false);
    }

    @Test
    void getAll_Success() throws Exception {
        List<NotificationResponse> list = Arrays.asList(notificationResponse);
        Page<NotificationResponse> page = new PageImpl<>(list);

        Mockito.when(notificationService.getAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/notifications")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải danh sách tất cả thông báo thành công."));
    }

    @Test
    void getUnread_Success() throws Exception {
        List<NotificationResponse> list = Arrays.asList(notificationResponse);
        Page<NotificationResponse> page = new PageImpl<>(list);

        Mockito.when(notificationService.getUnread(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/notifications/unread")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải danh sách thông báo chưa đọc thành công."));
    }

    @Test
    void markAsRead_Success() throws Exception {
        Mockito.doNothing().when(notificationService).markAsRead(1L);

        mockMvc.perform(patch("/notifications/1/read")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã đánh dấu đọc thông báo thành công."));
    }

    @Test
    void markAllAsRead_Success() throws Exception {
        Mockito.doNothing().when(notificationService).markAllAsRead();

        mockMvc.perform(patch("/notifications/read-all")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã đánh dấu đọc toàn bộ thông báo thành công."));
    }
}
