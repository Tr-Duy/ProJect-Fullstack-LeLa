import { apiClient } from '../../../shared/lib/api';
import type { ExamTypeDTO, ProficiencyLevelDTO } from '../../master-data/api/exam-types.api';
 // Assuming User type is here, or we use any

export interface PlacementTestResult {
  scorePercent: number;
  correctAnswers?: number;
  totalQuestions?: number;
  correctRate?: number;
  equivalentCorrect30?: number;
  estimatedToeicScore?: number;
  isLowestLevel?: boolean;
  passed?: boolean;
  placementCompleted?: boolean;
  examType?: ExamTypeDTO;
  suggestedLevel?: ProficiencyLevelDTO;
  assignedLevel?: ProficiencyLevelDTO;
  lowerLevels?: ProficiencyLevelDTO[];
  message?: string;
}

export const onboardingApi = {
  submitPlacement: async (attemptPublicId: string) => {
    const response = await apiClient.post<PlacementTestResult>('/onboarding/submit-placement', {
      attemptPublicId,
    });
    return response.data;
  },

  manualSelectLevel: async (examTypeId: number, levelId: number) => {
    const response = await apiClient.post<any>('/onboarding/manual-select', {
      examTypeId,
      levelId,
    });
    return response.data;
  },
};
