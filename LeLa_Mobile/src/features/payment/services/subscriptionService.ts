import { apiClient } from '../../../api/client';
import {
  ApiResponse,
  Page,
  PaymentResponse,
  SubscriptionPlanResponse,
  UserSubscriptionResponse,
} from '../../../types';

export interface ActiveSubscriptionDetail {
  id?: number;
  status: 'FREE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | string;
  planId?: number;
  planName: string;
  planCode: string;
  planDescription: string;
  price: number;
  currencyCode: string;
  startedAt?: string;
  expiresAt?: string;
  daysRemaining?: number;
  isLifetime?: boolean;
  features: string[];
}

export const subscriptionService = {
  /**
   * Lấy thông tin gói hội viên đang hoạt động của người dùng (kèm chi tiết quyền lợi gói)
   */
  async getMyActiveSubscriptions(): Promise<ActiveSubscriptionDetail> {
    try {
      // 1. Lấy danh sách đăng ký của user và danh mục gói cước đồng thời
      const [subsResponse, plansResponse] = await Promise.all([
        apiClient.get<ApiResponse<Page<UserSubscriptionResponse>>>(
          '/user-subscriptions?page=0&size=10&sort=createdAt,desc'
        ).catch(() => null),
        apiClient.get<ApiResponse<SubscriptionPlanResponse[]>>('/subscription-plans').catch(() => null),
      ]);

      const plans: SubscriptionPlanResponse[] = plansResponse?.data?.data || [];
      const userSubs: UserSubscriptionResponse[] = subsResponse?.data?.data?.content || [];

      // 2. Tìm gói có trạng thái ACTIVE
      const activeSub = userSubs.find((sub) => sub.status === 'ACTIVE');

      if (activeSub) {
        const matchedPlan = plans.find((p) => p.id === activeSub.planId);
        const planName = matchedPlan?.name || (activeSub.planId === 3 ? 'Gói Chuyên Sâu LeLa Pro' : 'Gói LeLa Plus');
        const planCode = matchedPlan?.planCode || 'PRO';
        const planDesc = matchedPlan?.description || 'Trọn bộ quyền lợi VIP không giới hạn tính năng AI Tutor & Đề thi.';

        let daysRemaining: number | undefined;
        let isLifetime = false;

        if (activeSub.expiresAt) {
          const now = new Date().getTime();
          const expire = new Date(activeSub.expiresAt).getTime();
          const diffMs = expire - now;
          daysRemaining = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
        } else {
          isLifetime = true;
        }

        // Tạo danh sách quyền lợi mở khóa
        const features: string[] = [];
        if (matchedPlan?.quizEnabled ?? true) features.push('Làm đề thi TOEIC & Khảo thí không giới hạn');
        if (matchedPlan?.maxDailyReviews) features.push(`Ôn tập tối đa ${matchedPlan.maxDailyReviews} thẻ Flashcard/ngày`);
        else features.push('Ôn tập Flashcard SRS Spaced Repetition không giới hạn');
        features.push('Trò chuyện đàm thoại 2 chiều cùng Gia sư AI Native');
        features.push('Tham gia Bảng xếp hạng vinh danh học viên xuất sắc');
        features.push('Ưu tiên sửa lỗi và giải thích đáp án AI chuyên sâu');

        return {
          id: activeSub.id,
          status: 'ACTIVE',
          planId: activeSub.planId,
          planName,
          planCode,
          planDescription: planDesc,
          price: matchedPlan?.price || 199000,
          currencyCode: matchedPlan?.currencyCode || 'VND',
          startedAt: activeSub.startedAt,
          expiresAt: activeSub.expiresAt,
          daysRemaining,
          isLifetime,
          features,
        };
      }
    } catch (error) {
      console.warn('[subscriptionService] Lỗi đọc gói cước active, fallback Free:', error);
    }

    // Mặc định: Gói Free cơ bản
    return {
      status: 'FREE',
      planName: 'Gói Trải Nghiệm Miễn Phí',
      planCode: 'FREE',
      planDescription: 'Học cơ bản 20 thẻ mỗi ngày, làm bài kiểm tra thử nghiệm.',
      price: 0,
      currencyCode: 'VND',
      isLifetime: true,
      features: [
        'Học tối đa 20 thẻ Flashcard mỗi ngày',
        'Tạo tối đa 3 bộ thẻ học từ vựng cá nhân',
        'Luyện tập cơ bản trò chơi Word Rain',
        '1 lượt trò chuyện AI Tutor thử nghiệm mỗi ngày',
      ],
    };
  },

  /**
   * Lấy danh sách lịch sử các giao dịch thanh toán của người dùng
   */
  async getPaymentHistory(page = 0, size = 20): Promise<PaymentResponse[]> {
    try {
      // Endpoint chuẩn từ Spring Boot PaymentController
      const response = await apiClient.get<ApiResponse<Page<PaymentResponse>>>(
        `/payments?page=${page}&size=${size}&sort=createdAt,desc`
      );

      if (response.data && response.data.data && response.data.data.content) {
        return response.data.data.content;
      }
    } catch {
      // Fallback thử các endpoint tương thích
      try {
        const fallbackRes = await apiClient.get<ApiResponse<Page<PaymentResponse>>>(
          `/payments/history?page=${page}&size=${size}`
        );
        return fallbackRes.data?.data?.content || [];
      } catch {
        const userPayRes = await apiClient.get<ApiResponse<PaymentResponse[]>>('/user-payments');
        return userPayRes.data?.data || [];
      }
    }
    return [];
  },

  /**
   * Lấy danh sách toàn bộ các gói cước để hiển thị lựa chọn
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlanResponse[]> {
    const response = await apiClient.get<ApiResponse<SubscriptionPlanResponse[]>>('/subscription-plans');
    return response.data?.data || [];
  },
};

export default subscriptionService;

