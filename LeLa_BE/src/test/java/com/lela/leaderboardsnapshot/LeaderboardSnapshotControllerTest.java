package com.lela.leaderboardsnapshot;

import com.lela.auth.JwtService;
import com.lela.leaderboardsnapshot.dto.LeaderboardSnapshotResponse;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LeaderboardSnapshotController.class)
@AutoConfigureMockMvc(addFilters = false)
public class LeaderboardSnapshotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeaderboardSnapshotService leaderboardSnapshotService;

    @MockitoBean
    private JwtService jwtService;

    private LeaderboardSnapshotResponse snapshotResponse;

    @BeforeEach
    void setUp() {
        snapshotResponse = new LeaderboardSnapshotResponse();
        snapshotResponse.setId(1L);
        snapshotResponse.setUserId(1L);
        snapshotResponse.setTotalScore(5000L);
    }

    @Test
    void getTopRanking_Success() throws Exception {
        List<LeaderboardSnapshotResponse> list = Arrays.asList(snapshotResponse);
        Page<LeaderboardSnapshotResponse> page = new PageImpl<>(list);

        Mockito.when(leaderboardSnapshotService.getTopRanking(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/leaderboards/top")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải danh sách bảng xếp hạng thành công."));
    }

    @Test
    void getDailyRanking_Success() throws Exception {
        List<LeaderboardSnapshotResponse> list = Arrays.asList(snapshotResponse);
        Page<LeaderboardSnapshotResponse> page = new PageImpl<>(list);

        Mockito.when(leaderboardSnapshotService.getDailyRanking(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/leaderboards/daily")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải danh sách bảng xếp hạng thành công."));
    }

    @Test
    void getWeeklyRanking_Success() throws Exception {
        List<LeaderboardSnapshotResponse> list = Arrays.asList(snapshotResponse);
        Page<LeaderboardSnapshotResponse> page = new PageImpl<>(list);

        Mockito.when(leaderboardSnapshotService.getWeeklyRanking(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/leaderboards/weekly")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải danh sách bảng xếp hạng thành công."));
    }

    @Test
    void getMonthlyRanking_Success() throws Exception {
        List<LeaderboardSnapshotResponse> list = Arrays.asList(snapshotResponse);
        Page<LeaderboardSnapshotResponse> page = new PageImpl<>(list);

        Mockito.when(leaderboardSnapshotService.getMonthlyRanking(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/leaderboards/monthly")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải danh sách bảng xếp hạng thành công."));
    }

    @Test
    void getMyRanking_Success() throws Exception {
        Mockito.when(leaderboardSnapshotService.getUserRanking(null)).thenReturn(snapshotResponse);

        mockMvc.perform(get("/leaderboards/me")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.message").value("Tải thứ hạng cá nhân thành công."));
    }
}
