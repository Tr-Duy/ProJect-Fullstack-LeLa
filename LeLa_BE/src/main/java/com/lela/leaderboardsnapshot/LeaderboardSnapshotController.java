package com.lela.leaderboardsnapshot;

import com.lela.common.ApiResponse;
import com.lela.leaderboardsnapshot.dto.LeaderboardSnapshotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/leaderboards")
@RequiredArgsConstructor
public class LeaderboardSnapshotController {

    private final LeaderboardSnapshotService leaderboardService;

    private static final String MSG_GET_RANK_SUCCESS = "Tải danh sách bảng xếp hạng thành công.";
    private static final String MSG_GET_MY_RANK_SUCCESS = "Tải thứ hạng cá nhân thành công.";

    @GetMapping("/top")
    public ResponseEntity<ApiResponse<Page<LeaderboardSnapshotResponse>>> getTopRanking(Pageable pageable) {
        Page<LeaderboardSnapshotResponse> data = leaderboardService.getTopRanking(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_GET_RANK_SUCCESS));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<Page<LeaderboardSnapshotResponse>>> getDailyRanking(Pageable pageable) {
        Page<LeaderboardSnapshotResponse> data = leaderboardService.getDailyRanking(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_GET_RANK_SUCCESS));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<Page<LeaderboardSnapshotResponse>>> getWeeklyRanking(Pageable pageable) {
        Page<LeaderboardSnapshotResponse> data = leaderboardService.getWeeklyRanking(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_GET_RANK_SUCCESS));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<Page<LeaderboardSnapshotResponse>>> getMonthlyRanking(Pageable pageable) {
        Page<LeaderboardSnapshotResponse> data = leaderboardService.getMonthlyRanking(pageable);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_GET_RANK_SUCCESS));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LeaderboardSnapshotResponse>> getMyRanking() {
        LeaderboardSnapshotResponse data = leaderboardService.getUserRanking(null);
        return ResponseEntity.ok(ApiResponse.success(data, MSG_GET_MY_RANK_SUCCESS));
    }
}