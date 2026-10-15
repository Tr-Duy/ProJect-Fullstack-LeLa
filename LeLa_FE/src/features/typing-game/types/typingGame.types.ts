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
  wrongAtIndexes: number[];
  clientDurationMs: number;
}

export interface CompleteStageRequest {
  events: TypingWordEventDto[];
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
