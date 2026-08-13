package com.lela.deck;

import com.lela.deck.domain.Topic;
import com.lela.deck.dto.DeckRequest;
import com.lela.deck.dto.DeckResponse;
import com.lela.deck.domain.Deck;
import com.lela.language.domain.Language;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.deck.domain.DeckStatus;
import com.lela.common.domain.ExamType;
import com.lela.common.domain.ProficiencyLevel;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.text.Normalizer;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final TopicRepository topicRepository;
    private final EntityManager entityManager;
    private final UsersRepository usersRepository;

    @Transactional
    @Override
    public DeckResponse createDeck(DeckRequest request) {
        Deck deck = new Deck();
        
        // Sinh mã ngẫu nhiên cho deckCode
        deck.setDeckCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        
        // Tạo slug từ title
        deck.setSlug(generateSlug(request.getTitle(), null));
        
        deck.setTitle(request.getTitle());
        deck.setDescription(request.getDescription());
        deck.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getTopicId() != null) {
            Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
            deck.setTopic(topic);
        }
        
        if (request.getDifficulty() != null) deck.setDifficulty(request.getDifficulty());
        if (request.getVisibility() != null) deck.setVisibility(request.getVisibility());
        if (request.getDisplayMode() != null) deck.setDisplayMode(request.getDisplayMode());
        
        // Trạng thái mặc định hoặc từ request (dành cho Admin)
        deck.setStatus(request.getStatus() != null ? request.getStatus() : DeckStatus.DRAFT);
        deck.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);
        if (request.getRejectionReason() != null) deck.setRejectionReason(request.getRejectionReason());
        if (request.getIsActive() != null) deck.isActive = request.getIsActive();
        deck.setTotalCards(0);
        deck.setViewCount(0L);
        deck.setEnrollmentCount(0L);

        // Thiết lập owner: ưu tiên từ request, nếu không có thì lấy user hiện tại
        Users owner;
        if (request.getOwnerId() != null) {
            owner = entityManager.getReference(Users.class, request.getOwnerId());
        } else {
            owner = getCurrentUser();
        }
        deck.setOwner(owner);

        if (request.getLanguageId() != null) {
            Language language = entityManager.getReference(Language.class, request.getLanguageId());
            deck.setLanguage(language);
        }

        if (request.getExamTypeId() != null) {
            ExamType examType = entityManager.getReference(ExamType.class, request.getExamTypeId());
            deck.setExamType(examType);
        }

        if (request.getLevelId() != null) {
            ProficiencyLevel level = entityManager.getReference(ProficiencyLevel.class, request.getLevelId());
            deck.setLevel(level);
        }

        Deck savedDeck = deckRepository.save(deck);
        return DeckResponse.fromEntity(savedDeck);
    }

    @Transactional
    @Override
    public DeckResponse updateDeck(Long id, DeckRequest request) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        // Chỉ cập nhật các trường được phép
        if (request.getTitle() != null) {
            deck.setTitle(request.getTitle());
            deck.setSlug(generateSlug(request.getTitle(), deck.getId()));
        }
        if (request.getDescription() != null) deck.setDescription(request.getDescription());
        if (request.getCoverImageUrl() != null) deck.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getTopicId() != null) {
            Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
            deck.setTopic(topic);
        }
        if (request.getDifficulty() != null) deck.setDifficulty(request.getDifficulty());
        if (request.getVisibility() != null) deck.setVisibility(request.getVisibility());
        if (request.getDisplayMode() != null) deck.setDisplayMode(request.getDisplayMode());

        // Các trường dành cho Admin
        if (request.getIsFeatured() != null) deck.setIsFeatured(request.getIsFeatured());
        if (request.getStatus() != null) deck.setStatus(request.getStatus());
        if (request.getRejectionReason() != null) deck.setRejectionReason(request.getRejectionReason());
        if (request.getIsActive() != null) deck.isActive = request.getIsActive();

        if (request.getLanguageId() != null) {
            Language language = entityManager.getReference(Language.class, request.getLanguageId());
            deck.setLanguage(language);
        }

        if (request.getExamTypeId() != null) {
            ExamType examType = entityManager.getReference(ExamType.class, request.getExamTypeId());
            deck.setExamType(examType);
        } else {
            deck.setExamType(null);
        }

        if (request.getLevelId() != null) {
            ProficiencyLevel level = entityManager.getReference(ProficiencyLevel.class, request.getLevelId());
            deck.setLevel(level);
        } else {
            deck.setLevel(null);
        }

        Deck updatedDeck = deckRepository.save(deck);
        return DeckResponse.fromEntity(updatedDeck);
    }

    @Transactional(readOnly = true)
    @Override
    public DeckResponse getDeckById(Long id) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Deck not found"));

        if (deck.getTopic() != null && Boolean.FALSE.equals(deck.getTopic().getIsActive())) {
            throw new IllegalArgumentException("This deck belongs to an inactive topic.");
        }

        return DeckResponse.fromEntity(deck);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<DeckResponse> getAllDecks(Long examTypeId, Long levelId, Pageable pageable) {
        Page<Deck> page;
        if (examTypeId != null && levelId != null) {
            page = deckRepository.findByExamTypeIdAndLevelIdAndIsActiveTrue(examTypeId, levelId, pageable);
        } else {
            page = deckRepository.findByIsActiveTrue(pageable);
        }
        return page.map(DeckResponse::fromEntity);
    }
    
    @Transactional(readOnly = true)
    @Override
    public Page<DeckResponse> getDecksByOwner(Long ownerId, Long examTypeId, Long levelId, Pageable pageable) {
        Page<Deck> page;
        if (examTypeId != null && levelId != null) {
            page = deckRepository.findByOwnerIdAndExamTypeIdAndLevelIdAndIsActiveTrue(ownerId, examTypeId, levelId, pageable);
        } else {
            page = deckRepository.findByOwnerIdAndIsActiveTrue(ownerId, pageable);
        }
        return page.map(DeckResponse::fromEntity);
    }

    @Transactional
    @Override
    public void deleteDeck(Long id) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
        
        // Soft delete
        deck.setActive(false);
        deckRepository.save(deck);
    }

    private Users getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("Bạn cần đăng nhập để tạo bộ thẻ.");
        }

        String username = authentication.getName();

        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng đang đăng nhập."));
    }

    private String generateSlug(String title, Long excludeId) {
        if (title == null || title.isEmpty()) {
            return "deck";
        }
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace("đ", "d").replace("Đ", "d");
        String baseSlug = normalized.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (baseSlug.isEmpty()) baseSlug = "deck";

        String slug = baseSlug;
        int counter = 1;
        while (true) {
            java.util.Optional<Deck> existing = deckRepository.findBySlug(slug);
            if (existing.isPresent() && !existing.get().getId().equals(excludeId)) {
                slug = baseSlug + "-" + counter++;
            } else {
                break;
            }
        }
        return slug;
    }
}
