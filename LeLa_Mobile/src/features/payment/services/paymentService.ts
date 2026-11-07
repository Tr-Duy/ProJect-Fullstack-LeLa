import { apiClient } from '../../../api/client';
import {
  ApiResponse,
  CheckoutRequest,
  CheckoutResponse,
  Page,
  PaymentResponse,
  SubscriptionPlanResponse,
  UserSubscriptionResponse,
} from '../../../types';

export const paymentService = {
  /**
   * Lấy danh sách toàn bộ các gói cước hội viên có sẵn
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlanResponse[]> {
    const response = await apiClient.get<ApiResponse<SubscriptionPlanResponse[]>>('/subscription-plans');
    return response.data.data || [];
  },

  /**
   * Khởi tạo giao dịch thanh toán mua gói cước VietQR SePay
   */
  async createCheckout(planId: number): Promise<CheckoutResponse> {
    const payload: CheckoutRequest = {
      planId,
    };
    const response = await apiClient.post<ApiResponse<CheckoutResponse>>('/payments/checkout', payload);
    return response.data.data;
  },

  /**
   * Lấy trạng thái hiện tại của đơn hàng (dùng cho cơ chế polling kiểm tra SePay webhook)
   * Trả về chuỗi: 'PENDING', 'COMPLETED', 'FAILED', 'EXPIRED',...
   */
  async getPaymentStatus(paymentId: number): Promise<string> {
    const response = await apiClient.get<ApiResponse<string>>(`/payments/${paymentId}/status`);
    return response.data.data;
  },

  /**
   * Lấy chi tiết thông tin thanh toán theo ID
   */
  async getPaymentDetails(paymentId: number): Promise<PaymentResponse> {
    const response = await apiClient.get<ApiResponse<PaymentResponse>>(`/payments/${paymentId}`);
    return response.data.data;
  },

  /**
   * Lấy danh sách các gói cước đã đăng ký của người dùng hiện tại
   */
  async getMySubscriptions(page = 0, size = 10): Promise<Page<UserSubscriptionResponse>> {
    const response = await apiClient.get<ApiResponse<Page<UserSubscriptionResponse>>>(
      `/user-subscriptions?page=${page}&size=${size}&sort=createdAt,desc`
    );
    return response.data.data;
  },
};

export default paymentService;
