import { memo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { EngineCallbacks } from '../engine/typingGameEngine';
import { TypingGameEngine } from '../engine/typingGameEngine';
import type { TypingGameMode, TypingWordDto } from '../types/typingGame.types';

export interface GameCanvasHandle {
  initStage: (
    words: TypingWordDto[],
    spawnIntervalMs: number,
    baseSpeed: number,
    currentCombo: number,
    currentScore: number,
    livesLeft: number,
    stageNo?: number,
    totalStages?: number,
    allDeckWords?: TypingWordDto[]
  ) => void;
  loadStageWords: (
    words: TypingWordDto[],
    spawnIntervalMs: number,
    baseSpeed: number,
    currentCombo?: number,
    currentScore?: number,
    livesLeft?: number,
    stageNo?: number,
    totalStages?: number
  ) => void;
  showStageTransition: (title: string, subtitle: string, countdown?: string) => void;
  updateTransitionCountdown: (countdown: string) => void;
  clearStageTransition: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

interface GameCanvasProps {
  mode: TypingGameMode;
  initialLives: number;
  initialCombo: number;
  initialScore: number;
  callbacks: EngineCallbacks;
}

export const GameCanvas = memo(
  forwardRef<GameCanvasHandle, GameCanvasProps>(
    ({ mode, initialLives, initialCombo, initialScore, callbacks }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<TypingGameEngine | null>(null);

    // Keep callbacks ref updated to avoid stale closures without rebuilding engine
    const callbacksRef = useRef<EngineCallbacks>(callbacks);
    callbacksRef.current = callbacks;

    useImperativeHandle(ref, () => ({
      initStage: (words, spawnIntervalMs, baseSpeed, currentCombo, currentScore, livesLeft, stageNo, totalStages, allDeckWords) => {
        if (engineRef.current) {
          engineRef.current.initStage(
            words,
            spawnIntervalMs,
            baseSpeed,
            currentCombo,
            currentScore,
            livesLeft,
            stageNo,
            totalStages,
            allDeckWords
          );
        }
      },
      loadStageWords: (words, spawnIntervalMs, baseSpeed, currentCombo, currentScore, livesLeft, stageNo, totalStages) => {
        if (engineRef.current) {
          engineRef.current.loadStageWords(
            words,
            spawnIntervalMs,
            baseSpeed,
            currentCombo,
            currentScore,
            livesLeft,
            stageNo,
            totalStages
          );
        }
      },
      showStageTransition: (title, subtitle, countdown) => {
        engineRef.current?.showStageTransition(title, subtitle, countdown);
      },
      updateTransitionCountdown: (countdown) => {
        engineRef.current?.updateTransitionCountdown(countdown);
      },
      clearStageTransition: () => {
        engineRef.current?.clearStageTransition();
      },
      pause: () => {
        engineRef.current?.pause();
      },
      resume: () => {
        engineRef.current?.resume();
      },
      stop: () => {
        engineRef.current?.stop();
      },
    }));

    const initialLivesRef = useRef(initialLives);
    const initialComboRef = useRef(initialCombo);
    const initialScoreRef = useRef(initialScore);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Fit canvas size to container
      const updateSize = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth || 896; // 896px = max-w-4xl
          canvas.height = 550;
          engineRef.current?.resize(canvas.width, canvas.height);
        }
      };

      updateSize();

      // Wrapped callbacks delegating to latest callbacksRef
      const dynamicCallbacks: EngineCallbacks = {
        onScoreUpdate: (score, combo, maxCombo) => callbacksRef.current.onScoreUpdate(score, combo, maxCombo),
        onLivesUpdate: (lives) => callbacksRef.current.onLivesUpdate(lives),
        onWordCleared: (word) => callbacksRef.current.onWordCleared(word),
        onWordMissed: (word) => callbacksRef.current.onWordMissed(word),
        onStageComplete: (events) => callbacksRef.current.onStageComplete(events),
        onGameOver: () => callbacksRef.current.onGameOver(),
        onProgressUpdate: (resolved, target, currentMilestone, totalMilestones) =>
          callbacksRef.current.onProgressUpdate?.(resolved, target, currentMilestone, totalMilestones),
      };

      const engine = new TypingGameEngine(
        canvas,
        mode,
        dynamicCallbacks,
        initialLivesRef.current,
        initialComboRef.current,
        initialScoreRef.current
      );
      engineRef.current = engine;
      engine.start();

      // Global window keydown listener
      const handleKeyDown = (e: KeyboardEvent) => {
        engine.handleKeyDown(e);
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          engine.pause();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', updateSize);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        engine.stop();
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', updateSize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [mode]);

    return (
      <div className="relative w-full h-[550px] flex items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] bg-slate-900">
        <canvas ref={canvasRef} className="block w-full h-full cursor-default" />
      </div>
    );
  }),
  (prev, next) => prev.mode === next.mode
);

GameCanvas.displayName = 'GameCanvas';
