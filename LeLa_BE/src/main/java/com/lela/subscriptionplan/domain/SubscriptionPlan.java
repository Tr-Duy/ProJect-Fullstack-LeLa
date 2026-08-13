package com.lela.subscriptionplan.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subscription_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SubscriptionPlan extends AuditableEntity {
    // Mã định danh gói đăng ký (ví dụ: FREE, PREMIUM, PRO)
    private String planCode;

    // Tên của gói đăng ký
    private String name;

    // Mô tả chi tiết về các tính năng của gói đăng ký
    private String description;

    // Giá tiền của gói
    private BigDecimal price;

    // Mã tiền tệ (ví dụ: USD, VND)
    private String currencyCode;

    // Chu kỳ thanh toán (ví dụ: MONTHLY, YEARLY)
    private String billingCycle;

    // Số chu kỳ thanh toán
    private Integer billingIntervalCount;

    // Số lượng bộ thẻ tối đa người dùng có thể sở hữu
    private Integer maxOwnedDecks;

    // Số lượng thẻ tối đa trong mỗi bộ thẻ
    private Integer maxCardsPerDeck;

    // Số lượng thẻ tối đa được xem/ôn tập hàng ngày
    private Integer maxDailyReviews;

    // Cho phép tham gia làm quiz/bài trắc nghiệm hay không
    private Boolean quizEnabled;

    // Cho phép hiển thị trên bảng xếp hạng (Leaderboard) hay không
    private Boolean leaderboardEnabled;

    // Cho phép sử dụng offline hay không
    private Boolean offlineEnabled;

    // Chuỗi JSON chứa thông tin cấu hình các tính năng bổ sung khác
    private String featuresJson;

    // Trạng thái hoạt động của gói đăng ký (true: khả dụng, false: ngưng cung cấp)
    private Boolean isActive;

    // Thứ tự hiển thị của gói trên giao diện
    private Integer displayOrder;
}
