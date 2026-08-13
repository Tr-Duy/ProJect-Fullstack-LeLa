import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, Page } from '../../../shared/types/lela';

export interface PaymentResponse {
  id: number;
  userId: number;
  subscriptionId?: number;
  provider: string;
  providerTransactionId?: string;
  amount: number;
  currencyCode: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  failureReason?: string;
  providerPayload?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  planId: number;
}

export interface CheckoutResponse {
  paymentId: number;
  paymentCode: string;
  planId: number;
  planCode?: string;
  amount: number;
  currency?: string;
  status: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrUrl: string;
}

export const paymentsApi = {
  getAll: async (params?: any): Promise<ApiResponse<Page<PaymentResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<PaymentResponse>>>('/payments', { params });
    return res.data;
  },
  getById: async (id: number): Promise<ApiResponse<PaymentResponse>> => {
    const res = await apiClient.get<ApiResponse<PaymentResponse>>(`/payments/${id}`);
    return res.data;
  },
  getStatus: async (id: number): Promise<ApiResponse<string>> => {
    const res = await apiClient.get<ApiResponse<string>>(`/payments/${id}/status`);
    return res.data;
  },
  checkout: async (data: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> => {
    const res = await apiClient.post<ApiResponse<CheckoutResponse>>('/payments/checkout', data);
    return res.data;
  },
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/payments/${id}`);
    return res.data;
  }
};
