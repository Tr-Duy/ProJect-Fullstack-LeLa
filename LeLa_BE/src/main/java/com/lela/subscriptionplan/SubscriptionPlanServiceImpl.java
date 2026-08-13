package com.lela.subscriptionplan;

import com.lela.common.exception.NotFoundExeception;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.lela.subscriptionplan.domain.SubscriptionPlan;
import com.lela.subscriptionplan.dto.SubscriptionPlanCreateRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanPatchRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {
    private final SubscriptionPlanRepository repository;
    private final ModelMapper modelMapper;

    @Override
    public List<SubscriptionPlanResponse> findAll() {
        // Lấy danh sách tất cả thực thể gói đăng ký và ánh xạ sang DTO
        return repository.findAll().stream()
                .map(e -> modelMapper.map(e, SubscriptionPlanResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<SubscriptionPlanResponse> findById(Long id) {
        // Tìm gói đăng ký theo ID và ánh xạ sang DTO nếu tìm thấy
        return repository.findById(id)
                .map(entity -> modelMapper.map(entity, SubscriptionPlanResponse.class));
    }

    @Override
    public SubscriptionPlanResponse create(SubscriptionPlanCreateRequest request) {
        // Ánh xạ dữ liệu từ request tạo mới sang thực thể SubscriptionPlan
        SubscriptionPlan entity = modelMapper.map(request, SubscriptionPlan.class);

        if (entity.getCurrencyCode() == null || entity.getCurrencyCode().isBlank())
            entity.setCurrencyCode("VND");
        if (entity.getFeaturesJson() == null || entity.getFeaturesJson().isBlank())
            entity.setFeaturesJson("{}");
        if (entity.getDisplayOrder() == null)
            entity.setDisplayOrder(0);

        entity = repository.save(entity);
        return modelMapper.map(entity, SubscriptionPlanResponse.class);
    }

    @Override
    public SubscriptionPlanResponse patch(Long id, SubscriptionPlanPatchRequest request) {
        // Tìm kiếm thực thể hiện tại theo ID, ném ngoại lệ nếu không tồn tại
        SubscriptionPlan entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Not found SubscriptionPlan with id " + id));

        // Cập nhật từng trường thông tin nếu giá trị gửi lên khác null (Null-safe
        // partial update)
        if (request.getPlanCode() != null)
            entity.setPlanCode(request.getPlanCode());
        if (request.getName() != null)
            entity.setName(request.getName());
        if (request.getDescription() != null)
            entity.setDescription(request.getDescription());
        if (request.getPrice() != null)
            entity.setPrice(request.getPrice());
        if (request.getCurrencyCode() != null)
            entity.setCurrencyCode(request.getCurrencyCode());
        if (request.getBillingCycle() != null)
            entity.setBillingCycle(request.getBillingCycle());
        if (request.getBillingIntervalCount() != null)
            entity.setBillingIntervalCount(request.getBillingIntervalCount());
        if (request.getMaxOwnedDecks() != null)
            entity.setMaxOwnedDecks(request.getMaxOwnedDecks());
        if (request.getMaxCardsPerDeck() != null)
            entity.setMaxCardsPerDeck(request.getMaxCardsPerDeck());
        if (request.getMaxDailyReviews() != null)
            entity.setMaxDailyReviews(request.getMaxDailyReviews());
        if (request.getQuizEnabled() != null)
            entity.setQuizEnabled(request.getQuizEnabled());
        if (request.getLeaderboardEnabled() != null)
            entity.setLeaderboardEnabled(request.getLeaderboardEnabled());
        if (request.getOfflineEnabled() != null)
            entity.setOfflineEnabled(request.getOfflineEnabled());
        if (request.getFeaturesJson() != null)
            entity.setFeaturesJson(request.getFeaturesJson());
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());
        if (request.getDisplayOrder() != null)
            entity.setDisplayOrder(request.getDisplayOrder());

        entity = repository.save(entity);
        return modelMapper.map(entity, SubscriptionPlanResponse.class);
    }

    @Override
    public void deleteById(Long id) {
        // Thực hiện xóa thực thể khỏi DB theo ID
        repository.deleteById(id);
    }
}
