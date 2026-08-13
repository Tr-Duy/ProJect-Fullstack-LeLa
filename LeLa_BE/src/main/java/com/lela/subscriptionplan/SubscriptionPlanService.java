package com.lela.subscriptionplan;

import com.lela.subscriptionplan.dto.SubscriptionPlanCreateRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanPatchRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanResponse;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanService {
    // Lấy danh sách toàn bộ gói đăng ký.
    List<SubscriptionPlanResponse> findAll();

    // Tìm kiếm gói đăng ký theo ID.
    Optional<SubscriptionPlanResponse> findById(Long id);

    // Tạo mới gói đăng ký.
    SubscriptionPlanResponse create(SubscriptionPlanCreateRequest request);

    // Cập nhật một phần thông tin gói đăng ký (PATCH).
    SubscriptionPlanResponse patch(Long id, SubscriptionPlanPatchRequest request);

    // Xóa gói đăng ký theo ID.
    void deleteById(Long id);
}
