package com.lela.usersubscription;

import com.lela.usersubscription.dto.UserSubscriptionRequest;
import com.lela.usersubscription.dto.UserSubscriptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserSubscriptionService {
    Page<UserSubscriptionResponse> getAll(Pageable pageable);
    UserSubscriptionResponse getById(Long id);
    UserSubscriptionResponse create(UserSubscriptionRequest request);
    UserSubscriptionResponse update(Long id, UserSubscriptionRequest request);
    void delete(Long id);
}
