import { apiClient, ApiResponse } from '../../../api/client';
import {
  Page,
  QuizResponse,
  QuizAttemptResponse,
  QuizAttemptDetailResponse,
  QuizSubmitAnswerItem,
  QuizSubmitPayload,
} from '../../../types';

export interface QuizQueryParams {
  category?: 'PRACTICE' | 'PLACEMENT' | 'LEVEL_UP' | 'FINAL_ASSESSMENT' | string;
  levelId?: number;
  examTypeId?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  deckId?: number;
  search?: string;
  page?: number;
  size?: number;
}

export const quizService = {
  /**
   * Lấy danh sách các bài thi trắc nghiệm & khảo thí TOEIC từ Backend
   */
  getQuizzes: async (params?: QuizQueryParams): Promise<QuizResponse[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Page<QuizResponse>>>('/quizzes', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          category: params?.category,
          levelId: params?.levelId,
          examTypeId: params?.examTypeId,
          difficulty: params?.difficulty,
          deckId: params?.deckId,
          search: params?.search,
        },
      });

      // Hỗ trợ cả trường hợp Backend trả về Page hoặc mảng trực tiếp
      const pageData = response.data?.data;
      if (Array.isArray(pageData)) {
        return pageData;
      }
      return pageData?.content || [];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài thi:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết thông tin một bài thi theo ID
   */
  getQuizById: async (quizId: number): Promise<QuizResponse> => {
    const response = await apiClient.get<ApiResponse<QuizResponse>>(`/quizzes/${quizId}`);
    return response.data.data;
  },

  /**
   * Khởi tạo lượt làm bài mới cho học viên
   * Backend sẽ tạo snapshot câu hỏi và che giấu đáp án đúng (isCorrect = null)
   */
  startAttempt: async (quizId: number): Promise<QuizAttemptDetailResponse> => {
    const response = await apiClient.post<ApiResponse<QuizAttemptDetailResponse>>(
      `/quiz-attempts/start/${quizId}`
    );
    return response.data.data;
  },

  /**
   * Gửi toàn bộ đáp án của bài thi lên Backend để chấm điểm tự động
   */
  submitAttempt: async (
    attemptId: number,
    answers: QuizSubmitAnswerItem[]
  ): Promise<QuizAttemptDetailResponse> => {
    const payload: QuizSubmitPayload = {
      answers: answers.map((a) => {
        const questionId = a.attemptQuestionId ?? a.questionId;
        if (!questionId) {
          throw new Error('Mỗi câu trả lời bắt buộc phải có attemptQuestionId hoặc questionId');
        }
        return {
          attemptQuestionId: questionId,
          selectedAttemptOptionId: a.selectedAttemptOptionId ?? a.selectedOptionId ?? null,
          answerText: a.answerText ?? a.textAnswer ?? null,
        };
      }),
    };

    const response = await apiClient.post<ApiResponse<QuizAttemptDetailResponse>>(
      `/quiz-attempts/${attemptId}/submit`,
      payload
    );
    return response.data.data;
  },

  /**
   * Xem lại kết quả chi tiết của lượt thi qua mã publicId hoặc attemptId
   */
  getAttemptDetail: async (publicId: string | number): Promise<QuizAttemptDetailResponse> => {
    const response = await apiClient.get<ApiResponse<QuizAttemptDetailResponse>>(
      `/quiz-attempts/${publicId}/detail`
    );
    return response.data.data;
  },

  /**
   * Alias tương thích cho getQuizAttemptDetail
   */
  getQuizAttemptDetail: async (attemptId: string | number): Promise<QuizAttemptDetailResponse> => {
    const response = await apiClient.get<ApiResponse<QuizAttemptDetailResponse>>(
      `/quiz-attempts/${attemptId}/detail`
    );
    return response.data.data;
  },

  /**
   * Lấy lịch sử các lượt làm bài của người dùng hiện tại (hỗ trợ phân trang và lọc)
   */
  getQuizHistory: async (
    page = 0,
    size = 20,
    category?: string
  ): Promise<{ content: QuizAttemptResponse[]; totalElements: number; totalPages: number }> => {
    try {
      const response = await apiClient.get<ApiResponse<Page<QuizAttemptResponse>>>(
        '/quiz-attempts/my',
        {
          params: { page, size, sort: 'id,desc' },
        }
      );
      const pageData = response.data?.data;
      let content = pageData?.content || [];
      if (category && category !== 'ALL') {
        content = content.filter((item) => {
          if (category === 'PLACEMENT') return item.quizCategory === 'PLACEMENT';
          if (category === 'LEVEL_UP') return item.quizCategory === 'LEVEL_UP';
          if (category === 'FINAL') return item.quizCategory === 'FINAL' || item.quizCategory === 'FINAL_LEVEL';
          if (category === 'PRACTICE') return !item.quizCategory || item.quizCategory === 'PRACTICE';
          return true;
        });
      }
      return {
        content,
        totalElements: pageData?.totalElements ?? content.length,
        totalPages: pageData?.totalPages ?? 1,
      };
    } catch (error) {
      console.error('[quizService] Lỗi khi lấy lịch sử làm bài:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử các lượt làm bài của người dùng hiện tại (dạng mảng đơn giản)
   */
  getMyAttempts: async (page = 0, size = 10): Promise<QuizAttemptResponse[]> => {
    const response = await apiClient.get<ApiResponse<Page<QuizAttemptResponse>>>(
      '/quiz-attempts/my',
      {
        params: { page, size, sort: 'id,desc' },
      }
    );
    return response.data?.data?.content || [];
  },
};

