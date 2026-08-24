package com.lela.leaderboardsnapshot;

import com.lela.leaderboardsnapshot.dto.LeaderboardSnapshotResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Disabled;
@Disabled
@ExtendWith(MockitoExtension.class)

public class LeaderboardSnapshotServiceImplTest {

    @Mock
    private LeaderboardSnapshotRepository repository;

    @InjectMocks
    private LeaderboardSnapshotServiceImpl service;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @BeforeEach

    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.lenient().when(authentication.getName()).thenReturn("1");
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void getTopRanking_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Object[]> rawData = new ArrayList<>();
        rawData.add(new Object[]{1L, 100L, 50L, 5L});
        Page<Object[]> page = new PageImpl<>(rawData);

        when(repository.findRealTimeRankings(any(LocalDate.class), any(LocalDate.class), eq(pageable))).thenReturn(page);

        Page<LeaderboardSnapshotResponse> result = service.getTopRanking(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getUserId());
    }

    @Test
    void getDailyRanking_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Object[]> rawData = new ArrayList<>();
        rawData.add(new Object[]{2L, 200L, 100L, 10L});
        Page<Object[]> page = new PageImpl<>(rawData);

        when(repository.findRealTimeRankings(any(LocalDate.class), any(LocalDate.class), eq(pageable))).thenReturn(page);

        Page<LeaderboardSnapshotResponse> result = service.getDailyRanking(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(2L, result.getContent().get(0).getUserId());
    }

    @Test
    void getWeeklyRanking_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Object[]> rawData = new ArrayList<>();
        Page<Object[]> page = new PageImpl<>(rawData);

        when(repository.findRealTimeRankings(any(LocalDate.class), any(LocalDate.class), eq(pageable))).thenReturn(page);

        Page<LeaderboardSnapshotResponse> result = service.getWeeklyRanking(pageable);

        assertEquals(0, result.getTotalElements());
    }

    @Test
    void getMonthlyRanking_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Object[]> rawData = new ArrayList<>();
        Page<Object[]> page = new PageImpl<>(rawData);

        when(repository.findRealTimeRankings(any(LocalDate.class), any(LocalDate.class), eq(pageable))).thenReturn(page);

        Page<LeaderboardSnapshotResponse> result = service.getMonthlyRanking(pageable);

        assertEquals(0, result.getTotalElements());
    }

    @Test
    void getUserRanking_Success() {
        when(repository.findUserRealTimeRank(eq(1L), any(LocalDate.class), any(LocalDate.class))).thenReturn(Optional.of(5L));
        when(repository.findUserTotalXpInPeriod(eq(1L), any(LocalDate.class), any(LocalDate.class))).thenReturn(500L);

        LeaderboardSnapshotResponse result = service.getUserRanking(1L);

        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertEquals(5L, result.getId()); // ID holds current rank
        assertEquals(500L, result.getTotalScore());
    }
}
