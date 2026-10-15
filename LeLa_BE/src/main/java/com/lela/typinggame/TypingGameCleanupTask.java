package com.lela.typinggame;

import com.lela.typinggame.domain.TypingGameRun;
import com.lela.typinggame.domain.TypingGameRunStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TypingGameCleanupTask {

    private final TypingGameRunRepository runRepository;

    @Value("${typing-game.stale-timeout-minutes:30}")
    private int staleTimeoutMinutes;

    @Scheduled(cron = "${typing-game.cleanup-cron:0 */15 * * * *}")
    @Transactional
    public void cleanupStaleRuns() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(staleTimeoutMinutes);
        List<TypingGameRun> staleRuns = runRepository.findStaleInProgressRuns(cutoff);

        if (!staleRuns.isEmpty()) {
            log.info("TypingGameCleanupTask: Đang dọn dẹp {} lượt chơi bị kẹt quá {} phút", staleRuns.size(), staleTimeoutMinutes);
            for (TypingGameRun run : staleRuns) {
                run.setStatus(TypingGameRunStatus.ABANDONED);
                run.setFinishedAt(LocalDateTime.now());
            }
            runRepository.saveAll(staleRuns);
        }
    }
}
