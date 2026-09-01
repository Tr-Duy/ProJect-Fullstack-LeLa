export interface ApiResponse<T = void> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export type UserRole = 'ADMIN' | 'CONTENT_CREATOR' | 'MODERATOR' | 'LEARNER';
export type DeckStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type CardProgressState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
export type SrsGrade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface UserInfo {
  currentExamType?: any;
  currentLevel?: any;
  id: string;
  username: string;
  fullName?: string;
  email: string;
  roles: UserRole[];
  timezone?: string;
  dailyGoalCards?: number;
  nativeLanguageId?: number;
  targetLanguageId?: number;
  promptDailyGoal?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface LanguageResponse {
  id: number;
  languageCode: string;
  name: string;
  nativeName?: string;
  flagUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TagResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  deckCount?: number;
  cardCount?: number;
  usageCount?: number;
  createdAt: string;
}

export type DeckDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type DeckVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
export type DeckDisplayMode = 'FRONT' | 'BACK' | 'RANDOM';

export interface TopicResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface DeckResponse {
  examTypeId?: number;
  levelId?: number;
  levelName?: string;
  levelCode?: string;
  tags?: TagResponse[];
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
  rejectionReason?: string;
  isActive: boolean;
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
  tagIds: number[];
}

export type DeckEnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DROPPED';

export interface DeckEnrollmentResponse {
  id: number;
  userId: number;
  deckId: number;
  status: DeckEnrollmentStatus;
  enrolledAt: string;
  pausedAt?: string;
  completedAt?: string;
  droppedAt?: string;
  lastStudiedAt?: string;
  nextReviewAt?: string;
  masteredCards: number;
  note?: string;
  deckTitle?: string;
  deckSlug?: string;
  deckCoverImageUrl?: string;
  deckTotalCards?: number;
  deckDifficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  deckLevelName?: string;
  deckLevelCode?: string;
}

export type QuizType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'MIXED';
export type QuizCategory = 'NORMAL' | 'PLACEMENT' | 'FINAL' | 'LEVEL_UP' | 'FINAL_LEVEL';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';

export interface DeckEligibilityItem {
  id: number;
  deckCode: string;
  title: string;
  totalCards: number;
  masteredCards: number;
  isCompleted: boolean;
}

export interface FinalLevelAssessmentResponse {
  isEligible: boolean;
  currentLevelId?: number;
  currentLevelName?: string;
  totalDecks: number;
  completedDecks: number;
  cycleNumber: number;
  cycleStatus: 'IN_PROGRESS' | 'PASSED' | 'REQUIRES_REVIEW';
  cooldownUntil?: string;
  cooldownRemainingSeconds?: number;
  lockMessage?: string;
  quizzes: QuizResponse[];
  decks: DeckEligibilityItem[];
}

export interface QuizQuestionOptionResponse {
  id: number;
  questionId: number;
  optionKey: string;
  optionText: string;
  normalizedText?: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface QuizQuestionResponse {
  id: number;
  questionText: string;
  questionImageUrl?: string;
  questionType: QuestionType;
  explanation?: string;
  points: number;
  questionTimeLimitSeconds?: number;
  displayOrder: number;
  isActive: boolean;
  version?: number;
  options?: QuizQuestionOptionResponse[];
}

export interface QuizResponse {
  id: number;
  deckId?: number;
  quizCode: string;
  title: string;
  description?: string;
  quizType: QuizType;
  quizCategory?: QuizCategory;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  examTypeId?: number;
  levelId?: number;
  timeLimitSeconds?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  totalQuestions?: number;
  isActive?: boolean;
  passScore?: number;
  createdAt?: string;
  updatedAt?: string;
  questions?: QuizQuestionResponse[];
  isLocked?: boolean;
  lockedUntil?: string;
  lockReason?: string;
}

export interface SubscriptionPlanResponse {
  id: number;
  planCode: string;
  name: string;
  description?: string;
  price: number;
  currencyCode: string;
  billingCycle: string;
  billingIntervalCount: number;
  maxOwnedDecks?: number;
  maxCardsPerDeck?: number;
  maxDailyReviews?: number;
  quizEnabled: boolean;
  leaderboardEnabled: boolean;
  offlineEnabled: boolean;
  featuresJson?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementResponse {
  id: number;
  code: string;
  title: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  conditionType?: string;
  conditionValue?: number;
  xpReward?: number;
  isActive?: boolean;
  unlockedCount?: number;
}

export interface UserAchievementProgressResponse {
  id: number;
  code: string;
  title: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  conditionType?: string;
  conditionValue?: number;
  currentValue?: number;
  progressPercent?: number;
  xpReward?: number;
  isUnlocked?: boolean;
  unlockedAt?: string;
}
