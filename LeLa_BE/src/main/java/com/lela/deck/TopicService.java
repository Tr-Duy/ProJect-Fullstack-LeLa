package com.lela.deck;

import com.lela.common.exception.BadRequestException;

import com.lela.deck.domain.Topic;
import com.lela.deck.dto.TopicDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicRepository topicRepository;

    public List<TopicDTO> getAllTopics() {
        return topicRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public TopicDTO getTopicById(Long id) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Topic not found"));
        return mapToDTO(topic);
    }

    @Transactional
    public TopicDTO createTopic(TopicDTO request) {
        if (topicRepository.existsByName(request.getName())) {
            throw new BadRequestException("Tên chủ đề đã tồn tại");
        }
        
        Topic topic = new Topic();
        topic.setName(request.getName());
        topic.setSlug(generateUniqueSlug(request.getSlug(), request.getName(), null));
        topic.setDescription(request.getDescription());
        topic.setIconUrl(request.getIconUrl());
        if (request.getIsActive() != null) {
            topic.setIsActive(request.getIsActive());
        }
        topic = topicRepository.save(topic);
        return mapToDTO(topic);
    }

    @Transactional
    public TopicDTO updateTopic(Long id, TopicDTO request) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Topic not found"));
        
        if (request.getName() != null && !request.getName().equals(topic.getName())) {
            if (topicRepository.existsByNameAndIdNot(request.getName(), id)) {
                throw new BadRequestException("Tên chủ đề đã tồn tại");
            }
            topic.setName(request.getName());
        }
        if (request.getSlug() != null) {
            topic.setSlug(generateUniqueSlug(request.getSlug(), request.getName() != null ? request.getName() : topic.getName(), id));
        } else if (request.getName() != null) {
            topic.setSlug(generateUniqueSlug(null, request.getName(), id));
        }
        if (request.getDescription() != null) topic.setDescription(request.getDescription());
        if (request.getIconUrl() != null) topic.setIconUrl(request.getIconUrl());
        if (request.getIsActive() != null) topic.setIsActive(request.getIsActive());
        topic = topicRepository.save(topic);
        return mapToDTO(topic);
    }

    private TopicDTO mapToDTO(Topic topic) {
        TopicDTO dto = new TopicDTO();
        dto.setId(topic.getId());
        dto.setName(topic.getName());
        dto.setSlug(topic.getSlug());
        dto.setDescription(topic.getDescription());
        dto.setIconUrl(topic.getIconUrl());
        dto.setIsActive(topic.getIsActive());
        return dto;
    }

    private String generateUniqueSlug(String providedSlug, String name, Long topicId) {
        String baseSlug = providedSlug;
        if (baseSlug == null || baseSlug.trim().isEmpty()) {
            baseSlug = name;
        }
        if (baseSlug == null || baseSlug.trim().isEmpty()) {
            baseSlug = "topic";
        }
        
        // Remove accents and special characters
        baseSlug = Normalizer.normalize(baseSlug, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        String uniqueSlug = baseSlug;
        int counter = 1;
        while (topicId == null ? topicRepository.existsBySlug(uniqueSlug) : topicRepository.existsBySlugAndIdNot(uniqueSlug, topicId)) {
            uniqueSlug = baseSlug + "-" + counter;
            counter++;
        }
        return uniqueSlug;
    }
}
