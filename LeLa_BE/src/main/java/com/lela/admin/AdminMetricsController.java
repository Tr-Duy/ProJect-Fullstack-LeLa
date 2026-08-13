package com.lela.admin;

import com.lela.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMetricsController {

    private final AdminMetricsService adminMetricsService;

    @GetMapping("/metrics")
    public ApiResponse<Map<String, Object>> getMetrics() {
        Map<String, Object> metrics = adminMetricsService.getDashboardMetrics();

        return ApiResponse.success(metrics, "Dashboard metrics");
    }
}
