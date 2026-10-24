import { apiClient } from '../../../shared/lib/api';
import type {
  AdminScenario,
  AdminScenarioRequest,
  AdminVoiceSessionDetail,
  AdminQuotaLedgerEntry,
  AdminAdjustQuotaRequest,
  AdminUserQuotaSummary,
  AdminAiTutorSession,
  AdminAiOverviewStats
} from '../types/adminAi';

export const adminAiApi = {
  // ── Scenarios ──────────────────────────────────────────
  getScenarios: async (params?: { topicId?: number; isActive?: boolean; status?: string; search?: string; page?: number; size?: number }) => {
    const res = await apiClient.get('/admin/ai/scenarios', { params });
    return res.data?.data || { content: [], totalElements: 0 };
  },

  getScenarioById: async (id: number): Promise<AdminScenario> => {
    const res = await apiClient.get(`/admin/ai/scenarios/${id}`);
    return res.data?.data;
  },

  createScenario: async (data: AdminScenarioRequest): Promise<AdminScenario> => {
    const res = await apiClient.post('/admin/ai/scenarios', data);
    return res.data?.data;
  },

  updateScenario: async (id: number, data: AdminScenarioRequest): Promise<AdminScenario> => {
    const res = await apiClient.put(`/admin/ai/scenarios/${id}`, data);
    return res.data?.data;
  },

  deleteScenario: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/ai/scenarios/${id}`);
  },

  cloneScenario: async (id: number): Promise<AdminScenario> => {
    const res = await apiClient.post(`/admin/ai/scenarios/${id}/clone`);
    return res.data?.data;
  },

  toggleScenarioStatus: async (id: number): Promise<AdminScenario> => {
    const res = await apiClient.patch(`/admin/ai/scenarios/${id}/toggle-status`);
    return res.data?.data;
  },

  // ── Monitoring & Overview ──────────────────────────────
  getOverviewStats: async (): Promise<AdminAiOverviewStats> => {
    const res = await apiClient.get('/admin/ai/monitoring/overview');
    return res.data?.data;
  },

  // Tab 1: Voice Sessions
  getVoiceSessions: async (params?: { status?: string; userId?: number; scenarioId?: number; startDate?: string; endDate?: string; search?: string; page?: number; size?: number }) => {
    const res = await apiClient.get('/admin/ai/monitoring/sessions', { params });
    return res.data?.data || { content: [], totalElements: 0 };
  },

  getVoiceSessionDetail: async (id: number): Promise<AdminVoiceSessionDetail> => {
    const res = await apiClient.get(`/admin/ai/monitoring/sessions/${id}`);
    return res.data?.data;
  },

  // Tab 2: Quota Ledger
  getQuotaLedger: async (params?: { userId?: number; entryType?: string; startDate?: string; endDate?: string; search?: string; page?: number; size?: number }) => {
    const res = await apiClient.get('/admin/ai/monitoring/quota-ledger', { params });
    return res.data?.data || { content: [], totalElements: 0 };
  },

  adjustQuota: async (data: AdminAdjustQuotaRequest): Promise<AdminQuotaLedgerEntry> => {
    const res = await apiClient.post('/admin/ai/monitoring/quota-ledger/adjust', data);
    return res.data?.data;
  },

  getUserQuotaSummaries: async (search?: string): Promise<AdminUserQuotaSummary[]> => {
    const res = await apiClient.get('/admin/ai/monitoring/quota-ledger/users', { params: { search } });
    return res.data?.data || [];
  },

  // Tab 3: AI Tutor Logs
  getAiTutorLogs: async (params?: { isFallbackOnly?: boolean; userId?: number; startDate?: string; endDate?: string; search?: string; page?: number; size?: number }) => {
    const res = await apiClient.get('/admin/ai/monitoring/ai-tutor-logs', { params });
    return res.data?.data || { content: [], totalElements: 0 };
  },

  getAiTutorLogDetail: async (id: number): Promise<AdminAiTutorSession> => {
    const res = await apiClient.get(`/admin/ai/monitoring/ai-tutor-logs/${id}`);
    return res.data?.data;
  },

  // Helper Topics for dropdown
  getTopics: async () => {
    const res = await apiClient.get('/topics');
    return res.data || [];
  }
};
