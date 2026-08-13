package com.lela.leaderboardsnapshot;

import com.lela.leaderboardsnapshot.dto.LeaderboardSnapshotResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LeaderboardSnapshotService {
    Page<LeaderboardSnapshotResponse> getTopRanking(Pageable pageable);
    Page<LeaderboardSnapshotResponse> getDailyRanking(Pageable pageable);
    Page<LeaderboardSnapshotResponse> getWeeklyRanking(Pageable pageable);
    Page<LeaderboardSnapshotResponse> getMonthlyRanking(Pageable pageable);
    LeaderboardSnapshotResponse getUserRanking(Long userId);
}
