import { apiClient } from '../../../shared/lib/api';

export interface ExamTypeDTO {
  id: number;
  code: string;
  name: string;
  maxScaleScore: number;
}

export interface ProficiencyLevelDTO {
  id: number;
  examTypeId: number;
  code: string;
  name: string;
  minScore: number;
  maxScore: number;
  displayOrder: number;
}

export const examTypesApi = {
  getAll: async () => {
    const response = await apiClient.get<ExamTypeDTO[]>('/exam-types');
    return response.data;
  },

  getLevels: async (examTypeId: number) => {
    const response = await apiClient.get<ProficiencyLevelDTO[]>(`/exam-types/${examTypeId}/levels`);
    return response.data;
  },
};
