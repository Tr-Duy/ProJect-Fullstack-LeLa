export interface ApiResponse<T = void> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string | null;
}

export type UserRole = 'ADMIN' | 'CONTENT_CREATOR' | 'MODERATOR' | 'LEARNER';
export type DeckStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type CardProgressState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
export type SrsRating = 1 | 2 | 3 | 4; // 1: AGAIN, 2: HARD, 3: GOOD, 4: EASY
export type DeckDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type DeckVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
export type DeckDisplayMode = 'FRONT' | 'BACK' | 'RANDOM';

export interface ExamTypeDTO {
  id: number;
  code: string;
  name: string;
  maxScaleScore?: number;
}

export interface ProficiencyLevelDTO {
  id: number;
  examTypeId?: number;
  code: string;
  name: string;
  minScore?: number;
  maxScore?: number;
  displayOrder?: number;
  description?: string;
}

export interface UserInfo {
  id: string | number;
  username: string;
  fullName?: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  timezone?: string;
  dailyGoalCards?: number;
  nativeLanguageId?: number;
  targetLanguageId?: number;
  promptDailyGoal?: boolean;
  currentExamType?: ExamTypeDTO;
  currentLevel?: ProficiencyLevelDTO;
  xpTotal?: number;
  streakCurrent?: number;
  streakLongest?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface Page<T> {
  content: T[];
  pageable?: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last?: boolean;
  first?: boolean;
}

export interface LanguageResponse {
  id: number;
  languageCode: string;
  name: string;
  nativeName?: string;
  flagUrl?: string;
  isActive: boolean;
}

export interface TopicResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface TagResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  usageCount?: number;
}

export interface DeckResponse {
  id: number;
  deckCode: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  ownerId: number;
  languageId: number;
  topic?: TopicResponse;
  difficulty: DeckDifficulty;
  visibility: DeckVisibility;
  status: DeckStatus;
  isFeatured: boolean;
  totalCards: number;
  viewCount: number;
  enrollmentCount: number;
  displayMode: DeckDisplayMode;
  isActive: boolean;
  levelName?: string;
  levelCode?: string;
  tags?: TagResponse[];
}

export interface FlashcardResponse {
  id: number;
  deckId: number;
  frontText: string;
  backText: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  exampleText?: string;
  exampleTranslation?: string;
  relatedWords?: string;
  hint?: string;
  note?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  frontAudioUrl?: string;
  backAudioUrl?: string;
  cardOrder: number;
  isActive: boolean;
  cardColor?: string;
  tagIds?: number[];

