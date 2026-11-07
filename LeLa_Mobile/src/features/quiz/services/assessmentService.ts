import { apiClient, ApiResponse } from '../../../api/client';
import {
  QuizResponse,
  FinalLevelAssessmentResponse,
  PlacementTestResult,
  QuizAttemptDetailResponse,
  Page,
} from '../../../types';
import { quizService } from './quizService';

export interface AssessmentOverviewData {
  currentLevelName: string;
  currentLevelCode: string;
  isLevelAssigned: boolean;
  isEligibleForFinal: boolean;
  completedDecks: number;
  totalDecks: number;
  lockMessage?: string;
  cycleStatus?: string;
  cooldownRemainingSeconds?: number;
}

export const assessmentService = {
  /**
   * Lấy tổng quan trạng thái khảo thí, tiến độ hoàn thành bộ thẻ và điều kiện thi
   */
  async getAssessmentOverview(): Promise<AssessmentOverviewData> {
    try {
      const response = await apiClient.get<ApiResponse<FinalLevelAssessmentResponse>>('/final-level-tests');
      const data = response.data?.data;

      const isAssigned = !!data?.currentLevelName && data.currentLevelName !== 'Chưa phân cấp';

      return {
        currentLevelName: data?.currentLevelName || 'Chưa phân cấp',
        currentLevelCode: data?.currentLevelId ? `LEVEL_${data.currentLevelId}` : 'UNASSIGNED',
        isLevelAssigned: isAssigned,
        isEligibleForFinal: data?.isEligible ?? false,
        completedDecks: data?.completedDecks ?? 0,
        totalDecks: data?.totalDecks ?? 0,
        lockMessage: data?.lockMessage,
        cycleStatus: data?.cycleStatus,
        cooldownRemainingSeconds: data?.cooldownRemainingSeconds,
      };
    } catch (error) {
      console.warn('[assessmentService] Lỗi lấy overview final-level-tests:', error);
      return {
        currentLevelName: 'Chưa phân cấp',
        currentLevelCode: 'UNASSIGNED',
        isLevelAssigned: false,
        isEligibleForFinal: false,
        completedDecks: 0,
        totalDecks: 0,
        lockMessage: 'Bạn cần thực hiện bài kiểm tra xếp lớp Placement Test để xác định trình độ ban đầu.',
      };
    }
  },

  /**
   * Lấy danh sách các bài thi xếp lớp đầu vào (Placement Tests)
   */
  async getPlacementTests(): Promise<QuizResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<Page<QuizResponse>>>('/quizzes', {
        params: { category: 'PLACEMENT', size: 50 },
      });

      const list: QuizResponse[] = response.data?.data?.content || (response.data?.data as any) || [];

      // Sắp xếp theo thứ tự cấp độ từ thấp đến cao
      const orderMap: Record<string, number> = {
        'PLACEMENT-TOEIC-U500': 1,
        'PLACEMENT-TOEIC-500-650': 2,
        'PLACEMENT-TOEIC-650-800': 3,
        'PLACEMENT-TOEIC-800-PLUS': 4,
      };

      return [...list].sort((a, b) => {
        const orderA = orderMap[a.quizCode || ''] || 99;
        const orderB = orderMap[b.quizCode || ''] || 99;
        return orderA - orderB;
      });
    } catch (error) {
      console.error('[assessmentService] Lỗi lấy bài thi placement:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách các bài thi thăng hạng trình độ (Level-Up Tests)
   */
  async getLevelUpTests(): Promise<QuizResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<Page<QuizResponse>>>('/quizzes', {
        params: { category: 'LEVEL_UP', size: 50 },
      });
      return response.data?.data?.content || (response.data?.data as any) || [];
    } catch (error) {
      console.error('[assessmentService] Lỗi lấy bài thi level-up:', error);
      return [];
    }
  },

  /**
   * Lấy các bài kiểm tra đầu ra / cuối chặng học (Final Level Assessments)
   */
  async getFinalAssessments(): Promise<{ overview?: FinalLevelAssessmentResponse; quizzes: QuizResponse[] }> {
    try {
      const response = await apiClient.get<ApiResponse<FinalLevelAssessmentResponse>>('/final-level-tests');
      const data = response.data?.data;

      let quizzes = data?.quizzes || [];
      if (!quizzes || quizzes.length === 0) {
        // Fallback truy vấn trực tiếp quiz category FINAL hoặc FINAL_LEVEL
        const finalRes = await apiClient.get<ApiResponse<Page<QuizResponse>>>('/quizzes', {
          params: { category: 'FINAL', size: 50 },
        });
        quizzes = finalRes.data?.data?.content || (finalRes.data?.data as any) || [];
      }

      return {
        overview: data,
        quizzes,
      };
    } catch (error) {
      console.warn('[assessmentService] Lỗi lấy final assessments:', error);
      return { quizzes: [] };
    }
  },

  /**
   * Lấy danh sách các bài tập trắc nghiệm luyện tập thông thường
   */
  async getPracticeQuizzes(params?: { search?: string; difficulty?: 'EASY' | 'MEDIUM' | 'HARD' }): Promise<QuizResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<Page<QuizResponse>>>('/quizzes', {
        params: {
          category: 'NORMAL',
          size: 50,
          search: params?.search,
          difficulty: params?.difficulty,
        },
      });
      return response.data?.data?.content || (response.data?.data as any) || [];
    } catch (error) {
      console.error('[assessmentService] Lỗi lấy bài thi luyện tập:', error);
      return [];
    }
  },

  /**
   * Gửi xác nhận kết quả bài thi Placement để tự động gán trình độ cho học viên
   */
  async submitPlacementResult(attemptPublicId: string): Promise<PlacementTestResult> {
    const response = await apiClient.post<PlacementTestResult>('/onboarding/submit-placement', {
      attemptPublicId,
    });
    return response.data;
  },

  /**
   * Chọn cấp độ thủ công
   */
  async manualSelectLevel(examTypeId: number, levelId: number): Promise<void> {
    await apiClient.post('/onboarding/manual-select', {
      examTypeId,
      levelId,
    });
  },
};

export default assessmentService;

