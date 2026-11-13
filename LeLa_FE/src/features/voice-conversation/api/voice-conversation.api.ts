import { apiClient as api } from '../../../shared/lib/api';

export interface VoiceSuggestion { difficulty: 'EASY' | 'MEDIUM' | 'CHALLENGE'; text: string }
export interface VoiceUiConfig {
  ttsRate: number; bilingualSupport: boolean; autoHintOnSilence: boolean; silenceThresholdSeconds: number;
  autoCommitSilenceMs?: number; incompleteExtraMs?: number; hintAfterSilenceMs?: number;
  inputModes?: string[]; configVersion?: string;
}

export interface VoiceStatusResponse {
  unlocked: boolean;
  learnedCardsCount: number;
  requiredCardsCount: number;
  remainingQuota: number;
  maxSessionsPerDay: number;
  maxDailyTurns?: number;
  usedTurns?: number;
  remainingTurns?: number;
  canStart?: boolean;
  nextResetAt: string;
  currentLevel: number;
  initialBandMin: number;
  highestLevel: number;
  totalSessions: number;
  consecutiveHardCount: number;
  hasInProgressSession: boolean;
  inProgressPublicId?: string | null;
  uiConfig: VoiceUiConfig;
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
  uiConfig: VoiceUiConfig;
}

export interface UserEvaluationDto {
  isGood?: boolean;
  score: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | string;
  grammarCheck: string;
  phoneticTip?: string;
  suggestedImprovement: string;
  hasError?: boolean;
}

export interface VoiceTurnResponse {
  feedbackLine?: string;
  suggestions?: VoiceSuggestion[];
  turnNumber: number;
  aiReply: string;
  grammarErrors?: string[];
  correctedSentence?: string;
  quickSuggestion?: string;
  updatedTargetWords: VoiceTargetWordDto[];
  validTurnCount: number;
  sessionEnded: boolean;
  endReason?: string;
  evaluation?: UserEvaluationDto | null;
  userEvaluation?: UserEvaluationDto | null;
  degraded?: boolean;
  errorCode?: string;
  intendedUtterance?: string;
  intentConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Client-only copy for the end-of-session review. */
  rawTranscript?: string;
  isCompleted?: boolean;
}

export interface VoiceReportResponse {
  vocabularyScoreAvailable?: boolean;
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
    phoneticTip?: string;
    assessmentAvailable?: boolean;
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
    isRetry?: boolean,
    alternatives?: string[],
    previousAiQuestion?: string,
    alternativeDetails?: { transcript: string; confidence: number }[]
  ) =>
    api.post<VoiceTurnResponse>(`/voice-conversations/sessions/${publicId}/turns`, {
      transcript,
      sttConfidence,
      clientElapsedSeconds,
      isRetry,
      alternatives,
      previousAiQuestion,
      alternativeDetails,
    }),
  finishSession: (publicId: string, feedback?: string) =>
    api.post<VoiceReportResponse>(`/voice-conversations/sessions/${publicId}/finish`, feedback ? { feedback } : {}),
  submitFeedback: (publicId: string, feedback: 'HARD' | 'COMFORTABLE' | 'EASY') =>
    api.post<VoiceReportResponse>(`/voice-conversations/sessions/${publicId}/feedback`, { feedback }),
  abandonSession: (publicId: string) =>
    api.post(`/voice-conversations/sessions/${publicId}/abandon`),
};
