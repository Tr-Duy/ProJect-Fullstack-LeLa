package com.lela.leaderboardsnapshot;

import com.lela.leaderboardsnapshot.dto.LeaderboardSnapshotResponse;
import com.lela.users.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardSnapshotServiceImpl implements LeaderboardSnapshotService {

    private final LeaderboardSnapshotRepository repository;

    private final UsersRepository usersRepository; // Inject vào class

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaderboardSnapshotResponse> getTopRanking(Pageable pageable) {
        return getRealTimePage(LocalDate.of(2000, 1, 1), LocalDate.now(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaderboardSnapshotResponse> getDailyRanking(Pageable pageable) {
        LocalDate today = LocalDate.now();
        return getRealTimePage(today, today, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaderboardSnapshotResponse> getWeeklyRanking(Pageable pageable) {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        return getRealTimePage(startOfWeek, endOfWeek, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaderboardSnapshotResponse> getMonthlyRanking(Pageable pageable) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
        return getRealTimePage(startOfMonth, endOfMonth, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public LeaderboardSnapshotResponse getUserRanking(Long userId) {
        Long targetUserId = (userId != null) ? userId : getCurrentUserId();
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        Long currentRank = repository.findUserRealTimeRank(targetUserId, startOfWeek, endOfWeek).orElse(0L);
        Long totalXp = repository.findUserTotalXpInPeriod(targetUserId, startOfWeek, endOfWeek);

        LeaderboardSnapshotResponse response = new LeaderboardSnapshotResponse();
        response.setUserId(targetUserId);
        response.setXpScore(totalXp != null ? totalXp : 0L);
        response.setTotalScore(response.getXpScore());
        response.setId(currentRank);
        return response;
    }

    private Page<LeaderboardSnapshotResponse> getRealTimePage(LocalDate start, LocalDate end, Pageable pageable) {
        Page<Object[]> rawData = repository.findRealTimeRankings(start, end, pageable);

        List<LeaderboardSnapshotResponse> dtoList = rawData.getContent().stream().map(row -> {
            LeaderboardSnapshotResponse res = new LeaderboardSnapshotResponse();
            res.setUserId((Long) row[0]);
            res.setFullName((String) row[1]);
            res.setUsername((String) row[2]);
            res.setAvatarUrl((String) row[3]);
            res.setXpScore((Long) row[4]);
            res.setTotalScore((Long) row[4]);
            res.setQuizScore((Long) row[5]);
            res.setCardsMastered(((Long) row[6]).intValue());
            res.setPeriodStart(start);
            res.setPeriodEnd(end);
            return res;
        }).collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, rawData.getTotalElements());
    }
}