export interface AdminScenario {
  id: number;
  topicId?: number;
  topicName?: string;
  title: string;
  slug: string;
  levelMin: number;
  levelMax: number;
  aiRole: string;
  userRole: string;
  description?: string;
  systemPromptTemplate: string;
  fallbackLinesJson?: string;
  fallbackLines?: string[];
  openingLine: string;
  isActive: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  sessionCount?: number;
}

export interface AdminScenarioRequest {
  topicId?: number;
  title: string;
  slug?: string;
  levelMin: number;
  levelMax: number;
  aiRole: string;
  userRole: string;
  description?: string;
  systemPromptTemplate: string;
  fallbackLines?: string[];
  fallbackLinesJson?: string;
  openingLine: string;
  isActive?: boolean;
  status?: 'PUBLISHED' | 'DRAFT';
}

export interface AdminVoiceSession {
  id: number;
  publicId: string;
  userId: number;
  username: string;
  userFullName: string;
  userEmail: string;
  scenarioId: number;
  scenarioTitle: string;
  levelAtStart: number;
  overallScore?: number;
  pronunciationScore?: number;
  grammarScore?: number;
  fluencyScore?: number;
  vocabularyScore?: number;
  userFeedback?: 'COMFORTABLE' | 'HARD' | 'EASY' | 'OK' | 'TOO_HARD' | 'TOO_EASY' | string;
  systemRecommendation?: 'INCREASE' | 'KEEP' | 'DECREASE' | string;
  durationSeconds: number;
  minutesUsed: number;
  validTurnCount: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  endedAt?: string;
  finishedAt?: string;
  xpAwarded?: number;
  aiTokensUsed?: number;
}

export interface AdminVoiceTurn {
  id: number;
  turnNumber: number;
  role: 'USER' | 'ASSISTANT';
  transcript: string;
  sttConfidence?: number;
  isValid: boolean;
  pronunciationScore?: number;
  grammarErrorsJson?: string;
  correctedText?: string;
  aiReply?: string;
  suggestionText?: string;
  audioUrl?: string;
  createdAt: string;
}

export interface AdminTargetWord {
  id: number;
  flashcardId: number;
  wordText: string;
  usedCount: number;
  usedCorrectly: boolean;
  status: string;
}

export interface AdminVoiceSessionDetail extends AdminVoiceSession {
  scenarioDescription?: string;
  aiRole?: string;
  userRole?: string;
  turns: AdminVoiceTurn[];
  targetWords: AdminTargetWord[];
}

export interface AdminQuotaLedgerEntry {
  id: number;
  userId: number;
  username: string;
  userFullName: string;
  userEmail: string;
  sessionId?: number;
  sessionPublicId?: string;
  scenarioTitle?: string;
  entryType: 'SESSION' | 'ADJUST';
  minutesUsed: number;
  usageDate: string;
  adminActorId?: number;
  adminActorName?: string;
  reason?: string;
  createdAt: string;
}

export interface AdminAdjustQuotaRequest {
  userId: number;
  minutes: number;
  reason: string;
}

export interface AdminUserQuotaSummary {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  totalSessionMinutes: number;
  totalAdjustedMinutes: number;
  netMinutes: number;
  todayUsedMinutes: number;
  remainingSessionsToday: number;
  currentLevel: number;
}

export interface AdminAiTutorMessage {
  id: number;
  senderType: 'LEARNER' | 'ADMIN' | 'AI' | 'GUEST';
  senderId?: number;
  senderName: string;
  content: string;
  isFallback: boolean;
  tokensUsed: number;
  createdAt: string;
}

export interface AdminAiTutorSession {
  id: number;
  userId?: number;
  username: string;
  userFullName: string;
  userEmail?: string;
  status: string;
  isFallbackTriggered: boolean;
  fallbackReason?: string;
  errorMessage?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: AdminAiTutorMessage[];
}

export interface AdminAiOverviewStats {
  totalVoiceSessions: number;
  completedVoiceSessions: number;
  abandonedVoiceSessions: number;
  totalVoiceMinutes: number;
  totalScenarios: number;
  publishedScenarios: number;
  totalAiTutorConversations: number;
  totalFallbackTriggeredConversations: number;
  totalActiveAiUsers: number;
}
