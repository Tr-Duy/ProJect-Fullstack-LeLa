package com.lela.users;

import com.lela.common.exception.NotFoundExeception;
import com.lela.users.domain.DailyUserGoal;
import com.lela.users.domain.Users;
import com.lela.users.dto.DailyGoalRequest;
import com.lela.users.dto.DailyGoalStatusResponse;
import com.lela.users.repository.DailyUserGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class DailyGoalService {

    private final UsersRepository usersRepository;
    private final DailyUserGoalRepository dailyUserGoalRepository;

    private Users getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return usersRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new NotFoundExeception("User not found"));
    }

    private LocalDate getTodayInVietnam() {
        return LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    public DailyGoalStatusResponse getDailyGoalStatus() {
        Users currentUser = getCurrentUser();
        LocalDate today = getTodayInVietnam();

        boolean onboardingCompleted = currentUser.getCurrentLevel() != null;
        if (!onboardingCompleted) {
            return DailyGoalStatusResponse.builder()
                    .shouldShow(false)
                    .goalConfirmed(false)
                    .build();
        }

        Optional<DailyUserGoal> todayGoal = dailyUserGoalRepository.findByUserIdAndGoalDate(currentUser.getId(), today);

        if (todayGoal.isEmpty() || !todayGoal.get().getConfirmed()) {
            return DailyGoalStatusResponse.builder()
                    .shouldShow(true)
                    .goalConfirmed(false)
                    .goalDate(today)
                    .targetCards(null)
                    .build();
        }

        return DailyGoalStatusResponse.builder()
                    .shouldShow(false)
                    .goalConfirmed(true)
                    .goalDate(today)
                    .targetCards(todayGoal.get().getTargetCards())
                    .build();
    }

    public DailyGoalStatusResponse confirmDailyGoal(DailyGoalRequest request) {
        Users currentUser = getCurrentUser();
        LocalDate today = getTodayInVietnam();

        boolean onboardingCompleted = currentUser.getCurrentLevel() != null;
        if (!onboardingCompleted) {
            throw new IllegalStateException("Bạn chưa hoàn tất thiết lập lộ trình học.");
        }

        Optional<DailyUserGoal> existingGoalOpt = dailyUserGoalRepository.findByUserIdAndGoalDate(currentUser.getId(), today);
        DailyUserGoal goal;

        if (existingGoalOpt.isPresent()) {
            goal = existingGoalOpt.get();
            if (goal.getConfirmed()) {
                return DailyGoalStatusResponse.builder()
                        .shouldShow(false)
                        .goalConfirmed(true)
                        .goalDate(goal.getGoalDate())
                        .targetCards(goal.getTargetCards())
                        .build();
            }
        } else {
            goal = new DailyUserGoal();
            goal.setUser(currentUser);
            goal.setGoalDate(today);
        }

        goal.setTargetCards(request.getTargetCards());
        goal.setConfirmed(true);

        dailyUserGoalRepository.save(goal);
        
        currentUser.setDailyGoalCards(request.getTargetCards());
        usersRepository.save(currentUser);

        return DailyGoalStatusResponse.builder()
                .shouldShow(false)
                .goalConfirmed(true)
                .goalDate(goal.getGoalDate())
                .targetCards(goal.getTargetCards())
                .build();
    }
}
