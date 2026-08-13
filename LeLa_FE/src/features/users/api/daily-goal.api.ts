import { apiClient } from '../../../shared/lib/api';

export interface DailyGoalStatusResponse {
    shouldShow: boolean;
    goalConfirmed: boolean;
    goalDate: string | null;
    targetCards: number | null;
}

export interface DailyGoalRequest {
    targetCards: number;
}

export const dailyGoalApi = {
    getStatus: async (): Promise<DailyGoalStatusResponse> => {
        const response = await apiClient.get('/users/me/daily-goal');
        return response.data;
    },

    confirmGoal: async (data: DailyGoalRequest): Promise<DailyGoalStatusResponse> => {
        const response = await apiClient.post('/users/me/daily-goal', data);
        return response.data;
    }
};
