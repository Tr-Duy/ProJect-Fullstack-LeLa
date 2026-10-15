import type { TypingWordDto, TypingWordEventDto, TypingGameMode } from '../types/typingGame.types';
import { soundManager } from './soundManager';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  text: string;
  subText?: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  strokeColor: string;
  fontSize: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number;
  color: string;
}

export interface ActiveWord {
  id: string; // ID duy nhất cho từng instance từ rơi
  flashcardId: number;
  word: string;
  meaning: string;
  phonetic?: string;
  audioUrl?: string;
  isHeartWord: boolean;
  laneIndex: number; // 0, 1, 2, 3 (4 Làn rơi cố định: 20%, 40%, 60%, 80%)
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  typedLength: number;
  revealedIndices: Set<number>;
  spawnTime: number;
  wrongKeystrokes: number;
  wrongAtIndexes: number[];
  isLocked: boolean;
  status: 'FALLING' | 'CLEARED' | 'MISSED';
  shakeTimer?: number;
}

export interface EngineCallbacks {
  onScoreUpdate: (score: number, combo: number, maxCombo: number) => void;
  onLivesUpdate: (lives: number) => void;
  onWordCleared: (word: ActiveWord) => void;
  onWordMissed: (word: ActiveWord) => void;
  onStageComplete: (events: TypingWordEventDto[]) => void;
  onGameOver: () => void;
  onProgressUpdate?: (resolved: number, target: number, currentMilestone: number, totalMilestones: number) => void;
}

