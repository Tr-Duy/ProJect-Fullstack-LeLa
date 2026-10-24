package com.lela.admin.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.admin.ai.dto.AdminScenarioRequest;
import com.lela.admin.ai.dto.AdminScenarioResponse;
import com.lela.deck.TopicRepository;
import com.lela.deck.domain.Topic;
import com.lela.voice.domain.ConversationScenario;
import com.lela.voice.repository.ConversationScenarioRepository;
import com.lela.voice.repository.ConversationSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAiScenarioServiceImpl implements AdminAiScenarioService {

    private final ConversationScenarioRepository scenarioRepository;
    private final ConversationSessionRepository sessionRepository;
    private final TopicRepository topicRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminScenarioResponse> getScenarios(Long topicId, Boolean isActive, String status, String search, Pageable pageable) {
        Boolean activeFilter = isActive;
        if (status != null && !status.isBlank()) {
            if ("PUBLISHED".equalsIgnoreCase(status)) activeFilter = true;
            else if ("DRAFT".equalsIgnoreCase(status)) activeFilter = false;
        }

        Page<ConversationScenario> page = scenarioRepository.findWithFilters(topicId, activeFilter, search, pageable);
        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminScenarioResponse getScenarioById(Long id) {
        ConversationScenario scenario = scenarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kịch bản AI: " + id));
        return mapToResponse(scenario);
    }

    @Override
    @Transactional
    public AdminScenarioResponse createScenario(AdminScenarioRequest request) {
        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findById(request.getTopicId()).orElse(null);
        }

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.getTitle());
        }
        slug = ensureUniqueSlug(slug, null);

        String fallbackJson = request.getFallbackLinesJson();
        if (request.getFallbackLines() != null && !request.getFallbackLines().isEmpty()) {
            try {
                fallbackJson = objectMapper.writeValueAsString(request.getFallbackLines());
            } catch (Exception e) {
                log.warn("Failed to serialize fallbackLines", e);
            }
        }
        if (fallbackJson == null || fallbackJson.isBlank()) {
            fallbackJson = "[\"Could you please repeat that?\", \"I see. Can you tell me more about that?\"]";
        }

        boolean active = Boolean.TRUE.equals(request.getIsActive());
        if ("DRAFT".equalsIgnoreCase(request.getStatus())) {
            active = false;
        } else if ("PUBLISHED".equalsIgnoreCase(request.getStatus())) {
            active = true;
        }

        ConversationScenario scenario = ConversationScenario.builder()
                .topic(topic)
                .title(request.getTitle().trim())
                .slug(slug)
                .levelMin(request.getLevelMin() != null ? request.getLevelMin() : 100)
                .levelMax(request.getLevelMax() != null ? request.getLevelMax() : 1000)
                .aiRole(request.getAiRole() != null ? request.getAiRole().trim() : "AI Assistant")
                .userRole(request.getUserRole() != null ? request.getUserRole().trim() : "Learner")
                .description(request.getDescription())
                .systemPromptTemplate(request.getSystemPromptTemplate())
                .fallbackLinesJson(fallbackJson)
                .openingLine(request.getOpeningLine() != null ? request.getOpeningLine().trim() : "Hello! How can I help you today?")
                .isActive(active)
                .build();

        scenario = scenarioRepository.save(scenario);
        return mapToResponse(scenario);
    }

    @Override
    @Transactional
    public AdminScenarioResponse updateScenario(Long id, AdminScenarioRequest request) {
        ConversationScenario scenario = scenarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kịch bản AI: " + id));

        if (request.getTopicId() != null) {
            Topic topic = topicRepository.findById(request.getTopicId()).orElse(null);
            scenario.setTopic(topic);
        } else {
            scenario.setTopic(null);
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            scenario.setTitle(request.getTitle().trim());
        }

        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            String slug = ensureUniqueSlug(request.getSlug().trim(), id);
            scenario.setSlug(slug);
        }

        if (request.getLevelMin() != null) scenario.setLevelMin(request.getLevelMin());
        if (request.getLevelMax() != null) scenario.setLevelMax(request.getLevelMax());
        if (request.getAiRole() != null) scenario.setAiRole(request.getAiRole().trim());
        if (request.getUserRole() != null) scenario.setUserRole(request.getUserRole().trim());
        if (request.getDescription() != null) scenario.setDescription(request.getDescription());
        if (request.getSystemPromptTemplate() != null) scenario.setSystemPromptTemplate(request.getSystemPromptTemplate());
        if (request.getOpeningLine() != null) scenario.setOpeningLine(request.getOpeningLine().trim());

        if (request.getFallbackLines() != null && !request.getFallbackLines().isEmpty()) {
            try {
                scenario.setFallbackLinesJson(objectMapper.writeValueAsString(request.getFallbackLines()));
            } catch (Exception e) {
                log.warn("Failed to serialize fallbackLines", e);
            }
        } else if (request.getFallbackLinesJson() != null && !request.getFallbackLinesJson().isBlank()) {
            scenario.setFallbackLinesJson(request.getFallbackLinesJson());
        }

        if (request.getStatus() != null) {
            scenario.setIsActive("PUBLISHED".equalsIgnoreCase(request.getStatus()));
        } else if (request.getIsActive() != null) {
            scenario.setIsActive(request.getIsActive());
        }

        scenario = scenarioRepository.save(scenario);
        return mapToResponse(scenario);
    }

    @Override
    @Transactional
    public void deleteScenario(Long id) {
        ConversationScenario scenario = scenarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kịch bản AI: " + id));

        long sessions = sessionRepository.countByScenarioId(id);
        if (sessions > 0) {
            // Đã có phiên học sử dụng -> Vô hiệu hóa (chuyển sang DRAFT / Deactivate) để bảo toàn dữ liệu lịch sử
            scenario.setIsActive(false);
            scenarioRepository.save(scenario);
        } else {
            scenarioRepository.delete(scenario);
        }
    }

    @Override
    @Transactional
    public AdminScenarioResponse cloneScenario(Long id) {
        ConversationScenario original = scenarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kịch bản gốc để nhân bản: " + id));

        String newTitle = original.getTitle() + " (Bản sao)";
        String baseSlug = generateSlug(newTitle);
        String uniqueSlug = ensureUniqueSlug(baseSlug, null);

        ConversationScenario clone = ConversationScenario.builder()
                .topic(original.getTopic())
                .title(newTitle)
                .slug(uniqueSlug)
                .levelMin(original.getLevelMin())
                .levelMax(original.getLevelMax())
                .aiRole(original.getAiRole())
                .userRole(original.getUserRole())
                .description(original.getDescription())
                .systemPromptTemplate(original.getSystemPromptTemplate())
                .fallbackLinesJson(original.getFallbackLinesJson())
                .openingLine(original.getOpeningLine())
                .isActive(false) // Bản sao mặc định là DRAFT
                .build();

        clone = scenarioRepository.save(clone);
        return mapToResponse(clone);
    }

    @Override
    @Transactional
    public AdminScenarioResponse toggleStatus(Long id) {
        ConversationScenario scenario = scenarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kịch bản AI: " + id));
        scenario.setIsActive(!Boolean.TRUE.equals(scenario.getIsActive()));
        scenario = scenarioRepository.save(scenario);
        return mapToResponse(scenario);
    }

    private AdminScenarioResponse mapToResponse(ConversationScenario s) {
        List<String> lines = new ArrayList<>();
        if (s.getFallbackLinesJson() != null && !s.getFallbackLinesJson().isBlank()) {
            try {
                lines = objectMapper.readValue(s.getFallbackLinesJson(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.debug("Fallback line json parse notice: {}", e.getMessage());
            }
        }

        long count = sessionRepository.countByScenarioId(s.getId());

        return AdminScenarioResponse.builder()
                .id(s.getId())
                .topicId(s.getTopic() != null ? s.getTopic().getId() : null)
                .topicName(s.getTopic() != null ? s.getTopic().getName() : "Chưa phân loại")
                .title(s.getTitle())
                .slug(s.getSlug())
                .levelMin(s.getLevelMin())
                .levelMax(s.getLevelMax())
                .aiRole(s.getAiRole())
                .userRole(s.getUserRole())
                .description(s.getDescription())
                .systemPromptTemplate(s.getSystemPromptTemplate())
                .fallbackLinesJson(s.getFallbackLinesJson())
                .fallbackLines(lines)
                .openingLine(s.getOpeningLine())
                .isActive(s.getIsActive())
                .status(Boolean.TRUE.equals(s.getIsActive()) ? "PUBLISHED" : "DRAFT")
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .sessionCount(count)
                .build();
    }

    private String generateSlug(String text) {
        if (text == null) return "scenario-" + UUID.randomUUID().toString().substring(0, 8);
        String nfdNormalizedString = Normalizer.normalize(text, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String slug = pattern.matcher(nfdNormalizedString).replaceAll("");
        slug = slug.toLowerCase().replaceAll("[^a-z0-9\\s-]", "").replaceAll("\\s+", "-").replaceAll("-+", "-");
        slug = slug.replaceAll("^-|-$", "");
        return slug.isBlank() ? "scenario-" + UUID.randomUUID().toString().substring(0, 8) : slug;
    }

    private String ensureUniqueSlug(String baseSlug, Long excludeId) {
        String slug = baseSlug;
        int count = 1;
        while (true) {
            var existing = scenarioRepository.findBySlug(slug);
            if (existing.isEmpty() || (excludeId != null && existing.get().getId().equals(excludeId))) {
                return slug;
            }
            slug = baseSlug + "-" + count++;
        }
    }
}
