import { apiClient } from '../../../api/client';
import {
  VoiceStatusResponse,
  ConversationScenarioDto,
  VoiceStartResponse,
  VoiceTurnResponse,
  VoiceReportResponse,
} from '../../../types';

export const voiceService = {
  /**
   * Lấy trạng thái quota và cấp độ đàm thoại của người học
   */
  getVoiceStatus: async (): Promise<VoiceStatusResponse> => {
    try {
      const response = await apiClient.get<any>('/voice-conversations/status');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('[voiceService] getVoiceStatus error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách các tình huống giao tiếp tiếng Anh thực tế
   */
  getScenarios: async (): Promise<ConversationScenarioDto[]> => {
    try {
      const response = await apiClient.get<any>('/voice-conversations/scenarios');
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[voiceService] getScenarios error:', error);
      throw error;
    }
  },

  /**
   * Khởi tạo phiên luyện nói mới với kịch bản được chọn
   */
  startSession: async (
    scenarioId?: number,
    scenarioSlug?: string
  ): Promise<VoiceStartResponse> => {
    try {
      const payload: { scenarioId?: number; scenarioSlug?: string } = {};
      if (scenarioSlug) payload.scenarioSlug = scenarioSlug;
      if (scenarioId) payload.scenarioId = scenarioId;

      console.log('[voiceService] Gửi yêu cầu startSession với payload:', payload);

      const response = await apiClient.post<any>(
        '/voice-conversations/sessions/start',
        payload
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      const serverData = error.response?.data;
      const serverMessage =
        serverData?.message ||
        (typeof serverData === 'string' ? serverData : null) ||
        error.message ||
        'Lỗi máy chủ khi khởi tạo phòng nói (HTTP 500)';

      console.error('[voiceService] Chi tiết lỗi startSession từ Server:', {
        status: error.response?.status,
        data: serverData,
        message: serverMessage,
      });

      const detailedError = new Error(serverMessage);
      (detailedError as any).response = error.response;
      (detailedError as any).status = error.response?.status;
      throw detailedError;
    }
  },

  /**
   * Gửi lượt thoại của học viên lên Backend để AI phân tích và phản hồi
   */
  sendTurn: async (
    publicId: string,
    userText: string,
    elapsedSeconds: number = 5
  ): Promise<VoiceTurnResponse> => {
    try {
      const payload = {
        transcript: userText,
        userMessage: userText,
        sttConfidence: 0.95,
        clientElapsedSeconds: elapsedSeconds,
        isRetry: false,
      };

      const response = await apiClient.post<any>(
        `/voice-conversations/sessions/${publicId}/turns`,
        payload
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('[voiceService] sendTurn error:', error);
      throw error;
    }
  },

  /**
   * Kết thúc cuộc gọi và nhận báo cáo đánh giá toàn diện
   */
  finishSession: async (
    publicId: string,
    feedback: string = 'COMFORTABLE'
  ): Promise<VoiceReportResponse> => {
    try {
      const response = await apiClient.post<any>(
        `/voice-conversations/sessions/${publicId}/finish`,
        { feedback }
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('[voiceService] finishSession error:', error);
      throw error;
    }
  },

  /**
   * Hủy phiên đàm thoại an toàn khi người dùng thoát
   */
  abandonSession: async (publicId: string): Promise<void> => {
    try {
      await apiClient.post<void>(`/voice-conversations/sessions/${publicId}/abandon`);
    } catch (error) {
      console.warn('[voiceService] abandonSession warning:', error);
    }
  },
};

