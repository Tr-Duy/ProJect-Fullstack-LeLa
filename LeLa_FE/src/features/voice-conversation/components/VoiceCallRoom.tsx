import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { Mic, MicOff, PhoneOff, Volume2, Sparkles, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { voiceConversationApi } from '../api/voice-conversation.api';
import type { VoiceStartResponse, VoiceTargetWordDto } from '../api/voice-conversation.api';

interface VoiceCallRoomProps {
  sessionData: VoiceStartResponse;
  onFinishSession: () => void;
  onAbandonSession: () => void;
}

export const VoiceCallRoom: React.FC<VoiceCallRoomProps> = ({
  sessionData,
  onFinishSession,
  onAbandonSession,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(sessionData.durationSecondsLimit || 300);
  const [targetWords, setTargetWords] = useState<VoiceTargetWordDto[]>(sessionData.targetWords || []);
  const [validTurns, setValidTurns] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentAiSpeech, setCurrentAiSpeech] = useState(sessionData.openingLine || '');
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  const [silenceCounter, setSilenceCounter] = useState(0);
  const [textInputFallback, setTextInputFallback] = useState('');
  const [manualTextMode, setManualTextMode] = useState(false);

  const { speak, isSpeaking, stop: stopTts } = useSpeechSynthesis();

  // TTS đọc lời mở đầu khi vào phòng, đọc xong tự động mở mic nghe
  useEffect(() => {
    if (sessionData.openingLine) {
      speak(sessionData.openingLine, sessionData.uiConfig.ttsRate, () => {
        startListening();
      });
    } else {
      startListening();
    }
    return () => {
      stopTts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đếm ngược 300s
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinishSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinishSession]);

  // Đếm im lặng để bật gợi ý mẫu khi im lặng > 8s
  useEffect(() => {
    const silenceTimer = setInterval(() => {
      if (!isSpeaking && !isAiThinking) {
        setSilenceCounter((prev) => prev + 1);
      } else {
        setSilenceCounter(0);
      }
    }, 1000);

    return () => clearInterval(silenceTimer);
  }, [isSpeaking, isAiThinking]);

  // Web Speech Recognition
  const {
    status,
    isListening,
    transcript,
    isSupported,
    start: startListening,
    finishNow,
    retry: retrySpeech,
    stop: stopListening,
    setIdle,
  } = useSpeechRecognition({
    lang: 'en-US',
    silenceMs: 2200,
    incompleteExtraMs: 1800,
    minWords: 2,
    onUtteranceEnd: (text) => {
      handleSendTurn(text, 0.9, false);
    },
    onError: (errMsg, isFatal) => {
      if (isFatal) {
        message.error(errMsg);
        setManualTextMode(true);
      } else {
        message.warning(errMsg);
      }
    },
  });

  const handleSendTurn = async (transcriptText: string, confidence: number, isRetry: boolean) => {
    if (!transcriptText || isAiThinking) return;

    setIsAiThinking(true);
    setSilenceCounter(0);

    try {
      const elapsed = (sessionData.durationSecondsLimit || 300) - secondsLeft;
      const res = await voiceConversationApi.processTurn(
        sessionData.publicId,
        transcriptText,
        confidence,
        elapsed,
        isRetry
      );

      const turn = res.data;
      setCurrentAiSpeech(turn.aiReply);
      setTargetWords(turn.updatedTargetWords);
      setValidTurns(turn.validTurnCount);
      if (turn.quickSuggestion) {
        setCurrentSuggestion(turn.quickSuggestion);
      }

      setIdle();

      // Đọc phản hồi bằng TTS, xong tự động mở mic cho lượt kế tiếp
      speak(turn.aiReply, sessionData.uiConfig.ttsRate, () => {
        if (!turn.sessionEnded) {
          startListening();
        }
      });

      if (turn.sessionEnded) {
        message.info(turn.endReason || 'Phiên hội thoại đã hoàn thành!');
        setTimeout(() => {
          onFinishSession();
        }, 2000);
      }
    } catch (err: any) {
      setIdle();
      message.error(err.response?.data?.message || 'Có lỗi kết nối với AI. Vui lòng thử lại.');
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleMicAction = () => {
    if (isAiThinking || status === 'processing') return;

    if (isSpeaking) {
      // AI đang nói bằng TTS: ngắt lời AI và mở mic cho người học nói ngay lập tức
      stopTts();
      startListening();
      return;
    }

    if (status === 'listening') {
      if (transcript.trim()) {
        finishNow();
      } else {
        stopListening();
      }
    } else {
      startListening();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Xác định rõ 3 trạng thái của nút Mic
  const getMicButtonUi = () => {
    if (isAiThinking || status === 'processing') {
      return {
        state: 'THINKING',
        tooltip: 'AI đang phân tích câu nói...',
        buttonClass: 'bg-slate-700 border-2 border-slate-600 cursor-not-allowed opacity-75',
        icon: <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />,
        statusText: 'AI đang phân tích câu nói của bạn...',
        disabled: true,
      };
    }
    if (isSpeaking) {
      return {
        state: 'AI_SPEAKING',
        tooltip: 'AI đang nói. Bấm để ngắt và nói ngay!',
        buttonClass:
          'bg-gradient-to-tr from-[var(--teal)] to-[var(--teal)]/80 hover:brightness-110 shadow-[0_0_25px_rgba(99,102,241,0.6)] animate-pulse active:scale-95',
        icon: <Volume2 className="w-8 h-8 text-white animate-bounce" />,
        statusText: 'AI đang nói... (Bấm vào nút để ngắt và nói ngay)',
        disabled: false,
      };
    }
    if (status === 'listening') {
      return {
        state: 'LISTENING',
        tooltip: 'Đang lắng nghe... Bấm để dừng và gửi',
        buttonClass:
          'bg-rose-500 hover:bg-rose-600 shadow-[0_0_30px_rgba(244,63,94,0.7)] animate-pulse active:scale-95',
        icon: <MicOff className="w-8 h-8 text-white" />,
        statusText: 'Đang nghe giọng nói của bạn... Hãy nói câu tiếng Anh tự nhiên!',
        disabled: false,
      };
    }
    return {
      state: 'READY',
      tooltip: 'Bấm vào Micro để bắt đầu nói',
      buttonClass:
        'bg-teal-600 hover:bg-teal-700 shadow-[0_0_20px_rgba(42,139,157,0.4)] active:scale-95',
      icon: <Mic className="w-8 h-8 text-white" />,
      statusText: 'Bấm vào Micro để bắt đầu nói.',
      disabled: false,
    };
  };

  const micUi = getMicButtonUi();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Room */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs  text-teal-400 font-bold">Kịch bản đàm thoại</span>
          <h2 className="text-2xl font-black">{sessionData.scenarioTitle}</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Bạn: <span className="text-slate-200 font-semibold">{sessionData.userRole}</span> • AI:{' '}
            <span className="text-teal-300 font-semibold">{sessionData.aiRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="font-sans text-xl font-bold text-amber-300">{formatTime(secondsLeft)}</span>
          </div>

          <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-sm font-bold">
            <span className="text-slate-400">Lượt: </span>
            <span className="text-teal-400">{validTurns}</span>
            <span className="text-slate-400">/{sessionData.maxTurns || 10}</span>
          </div>

          <Button
            type="default"
            className="rounded-2xl font-bold flex items-center gap-2 h-10 border-slate-600 text-slate-300 hover:text-white"
            onClick={onFinishSession}
          >
            Kết thúc phiên
          </Button>
          <Button
            danger
            type="primary"
            className="rounded-2xl font-bold flex items-center gap-2 h-10"
            onClick={onAbandonSession}
          >
            <PhoneOff className="w-4 h-4" />
            Thoát
          </Button>
        </div>
      </div>

      {/* Target Words Tracker */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black  text-slate-500">
            Từ vựng mục tiêu cần áp dụng ({targetWords.filter((t) => t.usedCorrectly).length}/{targetWords.length})
          </span>
          <span className="text-xs text-slate-400">Áp dụng đúng vào câu nói để kích hoạt phát sáng xanh</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {targetWords.map((tw) => (
            <div
              key={tw.flashcardId}
              className={`px-3.5 py-2 rounded-2xl border-2 font-bold text-sm flex items-center gap-2 transition-all ${
                tw.usedCorrectly
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : tw.status === 'USED_WRONG'
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span>{tw.word}</span>
              <span className="text-xs font-normal opacity-75">({tw.meaning})</span>
              {tw.usedCorrectly && <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Conversation Visualizer */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 text-white min-h-[340px] flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl">
        {/* AI Avatar & Audio Waves */}
        <div className="space-y-4 my-auto w-full max-w-xl">
          <div className="relative inline-block">
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg transition-transform ${
                isSpeaking ? 'scale-110 shadow-[0_0_35px_rgba(42,139,157,0.8)]' : ''
              }`}
            >
              <Volume2 className={`w-10 h-10 text-white ${isSpeaking ? 'animate-bounce' : ''}`} />
            </div>
            {isSpeaking && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-teal-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full ">
                Đang nói
              </span>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xl md:text-2xl font-bold text-slate-100 leading-relaxed transition-all">
              "{currentAiSpeech}"
            </p>
            {isAiThinking && (
              <div className="inline-flex items-center gap-2 text-teal-400 text-sm font-semibold animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                AI đang suy nghĩ và phân tích câu trả lời...
              </div>
            )}
          </div>
        </div>

        {/* Silence Prompt & Gợi ý mẫu khi im lặng >= 8s */}
        {silenceCounter >= 8 && currentSuggestion && (
          <div className="bg-slate-800/90 border border-teal-500/50 rounded-2xl px-4 py-2.5 max-w-lg mb-4 text-xs text-teal-200 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Gợi ý mẫu: "{currentSuggestion}"</span>
            </div>
            {!manualTextMode && (
              <Button
                size="small"
                type="link"
                className="text-teal-300 hover:text-teal-100 font-bold p-0"
                onClick={() => {
                  if (!isListening) handleMicAction();
                }}
              >
                Nói theo gợi ý
              </Button>
            )}
          </div>
        )}

        {/* Trạng thái Đang nghe... khi status === 'listening' */}
        {status === 'listening' && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold mb-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
            <span>Đang nghe...</span>
          </div>
        )}

        {/* User Speech Real-time Transcript qua interimResults */}
        {transcript && (
          <div className="text-sm font-medium text-teal-300 italic max-w-lg bg-slate-800/80 border border-teal-500/30 px-5 py-2.5 rounded-2xl mb-2 shadow-inner animate-fade-in flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 flex-shrink-0" />
            <span>
              Bạn đang nói: <strong className="text-white">"{transcript}"</strong>
            </span>
          </div>
        )}
      </div>

      {/* Control Action Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-4">
        {!manualTextMode && isSupported ? (
          <div className="flex items-center gap-6">
            <Button
              shape="round"
              size="large"
              className="font-bold flex items-center gap-2 h-12 px-6"
              onClick={retrySpeech}
              disabled={isAiThinking || status === 'processing'}
            >
              <RefreshCw className="w-4 h-4" />
              Nói lại
            </Button>

            {/* Nút Mic chính với 3 trạng thái rõ ràng */}
            <button
              disabled={micUi.disabled}
              onClick={handleMicAction}
              title={micUi.tooltip}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform ${micUi.buttonClass}`}
            >
              {micUi.icon}
            </button>

            <Button
              type="primary"
              size="large"
              className="font-bold bg-teal-600 hover:bg-teal-700 h-12 px-6 rounded-2xl"
              onClick={finishNow}
              disabled={isAiThinking || status === 'processing'}
            >
              Hoàn thành
            </Button>
          </div>
        ) : (
          /* Chế độ nhập văn bản Fallback khi lỗi network/không hỗ trợ/từ chối mic */
          <div className="w-full max-w-xl space-y-3">
            <div className="text-xs text-slate-500 font-semibold text-center flex items-center justify-center gap-2">
              <span>Chế độ nhập văn bản (Fallback Mode)</span>
              {isSupported && (
                <Button
                  size="small"
                  type="link"
                  className="text-teal-600 font-bold p-0 text-xs"
                  onClick={() => setManualTextMode(false)}
                >
                  (Thử lại bằng Micro)
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={textInputFallback}
                onChange={(e) => setTextInputFallback(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendTurn(textInputFallback, 1.0, false);
                    setTextInputFallback('');
                  }
                }}
                disabled={isAiThinking}
                placeholder="Nhập câu trả lời bằng tiếng Anh của bạn tại đây..."
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-teal-500 font-medium text-sm"
              />
              <Button
                type="primary"
                className="h-11 px-5 rounded-xl bg-teal-600 font-bold"
                onClick={() => {
                  handleSendTurn(textInputFallback, 1.0, false);
                  setTextInputFallback('');
                }}
                disabled={isAiThinking || !textInputFallback.trim()}
              >
                Gửi
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 font-medium text-center">
          {manualTextMode ? 'Nhập câu tiếng Anh và nhấn Enter hoặc nút Gửi.' : micUi.statusText}
        </div>

        {/* Nút chuyển đổi nhanh chế độ */}
        {!manualTextMode && isSupported && (
          <Button
            type="link"
            size="small"
            className="text-slate-400 hover:text-teal-600 text-xs font-semibold p-0"
            onClick={() => setManualTextMode(true)}
          >
            Chuyển sang chế độ nhập văn bản
          </Button>
        )}
      </div>
    </div>
  );
};
