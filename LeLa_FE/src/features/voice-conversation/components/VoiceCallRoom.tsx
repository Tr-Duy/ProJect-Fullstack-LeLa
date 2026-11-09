import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, message } from 'antd';
import { Mic, PhoneOff, Volume2, Sparkles, RefreshCw, Clock, CheckCircle } from 'lucide-react';
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
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentAiSpeech, setCurrentAiSpeech] = useState(sessionData.openingLine || '');
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  const [silenceCounter, setSilenceCounter] = useState(0);
  const [textInputFallback, setTextInputFallback] = useState('');
  const [manualTextMode, setManualTextMode] = useState(false);

  const bufferTimerRef = useRef<number | null>(null);

  const { speak, isSpeaking, stop: stopTts } = useSpeechSynthesis();

  // Web Speech Recognition với guard chống dội âm (Echo Guard)
  const {
    status,
    isListening,
    transcript,
    isSupported,
    start: startListening,
    finishNow,
    retry: retrySpeech,
    stop: stopListening,
    abortAndReset,
    setIdle,
  } = useSpeechRecognition({
    lang: 'en-US',
    silenceMs: 2200,
    incompleteExtraMs: 1800,
    minWords: 2,
    isAiSpeaking: isAiSpeaking || isSpeaking,
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

  // Hàm phát giọng nói AI với cơ chế dập tắt micro ngay lập tức và chờ đệm 400ms an toàn
  const playAiSpeech = useCallback(
    (text: string, rate: number, onEndBuffer?: () => void) => {
      if (!text) {
        onEndBuffer?.();
        return;
      }

      // 1. Dập tắt Micro ngay lập tức trước khi loa phát âm thanh
      stopListening();
      abortAndReset();
      setIsAiSpeaking(true);

      if (bufferTimerRef.current !== null) {
        window.clearTimeout(bufferTimerRef.current);
        bufferTimerRef.current = null;
      }

      speak(text, rate, () => {
        setIsAiSpeaking(false);
        // 2. Bắt buộc dùng setTimeout chờ đệm 400ms: Cho phép âm vang trong phòng và loa ngoài dứt hẳn
        bufferTimerRef.current = window.setTimeout(() => {
          bufferTimerRef.current = null;
          onEndBuffer?.();
        }, 400);
      });
    },
    [speak, stopListening, abortAndReset]
  );

  // TTS đọc lời mở đầu khi vào phòng, đọc xong chờ đệm 400ms rồi tự động mở mic nghe
  useEffect(() => {
    if (sessionData.openingLine) {
      playAiSpeech(sessionData.openingLine, sessionData.uiConfig.ttsRate, () => {
        startListening();
      });
    } else {
      bufferTimerRef.current = window.setTimeout(() => {
        bufferTimerRef.current = null;
        startListening();
      }, 400);
    }
    return () => {
      if (bufferTimerRef.current !== null) window.clearTimeout(bufferTimerRef.current);
      stopTts();
      abortAndReset();
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
      if (!isSpeaking && !isAiSpeaking && !isAiThinking) {
        setSilenceCounter((prev) => prev + 1);
      } else {
        setSilenceCounter(0);
      }
    }, 1000);

    return () => clearInterval(silenceTimer);
  }, [isSpeaking, isAiSpeaking, isAiThinking]);

  const handleSendTurn = async (transcriptText: string, confidence: number, isRetry: boolean) => {
    const cleanText = (transcriptText || '').trim();
    if (!cleanText || isAiThinking || isAiSpeaking || isSpeaking) {
      console.warn('[VoiceCallRoom] Bỏ qua lượt gửi vì transcript rỗng hoặc AI đang nói/xử lý');
      return;
    }

    setIsAiThinking(true);
    setSilenceCounter(0);
    // Tắt mic ngay khi gửi lên server
    stopListening();
    abortAndReset();

    try {
      const elapsed = (sessionData.durationSecondsLimit || 300) - secondsLeft;
      const res = await voiceConversationApi.processTurn(
        sessionData.publicId,
        cleanText,
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

      // Đọc phản hồi bằng TTS, dứt lời và chờ đệm 400ms an toàn trước khi tự động mở mic
      playAiSpeech(turn.aiReply, sessionData.uiConfig.ttsRate, () => {
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
    // Không thao tác mic khi AI đang phân tích hoặc đang nói
    if (isAiThinking || status === 'processing' || isAiSpeaking || isSpeaking) return;

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

  // Xác định rõ các trạng thái trực quan của nút Mic
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
    if (isAiSpeaking || isSpeaking) {
      return {
        state: 'AI_SPEAKING',
        tooltip: 'AI đang nói, vui lòng lắng nghe...',
        buttonClass:
          'bg-slate-400 border-2 border-slate-300 cursor-not-allowed opacity-80 shadow-md',
        icon: <Volume2 className="w-8 h-8 text-white animate-pulse" />,
        statusText: 'AI đang nói, vui lòng lắng nghe...',
        disabled: true,
      };
    }
    if (status === 'listening') {
      return {
        state: 'LISTENING',
        tooltip: 'Mời bạn nói... Bấm để dừng và gửi',
        buttonClass:
          'bg-orange-500 hover:bg-orange-600 shadow-[0_0_30px_rgba(234,88,12,0.7)] animate-pulse active:scale-95 cursor-pointer',
        icon: <Mic className="w-8 h-8 text-white" />,
        statusText: 'Mời bạn nói... Hệ thống đang lắng nghe!',
        disabled: false,
      };
    }
    return {
      state: 'READY',
      tooltip: 'Mời bạn nói...',
      buttonClass:
        'bg-orange-600 hover:bg-orange-700 shadow-[0_0_20px_rgba(234,88,12,0.4)] animate-pulse active:scale-95 cursor-pointer',
      icon: <Mic className="w-8 h-8 text-white" />,
      statusText: 'Mời bạn nói... Bấm vào Micro hoặc nói trực tiếp.',
      disabled: false,
    };
  };

  const micUi = getMicButtonUi();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Room */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 border-2 border-orange-400 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-orange-100 font-bold tracking-wider">Kịch bản đàm thoại</span>
          <h2 className="text-2xl font-black text-white" style={{ color: '#ffffff' }}>
            {sessionData.scenarioTitle}
          </h2>
          <p className="text-orange-100 text-sm mt-0.5">
            Bạn: <span className="text-white font-bold">{sessionData.userRole}</span> • AI:{' '}
            <span className="text-amber-200 font-bold">{sessionData.aiRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30">
            <Clock className="w-5 h-5 text-amber-200" />
            <span className="font-sans text-xl font-bold text-white">{formatTime(secondsLeft)}</span>
          </div>

          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30 text-sm font-bold text-white">
            <span className="text-orange-100">Lượt: </span>
            <span className="text-white">{validTurns}</span>
            <span className="text-orange-100">/{sessionData.maxTurns || 10}</span>
          </div>

          <Button
            type="default"
            className="rounded-2xl font-bold flex items-center gap-2 h-10 border-white/40 bg-white/10 text-white hover:bg-white/20"
            onClick={onFinishSession}
          >
            Kết thúc phiên
          </Button>
          <Button
            danger
            type="primary"
            className="rounded-2xl font-bold flex items-center gap-2 h-10 shadow-sm"
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
      <div className="bg-white border-2 border-orange-200 shadow-xl rounded-3xl p-8 min-h-[340px] flex flex-col justify-between items-center text-center relative overflow-hidden">
        {/* AI Avatar & Audio Waves */}
        <div className="space-y-4 my-auto w-full max-w-xl">
          <div className="relative inline-block">
            <div
              className={`w-24 h-24 rounded-full bg-[#EA580C] shadow-lg flex items-center justify-center transition-all ${
                isSpeaking
                  ? 'scale-110 ring-8 ring-orange-300/50 shadow-[0_0_35px_rgba(234,88,12,0.6)]'
                  : 'shadow-orange-500/20'
              }`}
            >
              <Volume2 className={`w-10 h-10 text-white ${isSpeaking ? 'animate-bounce' : ''}`} />
            </div>
            {isSpeaking && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
                Đang nói
              </span>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed transition-all">
              "{currentAiSpeech}"
            </p>
            {isAiThinking && (
              <div className="inline-flex items-center gap-2 text-orange-600 text-sm font-semibold animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                AI đang suy nghĩ và phân tích câu trả lời...
              </div>
            )}
          </div>
        </div>

        {/* Silence Prompt & Gợi ý mẫu khi im lặng >= 8s */}
        {silenceCounter >= 8 && currentSuggestion && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2.5 max-w-lg mb-4 text-xs text-orange-800 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Gợi ý mẫu: "{currentSuggestion}"</span>
            </div>
            {!manualTextMode && (
              <Button
                size="small"
                type="link"
                className="text-orange-600 hover:text-orange-700 font-bold p-0"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold mb-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
            <span>Đang nghe...</span>
          </div>
        )}

        {/* User Speech Real-time Transcript qua interimResults */}
        {transcript && (
          <div className="text-sm font-medium text-orange-800 italic max-w-lg bg-orange-50 border border-orange-200 px-5 py-2.5 rounded-2xl mb-2 shadow-inner animate-fade-in flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
            <span>
              Bạn đang nói: <strong className="text-slate-900 not-italic font-bold">"{transcript}"</strong>
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
              className="font-bold bg-orange-600 hover:bg-orange-700 text-white border-none h-12 px-6 rounded-2xl shadow-md shadow-orange-600/20"
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
                  className="text-orange-600 font-bold p-0 text-xs"
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
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-orange-500 font-medium text-sm"
              />
              <Button
                type="primary"
                className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold border-none text-white shadow-md shadow-orange-600/20"
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
            className="text-slate-400 hover:text-orange-600 text-xs font-semibold p-0"
            onClick={() => setManualTextMode(true)}
          >
            Chuyển sang chế độ nhập văn bản
          </Button>
        )}
      </div>
    </div>
  );
};
