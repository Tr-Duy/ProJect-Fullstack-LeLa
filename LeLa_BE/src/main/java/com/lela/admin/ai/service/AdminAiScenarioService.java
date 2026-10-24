package com.lela.admin.ai.service;

import com.lela.admin.ai.dto.AdminScenarioRequest;
import com.lela.admin.ai.dto.AdminScenarioResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminAiScenarioService {
    Page<AdminScenarioResponse> getScenarios(Long topicId, Boolean isActive, String status, String search, Pageable pageable);
    AdminScenarioResponse getScenarioById(Long id);
    AdminScenarioResponse createScenario(AdminScenarioRequest request);
    AdminScenarioResponse updateScenario(Long id, AdminScenarioRequest request);
    void deleteScenario(Long id);
    AdminScenarioResponse cloneScenario(Long id);
    AdminScenarioResponse toggleStatus(Long id);
}
