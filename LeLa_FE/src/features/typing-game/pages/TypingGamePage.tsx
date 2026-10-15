import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, message, Table } from 'antd';
import { Trophy } from 'lucide-react';
import { typingGameApi } from '../api/typingGame.api';
import type {
  TypingGameMode,
  TypingRunResponse,
  TypingRunResultResponse,
  TypingWordEventDto,
  TypingLeaderboardEntryDto,
} from '../types/typingGame.types';
import { DeckPicker } from '../components/DeckPicker';
import { GameHud } from '../components/GameHud';
import { GameCanvas, type GameCanvasHandle } from '../components/GameCanvas';
import { ImeWarningBanner } from '../components/ImeWarningBanner';
import { ResultScreen } from '../components/ResultScreen';
import { soundManager } from '../engine/soundManager';

type GameScreenState = 'DECK_SELECTION' | 'PLAYING' | 'RESULT';

export const TypingGamePage: React.FC = () => {
  const [screenState, setScreenState] = useState<GameScreenState>('DECK_SELECTION');
  const [activeRun, setActiveRun] = useState<TypingRunResponse | null>(null);
  const [runResult, setRunResult] = useState<TypingRunResultResponse | null>(null);

  // In-Game React States for HUD
  const [hudScore, setHudScore] = useState<number>(0);
  const [hudCombo, setHudCombo] = useState<number>(0);
  const [hudLives, setHudLives] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExpandedChallenge, setIsExpandedChallenge] = useState<boolean>(false);
  const [milestoneProgress, setMilestoneProgress] = useState<{ resolved: number; target: number }>({
    resolved: 0,
    target: 0,
  });

  // Leaderboard modal state
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = useState<TypingLeaderboardEntryDto[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [leaderboardDeckTitle, setLeaderboardDeckTitle] = useState<string>('');

  const canvasHandleRef = useRef<GameCanvasHandle | null>(null);
  const activeRunRef = useRef<TypingRunResponse | null>(null);
  activeRunRef.current = activeRun;

  // Query Decks
  const {
    data: decksResp,
    isLoading: isDecksLoading,
    refetch: refetchDecks,
  } = useQuery({
    queryKey: ['typing-game-decks'],
    queryFn: () => typingGameApi.getDecks(),
  });

  const decks = decksResp?.data || [];

  // Beacon on beforeunload to prevent stuck runs
  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = activeRunRef.current;
      if (current && current.publicId) {
        const url = `/api/v1/typing-game/runs/${current.publicId}/abandon`;
        navigator.sendBeacon(url);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      soundManager.destroy();
    };
  }, []);

  // Launch Run into playing state
  const launchRun = (run: TypingRunResponse) => {
    setActiveRun(run);
    setHudScore(run.score);
    setHudCombo(run.currentCombo);
    setHudLives(run.livesLeft);
    setIsPaused(false);
    setMilestoneProgress({ resolved: 0, target: run.words?.length || 0 });
    setScreenState('PLAYING');

    // Initialize stage in canvas handle after DOM render
    setTimeout(() => {
      canvasHandleRef.current?.initStage(
        run.words,
        run.spawnIntervalMs,
        run.baseSpeed,
        run.currentCombo,
        run.score,
        run.livesLeft,
        run.currentStage,
        run.totalStages
      );
    }, 50);
  };

  // Start new run or resume
  const handleSelectDeck = async (
    deckId: number,
    mode: TypingGameMode,
    forceRestart: boolean = false,
    expandedChallenge: boolean = false
  ) => {
    try {
      const res = await typingGameApi.startRun({ deckId, mode, forceRestart, expandedChallenge });
      if (res.data) {
        launchRun(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        const errorData = err.response?.data?.data || {};
        const activeRunPublicId =
          errorData.activeRunPublicId ||
          (err.response?.data?.message?.match(/mã:\s*([a-f0-9-]+)/i)?.[1]);

        Modal.confirm({
          title: (
            <span className="font-black text-lg text-[#2B1B0E]">Lượt chơi dở dang</span>
          ),
          content: (
            <div className="py-2 text-sm text-gray-700 font-medium">
              Bạn đang có một lượt chơi chưa hoàn thành trong vòng 30 phút qua. Bạn muốn tiếp tục ván cũ hay hủy để bắt đầu ván mới?
            </div>
          ),
          okText: 'Bắt đầu ván mới',
          okType: 'danger',
          cancelText: 'Tiếp tục chơi',
          okButtonProps: {
            className: 'font-black border-2 border-[var(--border)] shadow-[var(--shadow-md)]',
          },
          cancelButtonProps: {
            type: 'primary',
            className: 'font-black bg-[#2A8B9D] hover:!bg-[#237585] border-2 border-[var(--border)] shadow-[var(--shadow-md)] text-white',
          },
          onOk: async () => {
            // Hủy ván cũ và tạo ván mới ngay lập tức
            await handleSelectDeck(deckId, mode, true, expandedChallenge);
          },
          onCancel: async () => {
            // Tiếp tục chơi ván cũ
            if (activeRunPublicId) {
              try {
                const existingRes = await typingGameApi.getRun(activeRunPublicId);
                if (existingRes.data) {
                  launchRun(existingRes.data);
                  return;
                }
              } catch {
                message.warning('Không thể tải lại ván cũ, đang tạo ván mới...');
                await handleSelectDeck(deckId, mode, true, expandedChallenge);
              }
            } else {
              await handleSelectDeck(deckId, mode, true, expandedChallenge);
            }
          },
        });
        return;
      }

      const msg = err.response?.data?.message || 'Không thể bắt đầu lượt chơi';
      message.error(msg);
    }
  };

  // View Leaderboard modal
  const handleViewLeaderboard = async (deckId: number, mode: TypingGameMode) => {
    const targetDeck = decks.find((d) => d.deckId === deckId);
    setLeaderboardDeckTitle(targetDeck ? `${targetDeck.title} (${mode})` : `Bộ thẻ #${deckId}`);
    setLeaderboardModalVisible(true);
    setLeaderboardLoading(true);

    try {
      const res = await typingGameApi.getHighScores(deckId, mode);
      setLeaderboardData(res.data || []);
    } catch {
      message.error('Không thể tải bảng điểm cao');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Finish Run
  const handleFinishRun = useCallback(async (reason: string) => {
    const current = activeRunRef.current;
    if (!current) return;

    try {
      const res = await typingGameApi.finishRun(current.publicId, {
        events: [],
        reason,
      });

      if (res.data) {
        setRunResult(res.data);
        setActiveRun(null);
        setScreenState('RESULT');
        refetchDecks();
      }
    } catch {
      message.error('Lỗi khi tổng kết kết quả');
      setScreenState('DECK_SELECTION');
    }
  }, [refetchDecks]);

  // Complete Stage Callback
  const handleStageComplete = useCallback(
    async (events: TypingWordEventDto[]) => {
      const current = activeRunRef.current;
      if (!current) return;

      const stageFinishedNo = current.currentStage;
      const nextStageNo = stageFinishedNo + 1;

      // 1. Hiển thị Banner chuyển mốc ngay trên Canvas
      canvasHandleRef.current?.showStageTransition(
        `XUẤT SẮC! ĐÃ HOÀN THÀNH MỐC ${stageFinishedNo}`,
        `CHUẨN BỊ MỐC ${nextStageNo} (Tốc độ tăng +15%)`,
        '3...'
      );

      const executeStageComplete = async () => {
        try {
          const res = await typingGameApi.completeStage(
            current.publicId,
            current.currentStage,
            { events }
          );

          if (res.data) {
            const updatedRun = res.data;
            setActiveRun(updatedRun);
            setHudScore(updatedRun.score);
            setHudCombo(updatedRun.currentCombo);
            setHudLives(updatedRun.livesLeft);

            // Kiểm tra Chiến thắng (Victory) hoặc Hết tim
            if (
              updatedRun.livesLeft <= 0 ||
              updatedRun.currentStage > updatedRun.totalStages ||
              (updatedRun.words && updatedRun.words.length === 0 && updatedRun.currentStage >= updatedRun.totalStages)
            ) {
              await new Promise((r) => setTimeout(r, 2500));
              canvasHandleRef.current?.clearStageTransition();
              handleFinishRun('VICTORY');
              return;
            }

            // Đếm ngược 3... 2... 1... trước khi bắn từ của mốc tiếp theo
            canvasHandleRef.current?.updateTransitionCountdown('2...');
            await new Promise((r) => setTimeout(r, 700));

            canvasHandleRef.current?.updateTransitionCountdown('1...');
            await new Promise((r) => setTimeout(r, 700));

            canvasHandleRef.current?.updateTransitionCountdown('BẮT ĐẦU!');
            await new Promise((r) => setTimeout(r, 400));

            // Xóa banner chuyển mốc và nạp từ mới của Mốc tiếp theo
            canvasHandleRef.current?.clearStageTransition();
            setMilestoneProgress({ resolved: 0, target: updatedRun.words?.length || 0 });
            canvasHandleRef.current?.loadStageWords(
              updatedRun.words,
              updatedRun.spawnIntervalMs,
              updatedRun.baseSpeed,
              updatedRun.currentCombo,
              updatedRun.score,
              updatedRun.livesLeft,
              updatedRun.currentStage,
              updatedRun.totalStages
            );
          }
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Lỗi khi đồng bộ mốc với máy chủ';
          canvasHandleRef.current?.clearStageTransition();
          Modal.confirm({
            title: 'Lỗi đồng bộ mốc chơi',
            content: `${msg}. Bạn có muốn thử lại không?`,
            okText: 'Thử lại',
            cancelText: 'Thoát ván',
            okButtonProps: { type: 'primary' },
            onOk: () => {
              executeStageComplete();
            },
            onCancel: () => {
              handleFinishRun('USER_QUIT');
            },
          });
        }
      };

      await executeStageComplete();
    },
    [handleFinishRun]
  );

  // Game Over Callback
  const handleGameOver = useCallback(() => {
    handleFinishRun('LIVES_DEPLETED');
  }, [handleFinishRun]);

  // HUD Controls
  const handleTogglePause = () => {
    if (isPaused) {
      canvasHandleRef.current?.resume();
      setIsPaused(false);
    } else {
      canvasHandleRef.current?.pause();
      setIsPaused(true);
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMuted(nextMute);
  };

  const handleQuitGame = () => {
    Modal.confirm({
      title: 'Xác nhận thoát lượt chơi',
      content: 'Lượt chơi hiện tại sẽ bị hủy và không ghi nhận điểm kỷ lục.',
      okText: 'Thoát',
      cancelText: 'Tiếp tục chơi',
      okButtonProps: { danger: true },
      onOk: async () => {
        const current = activeRunRef.current;
        if (current) {
          try {
            await typingGameApi.abandonRun(current.publicId);
          } catch {
            // Ignore
          }
        }
        canvasHandleRef.current?.stop();
        setActiveRun(null);
        setScreenState('DECK_SELECTION');
        refetchDecks();
      },
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F4F3EE] py-6 px-4 flex flex-col items-center justify-start">
      {screenState === 'DECK_SELECTION' && (
        <DeckPicker
          decks={decks}
          isLoading={isDecksLoading}
          onSelectDeck={(deckId, mode, expanded) => {
            setIsExpandedChallenge(!!expanded);
            handleSelectDeck(deckId, mode, false, !!expanded);
          }}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}

      {screenState === 'PLAYING' && activeRun && (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-start">
          <ImeWarningBanner />

          <GameHud
            score={hudScore}
            combo={hudCombo}
            lives={hudLives}
            currentStage={activeRun.currentStage}
            totalStages={activeRun.totalStages}
            wordsResolved={milestoneProgress.resolved}
            targetWords={milestoneProgress.target}
            isPaused={isPaused}
            isMuted={isMuted}
            deckTitle={activeRun.deckTitle}
            mode={activeRun.mode}
            onTogglePause={handleTogglePause}
            onToggleMute={handleToggleMute}
            onQuit={handleQuitGame}
          />

          <div className="w-full h-[550px]">
            <GameCanvas
              ref={canvasHandleRef}
              mode={activeRun.mode}
              initialLives={activeRun.livesLeft}
              initialCombo={activeRun.currentCombo}
              initialScore={activeRun.score}
              callbacks={{
                onScoreUpdate: (score, combo) => {
                  setHudScore(score);
                  setHudCombo(combo);
                },
                onLivesUpdate: (lives) => {
                  setHudLives(lives);
                },
                onWordCleared: () => {},
                onWordMissed: () => {},
                onProgressUpdate: (resolved, target) => {
                  setMilestoneProgress({ resolved, target });
                },
                onStageComplete: handleStageComplete,
                onGameOver: handleGameOver,
              }}
            />
          </div>
        </div>
      )}

      {screenState === 'RESULT' && runResult && (
        <ResultScreen
          result={runResult}
          onPlayAgain={() => {
            handleSelectDeck(runResult.deckId, runResult.mode, false, isExpandedChallenge);
          }}
          onBackToDecks={() => {
            setScreenState('DECK_SELECTION');
            refetchDecks();
          }}
        />
      )}

      {/* Leaderboard Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-black text-[#2B1B0E]">
            <Trophy className="w-5 h-5 text-yellow-500" /> Bảng Điểm Cao: {leaderboardDeckTitle}
          </div>
        }
        open={leaderboardModalVisible}
        onCancel={() => setLeaderboardModalVisible(false)}
        footer={null}
        width={650}
      >
        <Table
          dataSource={leaderboardData}
          rowKey="userId"
          loading={leaderboardLoading}
          pagination={false}
          size="middle"
          columns={[
            {
              title: 'Hạng',
              dataIndex: 'rank',
              key: 'rank',
              width: 70,
              render: (rank: number) => (
                <span
                  className={`font-black text-sm px-2 py-0.5 rounded ${
                    rank === 1
                      ? 'bg-amber-100 text-amber-700'
                      : rank === 2
                      ? 'bg-slate-200 text-slate-700'
                      : rank === 3
                      ? 'bg-amber-50 text-amber-900'
                      : 'text-gray-600'
                  }`}
                >
                  #{rank}
                </span>
              ),
            },
            {
              title: 'Người chơi',
              dataIndex: 'displayName',
              key: 'displayName',
              render: (name: string, record: TypingLeaderboardEntryDto) => (
                <div className="flex items-center gap-2">
                  {record.avatarUrl ? (
                    <img
                      src={record.avatarUrl}
                      alt={name}
                      className="w-7 h-7 rounded-full border border-[var(--border)] object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#2A8B9D] text-white flex items-center justify-center font-black text-xs border border-[var(--border)]">
                      {name.charAt(0)}
                    </div>
                  )}
                  <span className="font-bold text-sm text-[#2B1B0E]">{name}</span>
                </div>
              ),
            },
            {
              title: 'Điểm',
              dataIndex: 'score',
              key: 'score',
              render: (score: number) => (
                <span className="font-black text-amber-600">{score.toLocaleString()}</span>
              ),
            },
            {
              title: 'WPM',
              dataIndex: 'wpm',
              key: 'wpm',
              render: (wpm: number) => <span className="font-bold text-cyan-600">{wpm}</span>,
            },
            {
              title: 'Độ chính xác',
              dataIndex: 'accuracy',
              key: 'accuracy',
              render: (acc: number) => (
                <span className="font-bold text-emerald-600">{acc}%</span>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};