  // Normalized
  word?: string;
  vietnameseMeaning?: string;
  exampleEn?: string;
  exampleVi?: string;
  definitionEn?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface DeckEnrollmentResponse {
  id: number;
  userId: number;
  deckId: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DROPPED';
  enrolledAt: string;
  lastStudiedAt?: string;
  nextReviewAt?: string;
  masteredCards: number;
  deckTitle?: string;
  deckSlug?: string;
  deckCoverImageUrl?: string;
  deckTotalCards?: number;
  deckDifficulty?: DeckDifficulty;
  deckLevelName?: string;
  deckLevelCode?: string;
}

export interface SrsReviewRequest {
  cardId: number;
  rating: SrsRating;
  responseMs?: number;
  reviewSessionId?: number;
  clientReviewedAt?: string;
  cramMode?: boolean;
}

export interface SrsReviewResponse {
  id: number;
  cardId: number;
  userId: number;
  rating: SrsRating;
  responseMs?: number;
  previousState?: CardProgressState;
  newState?: CardProgressState;
  intervalAfter?: number;
  dueAfter?: string;
  xpAwarded?: number;
}

export interface QuizOptionResponse {
  id: number;
  optionKey?: string;
  optionText: string;
  normalizedText?: string;
  isCorrect?: boolean | null;
  displayOrder?: number;
}

export interface QuizQuestionResponse {
  id: number;
  questionText: string;
  questionImageUrl?: string | null;
  questionAudioUrl?: string | null;
  questionType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | string;
  explanation?: string | null;
  points?: number;
  questionTimeLimitSeconds?: number | null;
  displayOrder?: number;
  options: QuizOptionResponse[];
}

export interface QuizAnswerResponse {
  id?: number;
  attemptQuestionId: number;
  selectedAttemptOptionId?: number | null;
  answerText?: string | null;
  normalizedAnswerText?: string | null;
  isCorrect?: boolean | null;
  pointsAwarded?: number;
  timeTakenSeconds?: number;
}

export interface QuizResponse {
  id: number;
  quizCode?: string;
  title: string;
  description?: string;
  quizType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'MIXED' | string;
  quizCategory?: 'PRACTICE' | 'PLACEMENT' | 'LEVEL_UP' | 'FINAL_ASSESSMENT' | string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitSeconds?: number;
  totalQuestions?: number;
  passScore?: number;
  isLocked?: boolean;
  remainingLockSeconds?: number;
  questions?: QuizQuestionResponse[];
}

export interface QuizAttemptResponse {
  id?: number;
  publicId: string;
  quizId: number;
  quizTitle: string;
  quizCategory?: 'PRACTICE' | 'PLACEMENT' | 'LEVEL_UP' | 'FINAL' | 'FINAL_LEVEL' | 'FINAL_ASSESSMENT' | string;
  userId?: number;
  userUsername?: string;
  levelAtAttempt?: ProficiencyLevelDTO;
  attemptNumber?: number;
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED' | 'EXPIRED' | string;
  startedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
  abandonedAt?: string;
  timeSpentSeconds?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  scorePoints?: number;
  scorePercent?: number;
  estimatedToeicScore?: number;
  maxScore?: number;
  passed?: boolean;
  xpAwarded?: number;
  version?: number;
}

export interface QuizAttemptDetailResponse {
  id: number;
  publicId: string;
  quizId: number;
  quizTitle: string;
  quizCategory?: 'PRACTICE' | 'PLACEMENT' | 'LEVEL_UP' | 'FINAL_ASSESSMENT' | string;
  userId?: number;
  userUsername?: string;
  attemptNumber?: number;
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED' | 'EXPIRED' | string;
  startedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
  timeSpentSeconds?: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePoints?: number;
  scorePercent: number;
  estimatedToeicScore?: number;
  bestEstimatedToeicScore?: number;
  maxScore?: number;
  passed: boolean;
  xpAwarded?: number;
  questions: QuizQuestionResponse[];
  answers?: QuizAnswerResponse[];
  levelUpPassed?: boolean;
  levelUpMessage?: string;
}

export interface QuizSubmitAnswerItem {
  attemptQuestionId?: number;
  questionId?: number;
  selectedAttemptOptionId?: number | null;
  selectedOptionId?: number | null;
  answerText?: string | null;
  textAnswer?: string | null;
}

export interface QuizSubmitPayload {
  answers: Array<{
    attemptQuestionId: number;
    selectedAttemptOptionId?: number | null;
    answerText?: string | null;
  }>;
}

export interface PlacementTestResult {
  scorePercent: number;
  correctAnswers: number;
  totalQuestions: number;
  correctRate: number;
  equivalentCorrect30?: number;
  estimatedToeicScore?: number;
  examType?: ExamTypeDTO;
  suggestedLevel?: ProficiencyLevelDTO;
  assignedLevel?: ProficiencyLevelDTO;
  isLowestLevel?: boolean;
  passed?: boolean;
  placementCompleted?: boolean;
  lowerLevels?: ProficiencyLevelDTO[];
  message?: string;
}

export interface DeckEligibilityItem {
  deckId: number;
  deckTitle: string;
  isCompleted: boolean;
  learnedCards: number;
  totalCards: number;
}

export interface FinalLevelAssessmentResponse {
  isEligible: boolean;
  currentLevelId?: number;
  currentLevelName?: string;
  totalDecks: number;
  completedDecks: number;
  cycleNumber: number;
  cycleStatus: 'IN_PROGRESS' | 'PASSED' | 'REQUIRES_REVIEW' | string;
  cooldownUntil?: string;
  cooldownRemainingSeconds?: number;
  lockMessage?: string;
  quizzes: QuizResponse[];
  decks?: DeckEligibilityItem[];
}

// Typing Game (Word Rain) Types
export type TypingGameMode = 'EASY' | 'HARD';
export type TypingGameRunStatus = 'IN_PROGRESS' | 'COMPLETED' | 'GAME_OVER' | 'ABANDONED';
export type TypingWordResult = 'PENDING' | 'CLEARED' | 'MISSED';

export interface TypingGameDeckDto {
  deckId: number;
  title: string;
  description?: string;
  slug?: string;
  cardColor?: string | null;
  totalCards: number;
  totalStages: number;
  requiresPro: boolean;
  isLocked: boolean;
  bestScoreEasy: number;
  bestScoreHard: number;
}

export interface StartTypingRunRequest {
  deckId: number;
  mode: TypingGameMode;
  forceRestart?: boolean;
  expandedChallenge?: boolean;
}

export interface TypingWordDto {
  flashcardId: number;
  word: string;
  meaning: string;
  phonetic?: string;
  audioUrl?: string;
  wordLength: number;
  isHeartWord: boolean;
}

export interface TypingRunResponse {
  publicId: string;
  deckId: number;
  deckTitle: string;
  mode: TypingGameMode;
  totalStages: number;
  livesLeft: number;
  currentStage: number;
  currentCombo: number;
  score: number;
  spawnIntervalMs: number;
  baseSpeed: number;
  words: TypingWordDto[];
}

export interface TypingWordEventDto {
  flashcardId: number;
  result: TypingWordResult;
  wrongKeystrokes: number;
  wrongAtIndexes?: number[];
  clientDurationMs: number;
}

export interface FinishTypingRunRequest {
  events?: TypingWordEventDto[];
  reason?: 'LIVES_DEPLETED' | 'VICTORY' | 'USER_QUIT' | string;
}

export interface TypingReviewWordDto {
  flashcardId: number;
  word: string;
  meaning: string;
  phonetic?: string;
  audioUrl?: string;
  exampleText?: string;
  exampleMeaning?: string;
  result: string;
  wrongKeystrokes: number;
}

export interface TypingRunResultResponse {
  publicId: string;
  deckId: number;
  deckTitle: string;
  mode: TypingGameMode;
  status: TypingGameRunStatus;
  score: number;
  stageReached: number;
  totalStages: number;
  wordsCleared: number;
  wordsMissed: number;
  accuracy: number;
  wpm: number;
  maxCombo: number;
  xpEarned: number;
  dailyXpRemaining: number;
  isNewHighScore: boolean;
  reviewWords: TypingReviewWordDto[];
}

export interface TypingLeaderboardEntryDto {
  rank: number;
  userId: number;
  displayName: string;
  avatarUrl?: string;
  score: number;
  stage: number;
  wpm: number;
  accuracy: number;
  achievedAt: string;
}

// AI Voice & Conversation Tutor Types
export interface VoiceUiConfigDto {
  allowTextFallback?: boolean;
  maxSttDurationSeconds?: number;
  speechRate?: number;
}

export interface VoiceStatusResponse {
  unlocked: boolean;
  learnedCardsCount?: number;
  requiredCardsCount?: number;
  remainingQuota: number;
  maxSessionsPerDay: number;
  maxDailyTurns?: number;
  usedTurns?: number;
  remainingTurns?: number;
  canStart?: boolean;
  nextResetAt?: string;
  currentLevel: number;
  initialBandMin?: number;
  highestLevel?: number;
  totalSessions?: number;
  consecutiveHardCount?: number;
  hasInProgressSession?: boolean;
  inProgressPublicId?: string;
  uiConfig?: VoiceUiConfigDto;
}

export interface ConversationScenarioDto {
  id: number;
  title: string;
  slug: string;
  levelMin?: number;
  levelMax?: number;
  aiRole?: string;
  userRole?: string;
  description?: string;
  openingLine?: string;
  isActive?: boolean;
}

export interface VoiceTargetWordDto {
  flashcardId: number;
  word: string;
  meaning?: string;
  phonetic?: string;
  usedCorrectly?: boolean;
  status?: string;
}

export interface VoiceStartRequest {
  scenarioSlug?: string;
  scenarioId?: number;
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
  uiConfig?: VoiceUiConfigDto;
}

export interface VoiceTurnRequest {
  transcript: string;
  userMessage?: string;
  sttConfidence?: number;
  clientElapsedSeconds?: number;
  isRetry?: boolean;
}

export interface VoiceTurnResponse {
  turnNumber: number;
  aiReply: string;
  grammarErrors?: string[];
  correctedSentence?: string;
  quickSuggestion?: string;
  updatedTargetWords?: VoiceTargetWordDto[];
  validTurnCount?: number;
  sessionEnded?: boolean;
  endReason?: string;
}

export interface VoiceTurnCorrectionDto {
  turnNumber: number;
  originalTranscript: string;
  errors?: string[];
  correctedText?: string;
}

export interface VoiceReportResponse {
  publicId: string;
  overallScore: number;
  pronunciationScore?: number | null;
  grammarScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  systemRecommendation?: 'INCREASE' | 'KEEP' | 'DECREASE' | string;
  userFeedback?: string;
  oldLevel?: number;
  newLevel?: number;
  xpAwarded?: number;
  consecutiveHardWarning?: boolean;
  targetWords?: VoiceTargetWordDto[];
  corrections?: VoiceTurnCorrectionDto[];
}

export interface ReviewStatsResponse {
  todayReviews: number;
  last7DaysReviews: number;
  totalCardsLearned: number;
  masteredCards: number;
  masteryPercentage: number;
}

export interface LeaderboardEntry {
  id?: number;
  userId: number;
  fullName: string;
  username: string;
  avatarUrl?: string;
  periodType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' | string;
  periodStart?: string;
  periodEnd?: string;
  xpScore?: number;
  quizScore?: number;
  streakDays?: number;
  cardsMastered?: number;
  totalScore?: number;
  rank?: number;
}

export interface DailyActivityStat {
  date: string;
  dayLabel: string;
  cardsCount: number;
  quizzesCount: number;
  xpGained: number;
}

export interface UserStudyStats {
  masteredWords: number;
  totalCardsLearned: number;
  masteryPercentage: number;
  streakCurrent: number;
  streakLongest: number;
  xpTotal: number;
  todayReviews: number;
  last7DaysReviews: number;
  totalTimeSpentMinutes: number;
  totalQuizzesCompleted: number;
  dailyActivities: DailyActivityStat[];
}

export interface SubscriptionPlanResponse {
  id: number;
  planCode: string;
  name: string;
  description: string;
  price: number;
  currencyCode: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string;
  billingIntervalCount: number;
  maxOwnedDecks: number;
  maxCardsPerDeck: number;
  maxDailyReviews: number;
  quizEnabled: boolean;
  leaderboardEnabled: boolean;
  offlineEnabled: boolean;
  featuresJson?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckoutRequest {
  planId: number;
}

export interface CheckoutResponse {
  paymentId: number;
  paymentCode: string;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  qrUrl: string;
  expiresAt: string;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | string;

export interface PaymentResponse {
  id: number;
  paymentCode?: string;
  providerTransactionId?: string;
  provider?: string;
  subscriptionId?: number;
  amount: number;
  currency?: string;
  currencyCode?: string;
  status: PaymentStatus;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrUrl?: string;
  paidAt?: string;
  createdAt: string;
  expiresAt?: string;
  planName?: string;
}

export type UserSubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';

export interface UserSubscriptionResponse {
  id: number;
  userId: number;
  planId: number;
  status: UserSubscriptionStatus;
  startedAt: string;
  expiresAt?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  autoRenew: boolean;
  provider?: string;
  providerSubscriptionId?: string;
  createdAt?: string;
  updatedAt?: string;
}


