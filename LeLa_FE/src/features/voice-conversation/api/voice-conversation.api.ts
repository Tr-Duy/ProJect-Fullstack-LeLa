import { apiClient as api } from '../../../shared/lib/api';

export interface VoiceStatusResponse {
  unlocked: boolean;
  learnedCardsCount: number;
  requiredCardsCount: number;
  remainingQuota: number;
  maxSessionsPerDay: number;
  nextResetAt: string;
  currentLevel: number;
  initialBandMin: number;
  highestLevel: number;
  totalSessions: number;
  consecutiveHardCount: number;
  hasInProgressSession: boolean;
  inProgressPublicId?: string | null;
  uiConfig: {
    ttsRate: number;
    bilingualSupport: boolean;
    autoHintOnSilence: boolean;
    silenceThresholdSeconds: number;
  };
}

export interface ConversationScenario {
  id: number;
  title: string;
  slug: string;
  levelMin: number;
  levelMax: number;
  aiRole: string;
  userRole: string;
  description: string;
  openingLine: string;
  isActive: boolean;
}

export interface VoiceTargetWordDto {
  flashcardId: number;
  word: string;
  meaning: string;
  phonetic?: string;
  usedCorrectly: boolean;
  status: 'USED_CORRECT' | 'USED_WRONG' | 'UNUSED';
}

export interface VoiceStartResponse {
  publicId: string;
  scenarioTitle: string;
  aiRole: string;
  userRole: string;
  openingLine: string;
  currentLevel: number;
  durationSecondsLimit: number;
  maxTurns: number;
  targetWords: VoiceTargetWordDto[];
  uiConfig: {
    ttsRate: number;
    bilingualSupport: boolean;
    autoHintOnSilence: boolean;
    silenceThresholdSeconds: number;
  };
}

export interface VoiceTurnResponse {
  turnNumber: number;
  aiReply: string;
  grammarErrors: string[];
  correctedSentence: string;
  quickSuggestion: string;
  updatedTargetWords: VoiceTargetWordDto[];
  validTurnCount: number;
  sessionEnded: boolean;
  endReason?: string;
}

export interface VoiceReportResponse {
  publicId: string;
  overallScore: number;
  pronunciationScore: number | null;
  grammarScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  systemRecommendation: 'INCREASE' | 'KEEP' | 'DECREASE';
  userFeedback: string;
  oldLevel: number;
  newLevel: number;
  xpAwarded: number;
  consecutiveHardWarning: boolean;
  targetWords: VoiceTargetWordDto[];
  corrections: {
    turnNumber: number;
    originalTranscript: string;
    errors: string[];
    correctedText: string;
  }[];
}

export const voiceConversationApi = {
  getStatus: () => api.get<VoiceStatusResponse>('/voice-conversations/status'),
  getScenarios: () => api.get<ConversationScenario[]>('/voice-conversations/scenarios'),
  startSession: (scenarioSlug?: string) =>
    api.post<VoiceStartResponse>('/voice-conversations/sessions/start', { scenarioSlug }),
  processTurn: (
    publicId: string,
    transcript: string,
    sttConfidence?: number,
    clientElapsedSeconds?: number,
    isRetry?: boolean
  ) =>
    api.post<VoiceTurnResponse>(`/voice-conversations/sessions/${publicId}/turns`, {
      transcript,
      sttConfidence,
      clientElapsedSeconds,
      isRetry,
    }),
  finishSession: (publicId: string, feedback?: string) =>
    api.post<VoiceReportResponse>(`/voice-conversations/sessions/${publicId}/finish`, { feedback }),
  abandonSession: (publicId: string) =>
    api.post(`/voice-conversations/sessions/${publicId}/abandon`),
};