export class TypingGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: TypingGameMode;
  private stageWords: TypingWordDto[] = [];
  private activeWords: ActiveWord[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private lasers: LaserBeam[] = [];
  private events: TypingWordEventDto[] = [];

  private spawnIntervalMs: number = 3000;
  private baseSpeed: number = 1.0;
  private lastSpawnTime: number = 0;
  private wordSpawnIndex: number = 0;
  private stageNo: number = 1;
  private totalStages: number = 5;
  private lastSpawnedWords: string[] = [];

  // Multi-word 4 Lanes & Screen Shake
  private readonly LANE_RATIOS: number[] = [0.20, 0.40, 0.60, 0.80];
  private lastSpawnedLane: number = -1;
  private screenShakeTimer: number = 0;

  // Milestone System
  private milestoneWordTargets: number[] = [0, 0, 0, 0, 0];
  private milestoneWordsResolved: number = 0;
  private milestoneWordsCleared: number = 0;

  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private lives: number = 3;

  private lockedWordId: string | null = null;
  private callbacks: EngineCallbacks;
  private isPaused: boolean = false;
  private isRunning: boolean = false;
  private isStageTransitioning: boolean = false;
  private stageCompleteReported: boolean = false;
  private transitionTitle: string = '';
  private transitionSubtitle: string = '';
  private transitionCountdown: string = '';
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    mode: TypingGameMode,
    callbacks: EngineCallbacks,
    initialLives: number = 3,
    initialCombo: number = 0,
    initialScore: number = 0
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.mode = mode;
    this.callbacks = callbacks;
    this.lives = initialLives;
    this.combo = initialCombo;
    this.maxCombo = initialCombo;
    this.score = initialScore;
  }

  public initStage(
    words: TypingWordDto[],
    spawnIntervalMs: number,
    baseSpeed: number,
    currentCombo: number,
    currentScore: number,
    livesLeft: number,
    stageNo: number = 1,
    totalStages: number = 5,
    allDeckWords?: TypingWordDto[]
  ) {
    this.stageNo = stageNo || 1;
    this.totalStages = totalStages || 5;

    // 1. THUẬT TOÁN PHÂN BỔ TỪ CHO 5 MỐC:
    const pool = allDeckWords && allDeckWords.length > 0 ? allDeckWords : words;
    const total = pool ? pool.length : 0;
    const baseCount = Math.floor(total / 5);
    const remainder = total % 5;
    // Mảng lưu số từ cần hoàn thành của từng mốc [m1, m2, m3, m4, m5]
    this.milestoneWordTargets = Array.from({ length: 5 }, (_, i) => baseCount + (i < remainder ? 1 : 0));

    // Nếu nhận toàn bộ kho từ của bộ thẻ, tự động cắt lát cho mốc tương ứng
    if (allDeckWords && allDeckWords.length > 0) {
      const startIdx = this.milestoneWordTargets.slice(0, this.stageNo - 1).reduce((a, b) => a + b, 0);
      const stageCount = this.milestoneWordTargets[this.stageNo - 1] || baseCount;
      this.stageWords = allDeckWords.slice(startIdx, startIdx + stageCount);
    } else {
      this.stageWords = words ? [...words] : [];
      if (this.stageWords.length > 0) {
        this.milestoneWordTargets[this.stageNo - 1] = this.stageWords.length;
      }
    }

    this.milestoneWordsResolved = 0;
    this.milestoneWordsCleared = 0;

    // Tính toán độ khó lũy tiến theo mốc:
    // Mốc 1 - 2: spawnInterval 2.5s - 3.0s
    // Mốc 3 - 5: spawnInterval 1.8s - 2.0s
    // Mốc 6+: spawnInterval 1.2s - 1.5s
    if (spawnIntervalMs && spawnIntervalMs > 0) {
      this.spawnIntervalMs = spawnIntervalMs;
    } else {
      if (this.stageNo <= 1) this.spawnIntervalMs = 2800;
      else if (this.stageNo === 2) this.spawnIntervalMs = 2500;
      else if (this.stageNo <= 4) this.spawnIntervalMs = 2000;
      else if (this.stageNo === 5) this.spawnIntervalMs = 1800;
      else this.spawnIntervalMs = Math.max(1200, 1500 - (this.stageNo - 6) * 60);
    }

    this.baseSpeed = baseSpeed || (1.0 + (this.stageNo - 1) * 0.15);
    this.combo = currentCombo;
    this.score = currentScore;
    this.lives = livesLeft;
    this.activeWords = [];
    this.particles = [];
    this.floatingTexts = [];
    this.lasers = [];
    this.events = [];
    this.wordSpawnIndex = 0;
    this.lockedWordId = null;
    this.isStageTransitioning = false;
    this.stageCompleteReported = false;
    this.transitionTitle = '';
    this.transitionSubtitle = '';
    this.transitionCountdown = '';

    // Kích hoạt spawn từ đầu tiên sau 300ms
    this.lastSpawnTime = 0;

    // Phát sự kiện cập nhật tiến trình ban đầu của mốc
    const targetWords = this.milestoneWordTargets[this.stageNo - 1] || this.stageWords.length;
    this.callbacks.onProgressUpdate?.(0, targetWords, this.stageNo, this.totalStages);

    // Đảm bảo game engine đang chạy loop
    if (!this.isRunning) {
      this.start();
    }
  }

  public loadStageWords(
    words: TypingWordDto[],
    spawnIntervalMs: number,
    baseSpeed: number,
    currentCombo?: number,
    currentScore?: number,
    livesLeft?: number,
    stageNo?: number,
    totalStages?: number
  ) {
    this.initStage(
      words,
      spawnIntervalMs,
      baseSpeed,
      currentCombo !== undefined ? currentCombo : this.combo,
      currentScore !== undefined ? currentScore : this.score,
      livesLeft !== undefined ? livesLeft : this.lives,
      stageNo !== undefined ? stageNo : this.stageNo + 1,
      totalStages !== undefined ? totalStages : this.totalStages
    );
  }

  // Giới hạn số lượng từ cùng rơi song song trên 4 làn theo mốc
  private getMaxConcurrency(): number {
    if (this.stageNo <= 1) return 2; // Mốc 1: Rơi 2 từ đồng thời
    if (this.stageNo <= 3) return 3; // Mốc 2 & 3: Rơi 2–3 từ đồng thời
    return 4; // Mốc 4 & 5: Rơi 3–4 từ đồng thời với tốc độ nhanh dần
  }

  // Lấy tọa độ tâm X của làn rơi cố định
  private getLaneCenterX(laneIndex: number, canvasWidth: number): number {
    const ratio = this.LANE_RATIOS[Math.max(0, Math.min(3, laneIndex))];
    return canvasWidth * ratio;
  }

  public showStageTransition(title: string, subtitle: string, countdown: string = '') {
    this.isStageTransitioning = true;
    this.transitionTitle = title;
    this.transitionSubtitle = subtitle;
    this.transitionCountdown = countdown;
  }

  public updateTransitionCountdown(countdown: string) {
    this.transitionCountdown = countdown;
  }

  public clearStageTransition() {
    this.isStageTransitioning = false;
    this.transitionTitle = '';
    this.transitionSubtitle = '';
    this.transitionCountdown = '';
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastFrameTime = performance.now();
      if (this.animationFrameId === null) {
        this.animationFrameId = requestAnimationFrame(this.loop);
      }
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public handleKeyDown(e: KeyboardEvent | string): boolean {
    if (this.isPaused || !this.isRunning) return false;

    const rawKey = typeof e === 'string' ? e : e.key;

    // 1. Xử lý Backspace: Nhả khóa mục tiêu hiện tại
    if (rawKey === 'Backspace') {
      if (this.lockedWordId !== null) {
        const current = this.activeWords.find((w) => w.id === this.lockedWordId);
        if (current && current.status === 'FALLING') {
          current.typedLength = 0;
          current.isLocked = false;
        }
        this.lockedWordId = null;
      }
      if (typeof e !== 'string') e.preventDefault();
      return true;
    }

    // Bỏ qua các phím điều khiển (Shift, Ctrl, Alt, v.v.)
    if (!rawKey || rawKey.length !== 1) return false;
    const key = rawKey.toLowerCase();
    if (typeof e !== 'string') e.preventDefault();

    // 2. TRƯỜNG HỢP: ĐÃ CÓ MỤC TIÊU ĐANG KHÓA
    if (this.lockedWordId !== null) {
      const target = this.activeWords.find((w) => w.id === this.lockedWordId);
      if (!target || target.status !== 'FALLING') {
        this.lockedWordId = null; // Từ đã nổ hoặc chạm đáy
      } else {
        const cleanWord = target.word.trim();
        this.advanceSpecialChars(target);
        const expectedChar = cleanWord[target.typedLength]?.toLowerCase();

        if (key === expectedChar) {
          target.typedLength++;
          soundManager.playCorrectHit();
          soundManager.playLaser();
          this.createLaser(target.x + target.width / 2, target.y + target.height / 2);
          this.combo++;
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;

          this.advanceSpecialChars(target);

          // Đã gõ xong toàn bộ từ:
          if (target.typedLength >= cleanWord.length) {
            this.handleWordCleared(target);
            this.lockedWordId = null; // Giải phóng khóa
          } else {
            this.callbacks.onScoreUpdate(this.score, this.combo, this.maxCombo);
          }
        } else {
          // Gõ sai ký tự tiếp theo:
          soundManager.playWrongBuzz();
          this.combo = 0; // Reset combo
          target.wrongKeystrokes = (target.wrongKeystrokes || 0) + 1;
          target.wrongAtIndexes.push(target.typedLength);
          target.shakeTimer = 0.2; // Rung nhẹ báo lỗi
          this.createMistakeParticles(target.x + target.width / 2, target.y + target.height / 2);
          this.callbacks.onScoreUpdate(this.score, this.combo, this.maxCombo);
        }
        // QUAN TRỌNG: TUYỆT ĐỐI RETURN TẠI ĐÂY! Không tìm kiếm từ khác khi đang khóa!
        return true;
      }
    }

    // 3. TRƯỜNG HỢP: CHƯA CÓ MỤC TIÊU (Tìm từ khớp ký tự đầu)
    const candidates = this.activeWords.filter((w) => {
      if (w.status !== 'FALLING') return false;
      const clean = w.word.trim();
      return clean.length > 0 && clean[0].toLowerCase() === key;
    });

    if (candidates.length > 0) {
      // Ưu tiên từ rơi gần đáy nhất (y lớn nhất)
      candidates.sort((a, b) => b.y - a.y);
      const chosen = candidates[0];

      // Đảm bảo không còn từ nào khác giữ cờ isLocked
      for (let i = 0; i < this.activeWords.length; i++) {
        this.activeWords[i].isLocked = false;
      }

      this.lockedWordId = chosen.id;
      chosen.isLocked = true;
      chosen.typedLength = 1; // TIÊU THỤ NGAY KÝ TỰ ĐẦU TIÊN
      soundManager.playCorrectHit();
      soundManager.playLaser();
      this.createLaser(chosen.x + chosen.width / 2, chosen.y + chosen.height / 2);
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      this.advanceSpecialChars(chosen);

      // Trường hợp đặc biệt: từ chỉ có 1 chữ cái
      if (chosen.typedLength >= chosen.word.trim().length) {
        this.handleWordCleared(chosen);
        this.lockedWordId = null;
      } else {
        this.callbacks.onScoreUpdate(this.score, this.combo, this.maxCombo);
      }
      return true;
    } else {
      // Gõ phím không khớp chữ đầu của bất kỳ từ nào
      soundManager.playWrongBuzz();
      this.combo = 0;
      this.callbacks.onScoreUpdate(this.score, this.combo, this.maxCombo);
      return false;
    }
  }

  // Tự động bỏ qua dấu cách, gạch ngang, dấu nháy nếu có trong từ
  private advanceSpecialChars(word: ActiveWord) {
    while (word.typedLength < word.word.length) {
      const ch = word.word.charAt(word.typedLength);
      if (ch === ' ' || ch === '-' || ch === '\'' || ch === '’') {
        word.typedLength++;
      } else {
        break;
      }
    }
  }

  private handleWordCleared(word: ActiveWord) {
    word.status = 'CLEARED';
    word.isLocked = false;
    if (this.lockedWordId === word.id) {
      this.lockedWordId = null;
    }
    soundManager.playWordExplosion();
    soundManager.speakWord(word.word, word.audioUrl);
    this.createExplosion(word.x + word.width / 2, word.y + word.height / 2, word.isHeartWord ? '#FF4081' : '#2A8B9D');

    // Điểm cơ bản
    let wordScore = word.word.length * 10;
    let multiplier = 1.0;
    if (this.combo >= 20) multiplier = 3.0;
    else if (this.combo >= 10) multiplier = 2.0;
    wordScore = Math.round(wordScore * multiplier);

    if (word.wrongKeystrokes === 0) {
      wordScore += 50; // Perfect bonus
    }

    if (word.isHeartWord) {
      if (this.lives < 5) {
        this.lives++;
        soundManager.playHeartUp();
        this.callbacks.onLivesUpdate(this.lives);
      } else {
        wordScore += 100; // Max lives bonus
      }
    }

    this.score += wordScore;
    this.milestoneWordsResolved++;
    this.milestoneWordsCleared++;

    const targetWords = this.milestoneWordTargets[this.stageNo - 1] || this.stageWords.length;
    this.callbacks.onProgressUpdate?.(this.milestoneWordsResolved, targetWords, this.stageNo, this.totalStages);
    this.callbacks.onScoreUpdate(this.score, this.combo, this.maxCombo);
    this.callbacks.onWordCleared(word);

    // Hiệu ứng chữ nổi nghĩa tiếng Việt (Floating Vietnamese Meaning)
    const meaningText = word.meaning || word.word;
    this.addFloatingText({
      text: meaningText,
      subText: word.word,
      x: word.x + word.width / 2,
      y: word.y + word.height / 2,
      vy: -28, // Trôi nhẹ lên trên
      life: 1.4,
      maxLife: 1.4,
      color: '#22C55E', // Xanh lá sáng rực rỡ
      strokeColor: '#000000',
      fontSize: 18,
    });

    const durationMs = Math.round(performance.now() - word.spawnTime);
    this.events.push({
      flashcardId: word.flashcardId,
      result: 'CLEARED',
      wrongKeystrokes: word.wrongKeystrokes,
      wrongAtIndexes: [...word.wrongAtIndexes],
      clientDurationMs: Math.max(250, durationMs),
    });

    this.checkStageFinished();
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) {
      this.animationFrameId = null;
      return;
    }

    if (this.isPaused) {
      this.animationFrameId = null;
      return;
    }

    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    try {
      this.update(dt, currentTime);
      this.render();
    } catch (err) {
      console.warn('Game engine loop error:', err);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, currentTime: number) {
    // 1. Spawning words: Duy trì liên tục 2–3 từ cùng rơi song song trên màn hình ở các làn khác nhau
    const currentFallingCount = this.activeWords.filter((w) => w.status === 'FALLING').length;
    const maxAllowed = this.getMaxConcurrency();

    if (this.wordSpawnIndex < this.stageWords.length && currentFallingCount < maxAllowed) {
      // Khi số từ đang rơi < 2, giảm khoảng cách spawn (khoảng 700ms) để nhanh chóng phủ 2–3 từ song song
      const effectiveInterval =
        currentFallingCount < 2 ? Math.min(750, this.spawnIntervalMs * 0.35) : this.spawnIntervalMs;

      if (this.lastSpawnTime === 0 || currentTime - this.lastSpawnTime >= effectiveInterval) {
        this.spawnNextWord(currentTime);
        this.lastSpawnTime = currentTime;
      }
    }

    // Cập nhật hiệu ứng rung màn hình
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer = Math.max(0, this.screenShakeTimer - dt);
    }

    const canvasHeight = this.canvas.height;

    // 2. Update active words position and progress (MUTATE IN PLACE)
    for (let i = 0; i < this.activeWords.length; i++) {
      const word = this.activeWords[i];
      if (word.status !== 'FALLING') continue;

      word.y += word.speed * 60 * dt;

      if (word.shakeTimer && word.shakeTimer > 0) {
        word.shakeTimer = Math.max(0, word.shakeTimer - dt);
      }

      // In HARD mode, reveal letters on 25% and 50% fall distance
      if (this.mode === 'HARD') {
        const fallRatio = Math.max(0, word.y / (canvasHeight - 60));
        const maxRevealCount = Math.floor(word.word.length / 2);
        let desiredReveals = 0;
        if (fallRatio >= 0.5) {
          desiredReveals = maxRevealCount;
        } else if (fallRatio >= 0.25) {
          desiredReveals = Math.min(1, maxRevealCount);
        }

        while (word.revealedIndices.size < desiredReveals) {
          const unrevealed: number[] = [];
          for (let j = 0; j < word.word.length; j++) {
            if (!word.revealedIndices.has(j)) {
              unrevealed.push(j);
            }
          }
          if (unrevealed.length === 0) break;
          const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          word.revealedIndices.add(pick);
        }
      }

      // 3. Collision with bottom boundary (Missed word)
      if (word.y >= canvasHeight - 50) {
        word.status = 'MISSED';
        word.isLocked = false;
        if (this.lockedWordId === word.id) {
          this.lockedWordId = null;
        }
        this.combo = 0;
        this.lives--;
        this.milestoneWordsResolved++;
        this.screenShakeTimer = 0.35; // Rung màn hình khi rớt từ

        soundManager.playMissedHit();
        this.createBottomExplosion(word.x + word.width / 2, canvasHeight - 30);

        const targetWords = this.milestoneWordTargets[this.stageNo - 1] || this.stageWords.length;
        this.callbacks.onProgressUpdate?.(this.milestoneWordsResolved, targetWords, this.stageNo, this.totalStages);
        this.callbacks.onLivesUpdate(this.lives);
        this.callbacks.onScoreUpdate(this.score, this.combo, this.maxCombo);
        this.callbacks.onWordMissed(word);

        // Hiệu ứng chữ đỏ nổi thông báo từ bị bỏ lỡ
        const meaningText = word.meaning ? `${word.word} (${word.meaning})` : word.word;
        this.addFloatingText({
          text: meaningText,
          x: word.x + word.width / 2,
          y: canvasHeight - 60,
          vy: -22,
          life: 1.5,
          maxLife: 1.5,
          color: '#EF4444', // Đỏ cảnh báo
          strokeColor: '#000000',
          fontSize: 16,
        });

        const durationMs = Math.round(performance.now() - word.spawnTime);
        this.events.push({
          flashcardId: word.flashcardId,
          result: 'MISSED',
          wrongKeystrokes: word.wrongKeystrokes,
          wrongAtIndexes: [...word.wrongAtIndexes],
          clientDurationMs: Math.max(250, durationMs),
        });

        if (this.lives <= 0) {
          soundManager.playGameOver();
          this.isRunning = false;
          this.callbacks.onGameOver();
          return;
        }

        this.checkStageFinished();
      }
    }

    // 4. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Update floating text effects (Vietnamese meanings)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 6. Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.progress += dt * 8.0;
      l.currentX = l.startX + (l.targetX - l.startX) * Math.min(l.progress, 1.0);
      l.currentY = l.startY + (l.targetY - l.startY) * Math.min(l.progress, 1.0);
      if (l.progress >= 1.0) {
        this.lasers.splice(i, 1);
      }
    }
  }

  public addFloatingText(item: FloatingText) {
    this.floatingTexts.push(item);
  }

  private spawnNextWord(currentTime: number) {
    if (this.wordSpawnIndex >= this.stageWords.length) return;
    const rawWord = this.stageWords[this.wordSpawnIndex++];
    if (!rawWord) return;

    // Lưu vết 3 từ gần nhất để tránh lặp khi tái chế vòng mới
    this.lastSpawnedWords.push(rawWord.word.toLowerCase());
    if (this.lastSpawnedWords.length > 5) {
      this.lastSpawnedWords.shift();
    }

    this.ctx.font = 'bold 20px Inter, sans-serif';
    const textWidth = Math.max(80, this.ctx.measureText(rawWord.word).width);
    const boxWidth = textWidth + 36;
    const boxHeight = this.mode === 'HARD' ? 62 : 46;
    const canvasWidth = this.canvas.width;

    // 4 LÀN RƠI CỐ ĐỊNH (LANES):
    // Tìm các làn chưa có từ nào đang rơi gần đỉnh (y < 140px)
    const occupiedLanes = new Set<number>();
    for (const w of this.activeWords) {
      if (w.status === 'FALLING' && w.y < 140) {
        occupiedLanes.add(w.laneIndex);
      }
    }

    const availableLanes = [0, 1, 2, 3].filter((lane) => !occupiedLanes.has(lane));
    let chosenLane: number;

    if (availableLanes.length > 0) {
      // Ưu tiên chọn làn khác với làn vừa spawn gần nhất để phân bố đều 4 làn
      const diffLanes = availableLanes.filter((lane) => lane !== this.lastSpawnedLane);
      const pool = diffLanes.length > 0 ? diffLanes : availableLanes;
      chosenLane = pool[Math.floor(Math.random() * pool.length)];
    } else {
      // Nếu cả 4 làn đều có từ, chọn làn mà từ đang ở vị trí thấp nhất (y lớn nhất)
      let bestLane = 0;
      let maxY = -9999;
      for (let l = 0; l < 4; l++) {
        const wordsInLane = this.activeWords.filter((w) => w.status === 'FALLING' && w.laneIndex === l);
        const minY = wordsInLane.length > 0 ? Math.min(...wordsInLane.map((w) => w.y)) : 9999;
        if (minY > maxY) {
          maxY = minY;
          bestLane = l;
        }
      }
      chosenLane = bestLane;
    }

    this.lastSpawnedLane = chosenLane;

    // Tính tọa độ X căn giữa theo làn rơi cố định (15-25%, 35-45%, 55-65%, 75-85%)
    const laneCenter = this.getLaneCenterX(chosenLane, canvasWidth) + (Math.random() - 0.5) * (canvasWidth * 0.03);
    const bestX = Math.max(12, Math.min(canvasWidth - boxWidth - 12, laneCenter - boxWidth / 2));

    // Tốc độ rơi dựa trên baseSpeed và độ dài từ
    const fallSpeed = (0.65 + this.baseSpeed * 0.35) * (1.0 + (rawWord.word.length > 8 ? 0.08 : 0.0));
    const instanceId = `${rawWord.flashcardId}_${currentTime}_${Math.random().toString(36).substring(2, 8)}`;

    this.activeWords.push({
      id: instanceId,
      flashcardId: rawWord.flashcardId,
      word: rawWord.word,
      meaning: rawWord.meaning,
      phonetic: rawWord.phonetic,
      audioUrl: rawWord.audioUrl,
      isHeartWord: rawWord.isHeartWord,
      laneIndex: chosenLane,
      x: bestX,
      y: -boxHeight,
      width: boxWidth,
      height: boxHeight,
      speed: fallSpeed,
      typedLength: 0,
      revealedIndices: new Set<number>(),
      spawnTime: currentTime,
      wrongKeystrokes: 0,
      wrongAtIndexes: [],
      isLocked: false,
      status: 'FALLING',
      shakeTimer: 0,
    });
  }

  private checkStageFinished() {
    const allSpawned = this.wordSpawnIndex >= this.stageWords.length;
    const allResolved =
      this.activeWords.length > 0 &&
      this.activeWords.every((w) => w.status === 'CLEARED' || w.status === 'MISSED');

    if (allSpawned && allResolved && !this.stageCompleteReported) {
      this.stageCompleteReported = true;
      const isVictory = this.stageNo >= this.totalStages;

      if (isVictory) {
        soundManager.playVictory();
        this.createVictoryCelebrationParticles();
        this.showStageTransition(
          '🏆 CHIẾN THẮNG BỘ THẺ!',
          `BẠN ĐÃ CHINH PHỤC TOÀN BỘ ${this.totalStages} MỐC VÀ KHO TỪ VỰNG!`,
          'VICTORY!'
        );
      } else {
        soundManager.playStageClear();
        this.createMilestoneCelebrationParticles();
        this.showStageTransition(
          `🎉 HOÀN THÀNH MỐC ${this.stageNo} / ${this.totalStages}!`,
          `CHUẨN BỊ MỐC ${this.stageNo + 1} (TỐC ĐỘ TĂNG +15%)`,
          '3...'
        );
      }

      this.callbacks.onStageComplete([...this.events]);
    }
  }

  private render() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    // Hiệu ứng Rung màn hình (Screen Shake)
    if (this.screenShakeTimer > 0) {
      const intensity = (this.screenShakeTimer / 0.35) * 8; // Rung biên độ tối đa 8px
      const shakeX = (Math.random() - 0.5) * intensity;
      const shakeY = (Math.random() - 0.5) * intensity;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Space Background
    this.ctx.fillStyle = '#0F172A';
    this.ctx.fillRect(0, 0, width, height);

    // 1.1 Vạch phân cách 4 làn rơi (Subtle Futuristic Lane Guides)
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 8]);
    const laneDividers = [0.30, 0.50, 0.70];
    for (const ratio of laneDividers) {
      const lx = width * ratio;
      this.ctx.beginPath();
      this.ctx.moveTo(lx, 60);
      this.ctx.lineTo(lx, height - 40);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Bottom danger zone indicator line
    this.ctx.beginPath();
    this.ctx.moveTo(0, height - 40);
    this.ctx.lineTo(width, height - 40);
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 6]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 2. Draw Spaceship at bottom center
    const shipX = width / 2;
    const shipY = height - 25;
    this.drawSpaceship(shipX, shipY);

    // 3. Draw Laser Beams
    for (const laser of this.lasers) {
      this.ctx.beginPath();
      this.ctx.moveTo(laser.startX, laser.startY);
      this.ctx.lineTo(laser.currentX, laser.currentY);
      this.ctx.strokeStyle = laser.color;
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = laser.color;
      this.ctx.shadowBlur = 10;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    // 4. Draw Falling Words
    for (const word of this.activeWords) {
      if (word.status !== 'FALLING') continue;
      this.drawWordBox(word);
    }

    // 5. Draw Particles
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    }

    // 6. Draw Floating Text Feedback (Vietnamese Meanings)
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Chữ nghĩa tiếng Việt chính
      this.ctx.font = `bold ${ft.fontSize}px Inter, sans-serif`;
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = ft.strokeColor;
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillStyle = ft.color;
      this.ctx.fillText(ft.text, ft.x, ft.y);

      // Chữ phụ (tiếng Anh) nếu có
      if (ft.subText) {
        this.ctx.font = 'bold 12px Inter, sans-serif';
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#000000';
        this.ctx.strokeText(ft.subText, ft.x, ft.y - 18);
        this.ctx.fillStyle = '#CBD5E1';
        this.ctx.fillText(ft.subText, ft.x, ft.y - 18);
      }

      this.ctx.restore();
    }

    // 7. Draw Live Milestone Progress Bar at Top
    this.drawMilestoneProgressBar(width, height);

    // 8. Draw Stage Transition Overlay Banner (nếu đang chuyển mốc hoặc chiến thắng)
    if (this.isStageTransitioning) {
      this.drawStageTransitionBanner(width, height);
    }

    this.ctx.restore();
  }

  private drawMilestoneProgressBar(width: number, _height?: number) {
    this.ctx.save();

    const barWidth = Math.min(500, width - 32);
    const barHeight = 44;
    const barX = (width - barWidth) / 2;
    const barY = 12;

    const targetWords = this.milestoneWordTargets[this.stageNo - 1] || (this.stageWords.length > 0 ? this.stageWords.length : 1);
    const resolved = Math.min(this.milestoneWordsResolved, targetWords);
    const remaining = Math.max(0, targetWords - resolved);
    const progressPercent = targetWords > 0 ? Math.min(1.0, resolved / targetWords) : 0;

    // 1. Nền Capsule chính (Neo-brutalist / Cyberpunk HUD frame)
    this.ctx.beginPath();
    this.ctx.roundRect(barX, barY, barWidth, barHeight, 22);
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    this.ctx.stroke();

    // 2. Huy hiệu Mốc (Milestone Badge) bên trái
    const badgeWidth = 92;
    const badgeHeight = 30;
    const badgeX = barX + 7;
    const badgeY = barY + (barHeight - badgeHeight) / 2;

    this.ctx.beginPath();
    this.ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 15);
    this.ctx.fillStyle = '#F59E0B'; // Vàng cam ấm
    this.ctx.fill();

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = '900 12px Inter, sans-serif';
    this.ctx.fillStyle = '#1E1B18';
    this.ctx.fillText(`MỐC ${this.stageNo} / ${this.totalStages}`, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

    // 3. Nhãn số từ bên phải: "Còn X từ" hoặc "ĐỦ ĐIỂM MỐC"
    const remainingText = remaining === 0 ? '✔ QUA MỐC' : `Còn ${remaining} từ`;
    this.ctx.font = 'bold 12px Inter, sans-serif';
    const textWidth = this.ctx.measureText(remainingText).width;
    const textX = barX + barWidth - 14;
    const textY = barY + barHeight / 2 - 4;

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = remaining === 0 ? '#22C55E' : '#38BDF8';
    this.ctx.fillText(remainingText, textX, textY);

    // Dòng phụ hiển thị tỷ lệ đã gõ (ví dụ: "4/10 từ")
    this.ctx.font = 'bold 10px Inter, sans-serif';
    this.ctx.fillStyle = '#94A3B8';
    this.ctx.fillText(`${resolved} / ${targetWords} từ`, textX, textY + 14);

    // 4. Thanh tiến trình (Progress Bar Track) ở giữa
    const trackX = badgeX + badgeWidth + 14;
    const trackRight = barX + barWidth - textWidth - 28;
    const trackWidth = Math.max(70, trackRight - trackX);
    const trackHeight = 10;
    const trackY = barY + (barHeight - trackHeight) / 2 - 3;

    // Track Background
    this.ctx.beginPath();
    this.ctx.roundRect(trackX, trackY, trackWidth, trackHeight, 5);
    this.ctx.fillStyle = 'rgba(51, 65, 85, 0.9)';
    this.ctx.fill();

    // Track Fill (Gradient cyan to emerald)
    const fillWidth = Math.max(0, Math.min(trackWidth, trackWidth * progressPercent));
    if (fillWidth > 0) {
      this.ctx.beginPath();
      this.ctx.roundRect(trackX, trackY, fillWidth, trackHeight, 5);
      const grad = this.ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
      grad.addColorStop(0, '#06B6D4');
      grad.addColorStop(1, '#22C55E');
      this.ctx.fillStyle = grad;
      this.ctx.shadowColor = '#22C55E';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // 5. Năm chấm tròn trạng thái 5 mốc phía dưới thanh tiến trình
    const dotsCount = Math.min(5, this.totalStages);
    const dotSpacing = trackWidth / (dotsCount - 1 || 1);
    const dotY = trackY + trackHeight + 6;

    for (let i = 0; i < dotsCount; i++) {
      const dx = trackX + i * dotSpacing;
      const milestoneIndex = i + 1;
      this.ctx.beginPath();
      this.ctx.arc(dx, dotY, 3, 0, Math.PI * 2);

      if (milestoneIndex < this.stageNo) {
        // Đã qua: Xanh lá sáng
        this.ctx.fillStyle = '#22C55E';
      } else if (milestoneIndex === this.stageNo) {
        // Mốc hiện tại: Vàng phát sáng
        this.ctx.fillStyle = '#FBBF24';
        this.ctx.shadowColor = '#FBBF24';
        this.ctx.shadowBlur = 5;
      } else {
        // Chưa tới: Xám mờ
        this.ctx.fillStyle = '#475569';
      }
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.ctx.restore();
  }

  private drawStageTransitionBanner(width: number, height: number) {
    this.ctx.save();
    // Backdrop mờ nhẹ
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.ctx.fillRect(0, 0, width, height);

    const isVictoryBanner = this.transitionTitle.includes('CHIẾN THẮNG') || this.transitionCountdown === 'VICTORY!';

    // Hộp banner trung tâm
    const bannerWidth = Math.min(560, width - 40);
    const bannerHeight = 200;
    const bannerX = (width - bannerWidth) / 2;
    const bannerY = (height - bannerHeight) / 2;

    this.ctx.beginPath();
    this.ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 20);
    this.ctx.fillStyle = '#1E293B';
    this.ctx.fill();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = isVictoryBanner ? '#FBBF24' : '#2A8B9D';
    this.ctx.shadowColor = isVictoryBanner ? 'rgba(251, 191, 36, 0.6)' : 'rgba(42, 139, 157, 0.6)';
    this.ctx.shadowBlur = 20;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Tiêu đề
    this.ctx.font = '900 25px Inter, sans-serif';
    this.ctx.fillStyle = isVictoryBanner ? '#FBBF24' : '#F59E0B';
    this.ctx.fillText(this.transitionTitle || 'XUẤT SẮC! HOÀN THÀNH MỐC', width / 2, bannerY + 50);

    // Phụ đề
    this.ctx.font = 'bold 15px Inter, sans-serif';
    this.ctx.fillStyle = isVictoryBanner ? '#34D399' : '#38BDF8';
    this.ctx.fillText(this.transitionSubtitle || 'CHUẨN BỊ MỐC KẾ TIẾP', width / 2, bannerY + 95);

    // Đếm ngược hoặc Trạng thái Victory
    if (this.transitionCountdown) {
      this.ctx.font = isVictoryBanner ? '900 32px Inter, sans-serif' : '900 40px Inter, monospace';
      this.ctx.fillStyle = isVictoryBanner ? '#10B981' : '#F43F5E';
      this.ctx.fillText(this.transitionCountdown, width / 2, bannerY + 148);
    }

    this.ctx.restore();
  }

  private createMilestoneCelebrationParticles() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const colors = ['#FBBF24', '#38BDF8', '#22C55E', '#F43F5E', '#A855F7'];

    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.4;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 60,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 3,
      });
    }
  }

  private createVictoryCelebrationParticles() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const colors = ['#FBBF24', '#F59E0B', '#34D399', '#38BDF8', '#EC4899', '#FFFFFF'];

    for (let i = 0; i < 80; i++) {
      const startX = width * 0.2 + Math.random() * width * 0.6;
      const startY = height * 0.3 + Math.random() * height * 0.4;
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 160;
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3.5 + Math.random() * 3.5,
      });
    }
  }

  private drawSpaceship(x: number, y: number) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Engine thrust glow
    this.ctx.beginPath();
    this.ctx.moveTo(-8, 12);
    this.ctx.lineTo(0, 22 + Math.random() * 6);
    this.ctx.lineTo(8, 12);
    this.ctx.fillStyle = '#F59E0B';
    this.ctx.fill();

    // Ship Body
    this.ctx.beginPath();
    this.ctx.moveTo(0, -20);
    this.ctx.lineTo(18, 12);
    this.ctx.lineTo(0, 6);
    this.ctx.lineTo(-18, 12);
    this.ctx.closePath();

    this.ctx.fillStyle = '#2A8B9D';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.stroke();

    // Cockpit
    this.ctx.beginPath();
    this.ctx.arc(0, -2, 4, 0, Math.PI * 2);
    this.ctx.fillStyle = '#38BDF8';
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawWordBox(word: ActiveWord) {
    this.ctx.save();
    const isLocked = this.lockedWordId !== null && this.lockedWordId === word.id;
    word.isLocked = isLocked;

    // Rung nhẹ khi gõ sai ký tự
    let renderX = word.x;
    if (word.shakeTimer && word.shakeTimer > 0) {
      renderX += (Math.random() - 0.5) * 8;
    }

    // Box styling
    this.ctx.beginPath();
    this.ctx.roundRect(renderX, word.y, word.width, word.height, 8);

    if (isLocked) {
      this.ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      this.ctx.strokeStyle = '#FBBF24'; // Yellow border for locked target ONLY
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
      this.ctx.shadowBlur = 12;
    } else if (word.isHeartWord) {
      this.ctx.fillStyle = 'rgba(45, 20, 35, 0.9)';
      this.ctx.strokeStyle = '#F43F5E';
      this.ctx.lineWidth = 2.5;
    } else {
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      this.ctx.strokeStyle = '#38BDF8';
      this.ctx.lineWidth = 2;
    }
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Heart Badge if isHeartWord
    if (word.isHeartWord) {
      this.ctx.font = '14px sans-serif';
      this.ctx.fillStyle = '#F43F5E';
      this.ctx.fillText('❤', renderX + 6, word.y + 18);
    }

    // Typography
    const textStartX = renderX + (word.isHeartWord ? 24 : 14);

    if (this.mode === 'EASY') {
      // EASY: Display letters directly
      this.ctx.font = 'bold 20px Inter, monospace';
      let currentOffset = textStartX;

      for (let i = 0; i < word.word.length; i++) {
        const char = word.word.charAt(i);
        const charWidth = this.ctx.measureText(char).width;

        if (i < word.typedLength) {
          // Phần chữ đã gõ đúng: Tô màu VÀNG SÁNG (#F59E0B)
          this.ctx.fillStyle = '#F59E0B';
        } else {
          // Phần chữ chưa gõ: Tô màu TRẮNG (#FFFFFF)
          this.ctx.fillStyle = '#FFFFFF';
        }

        this.ctx.fillText(char, currentOffset, word.y + 30);
        currentOffset += charWidth;
      }
    } else {
      // HARD: Meaning + Blank underscores / revealed hint letters
      this.ctx.font = '12px Inter, sans-serif';
      this.ctx.fillStyle = '#94A3B8';
      const truncatedMeaning =
        word.meaning.length > 20 ? word.meaning.substring(0, 18) + '...' : word.meaning;
      this.ctx.fillText(truncatedMeaning, textStartX, word.y + 20);

      this.ctx.font = 'bold 18px Inter, monospace';
      let currentOffset = textStartX;

      for (let i = 0; i < word.word.length; i++) {
        const char = word.word.charAt(i);
        const isRevealed = word.revealedIndices.has(i);
        const isTyped = i < word.typedLength;

        let charToRender = '_';
        if (isTyped) {
          charToRender = char;
          this.ctx.fillStyle = '#F59E0B';
        } else if (isRevealed) {
          charToRender = char;
          this.ctx.fillStyle = '#38BDF8';
        } else {
          charToRender = '_';
          this.ctx.fillStyle = '#64748B';
        }

        const charWidth = this.ctx.measureText(charToRender).width;
        this.ctx.fillText(charToRender, currentOffset, word.y + 48);
        currentOffset += charWidth + 3;
      }
    }

    this.ctx.restore();
  }

  private createLaser(targetX: number, targetY: number) {
    const startX = this.canvas.width / 2;
    const startY = this.canvas.height - 25;
    this.lasers.push({
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      progress: 0,
      color: '#38BDF8',
    });
  }

  private createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.3;
      const speed = 60 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        color,
        size: 2.5 + Math.random() * 2,
      });
    }
  }

  private createMistakeParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.2,
        maxLife: 0.2,
        color: '#EF4444',
        size: 2,
      });
    }
  }

  private createBottomExplosion(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const angle = -Math.PI + Math.random() * Math.PI; // Bay ngược lên
      const speed = 70 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4,
        maxLife: 0.4,
        color: '#EF4444',
        size: 3,
      });
    }
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
