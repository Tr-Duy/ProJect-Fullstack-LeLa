import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, message } from 'antd';
import { Mic, PhoneOff, Volume2, Sparkles, RefreshCw, Clock, CheckCircle, Award, Check, AlertTriangle } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { voiceConversationApi } from '../api/voice-conversation.api';
import type { VoiceStartResponse, VoiceTargetWordDto, UserEvaluationDto } from '../api/voice-conversation.api';

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
  const [currentTurnId, setCurrentTurnId] = useState<number>(0);
  const [currentAiSpeech, setCurrentAiSpeech] = useState(sessionData.openingLine || '');
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  const [latestEvaluation, setLatestEvaluation] = useState<UserEvaluationDto | null>(null);
  const [intendedUtterance, setIntendedUtterance] = useState<string>('');
  const [silenceCounter, setSilenceCounter] = useState(0);
  const [textInputFallback, setTextInputFallback] = useState('');
  const [manualTextMode, setManualTextMode] = useState(false);

  // Cờ chống trùng lặp request và lưu trạng thái lượt nói
  const isSubmittingRef = useRef<boolean>(false);
  const [latestTurnConfidence, setLatestTurnConfidence] = useState<number | null>(null);
  const [failedTurn, setFailedTurn] = useState<{
    text: string;
    confidence: number;
    alternatives?: string[];
  } | null>(null);

  const bufferTimerRef = useRef<number | null>(null);
  const lastAiSpeechRef = useRef<string>(sessionData.openingLine || '');
  const lastSpokenTurnIdRef = useRef<number>(-1);

  const { speak, isSpeaking, stop: stopTts } = useSpeechSynthesis();

  // Web Speech Recognition với guard chống dội âm (Echo Guard)
  const {
    status,
    isListening,
    transcript,
    finalTranscript,
    interimTranscript,
    isSupported,
    start: startListening,
    finishNow,
    retry: retrySpeech,
    stop: stopListening,
    abortAndReset,
    resetTranscript,
    setIdle,
  } = useSpeechRecognition({
    lang: 'en-US',
    silenceMs: 1200,
    incompleteExtraMs: 800,
    minWords: 1,
    isAiSpeaking: isAiSpeaking || isSpeaking,
    onUtteranceEnd: (text, alternatives, conf) => {
      handleSendTurn(text, conf ?? 1.0, false, alternatives);
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

  // Bật mic an toàn: Chỉ start khi speechSynthesis.speaking === false && pending === false sau onend + 400ms
  const safeStartListening = useCallback(() => {
    const checkAndStart = () => {
      const isSpeakingNow = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.speaking : false;
      const isPendingNow = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.pending : false;
      const now = new Date().toISOString();
      console.log(`[MIC CHECK][${now}] speaking=${isSpeakingNow}, pending=${isPendingNow}`);

      if (isSpeakingNow || isPendingNow) {
        console.log(`[MIC CHECK][${now}] SpeechSynthesis still active. Polling in 150ms...`);
        bufferTimerRef.current = window.setTimeout(checkAndStart, 150);
        return;
      }

      console.log(`[MIC START][${now}] SpeechSynthesis silent (speaking=false, pending=false). Starting recognition...`);
      setIsAiSpeaking(false);
      startListening();
    };

    if (bufferTimerRef.current !== null) {
      window.clearTimeout(bufferTimerRef.current);
    }
    bufferTimerRef.current = window.setTimeout(checkAndStart, 400);
  }, [startListening]);

  // Hàm phát giọng nói AI với cơ chế dập tắt micro ngay lập tức và chờ đệm 400ms an toàn
  const playAiSpeech = useCallback(
    (text: string, rate: number, onEndBuffer?: () => void) => {
      const now = new Date().toISOString();
      console.log(`[TTS DIAGNOSTIC][${now}] playAiSpeech() CALLED: "${text?.substring(0, 40)}..."`);
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
        const onEndNow = new Date().toISOString();
        console.log(`[TTS ONEND CALLBACK][${onEndNow}] utterance onend triggered`);
        onEndBuffer?.();
      });
    },
    [speak, stopListening, abortAndReset]
  );

  // Gom việc đọc AI về MỘT nơi duy nhất, khóa theo id lượt AI (currentTurnId), không cancel() trong effect cleanup
  useEffect(() => {
    if (!currentAiSpeech) return;
    if (lastSpokenTurnIdRef.current === currentTurnId) {
      console.log(`[TTS AUTO-SPEAK] Turn ${currentTurnId} already spoken, skipping duplicate speak call.`);
      return;
    }
    lastSpokenTurnIdRef.current = currentTurnId;

    const now = new Date().toISOString();
    console.log(`[TTS AUTO-SPEAK][${now}] Auto-speaking turn ${currentTurnId}: "${currentAiSpeech.substring(0, 40)}..."`);
    playAiSpeech(currentAiSpeech, sessionData.uiConfig?.ttsRate || 0.95, () => {
      safeStartListening();
    });
  }, [currentTurnId, currentAiSpeech, sessionData.uiConfig?.ttsRate, playAiSpeech, safeStartListening]);

  // Cleanup khi unmount (rời phòng hoặc phiên kết thúc)
  useEffect(() => {
    return () => {
      console.log(`[VoiceCallRoom] Component unmounting.`);
      if (bufferTimerRef.current !== null) {
        window.clearTimeout(bufferTimerRef.current);
        bufferTimerRef.current = null;
      }
      stopTts();
      abortAndReset();
    };
  }, [stopTts, abortAndReset]);

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

  const handleSendTurn = async (
    transcriptText: string,
    confidence: number,
    isRetry: boolean,
    alternatives?: string[]
  ) => {
    // 1. Cờ isSubmittingRef để mỗi lượt chỉ gửi đúng 1 request, kể cả khi onresult và onend cùng kích hoạt
    if (isSubmittingRef.current || isAiThinking || isAiSpeaking || isSpeaking) {
      console.warn('[VoiceCallRoom] Bỏ qua lượt gửi vì đang xử lý/AI đang nói hoặc đang gửi');
      return;
    }

    const cleanText = (transcriptText || '').trim();
    const hasLetters = /[a-zA-Z]/.test(cleanText);

    // 2. Nếu transcript final rỗng hoặc ngắn hơn 2 ký tự (hoặc không có chữ cái): KHÔNG gửi, mở mic nghe lại
    if (!cleanText || cleanText.length < 2 || !hasLetters) {
      console.log('[VoiceCallRoom] Transcript rỗng hoặc không hợp lệ:', cleanText);
      message.info('Mình chưa nghe rõ, bạn nói lại nhé');
      stopListening();
      abortAndReset();
      resetTranscript();
      safeStartListening();
      return;
    }

    isSubmittingRef.current = true;
    setIsAiThinking(true);
    setSilenceCounter(0);
    setFailedTurn(null);

    // 3. Trong lúc gửi: tắt mic, reset transcript của lượt nói cũ
    stopListening();
    abortAndReset();
    resetTranscript();

    try {
      const elapsed = (sessionData.durationSecondsLimit || 300) - secondsLeft;
      const res = await voiceConversationApi.processTurn(
        sessionData.publicId,
        cleanText,
        confidence,
        elapsed,
        isRetry,
        alternatives || [],
        lastAiSpeechRef.current
      );

      const turn = res.data;
      setCurrentAiSpeech(turn.aiReply);
      lastAiSpeechRef.current = turn.aiReply;
      setTargetWords(turn.updatedTargetWords || []);
      setValidTurns(turn.validTurnCount);
      // Xóa sạch transcript của lượt nói cũ ngay khi có câu phản hồi mới từ AI
      resetTranscript();
      if (turn.quickSuggestion) {
        setCurrentSuggestion(turn.quickSuggestion);
      }

      if (turn.degraded) {
        setLatestEvaluation(null);
        setIntendedUtterance('');
        message.warning('Hệ thống AI đang quá tải, tạm thời chuyển sang câu thoại dự phòng.', 4);
      } else {
        const evalData = turn.evaluation || turn.userEvaluation || null;
        setLatestEvaluation(evalData);
        setIntendedUtterance(turn.intendedUtterance || cleanText);
      }
      setLatestTurnConfidence(confidence);

      setIdle();

      if (turn.sessionEnded) {
        playAiSpeech(turn.aiReply, sessionData.uiConfig?.ttsRate || 0.95);
        message.info(turn.endReason || 'Phiên hội thoại đã hoàn thành!');
        setTimeout(() => {
          onFinishSession();
        }, 2000);
      } else {
        // Tăng currentTurnId để kích hoạt auto-speak effect một lần duy nhất cho lượt mới
        setCurrentTurnId((prev) => prev + 1);
      }
    } catch (err: any) {
      setIdle();
      console.error('[VoiceCallRoom] Lỗi API processTurn toàn bộ response:', err.response?.data || err);
      // Giữ câu vừa nói để có nút "Thử gửi lại", mic không bị kẹt
      setFailedTurn({ text: cleanText, confidence, alternatives });
      const data = err.response?.data;
      const errorCode = data?.errorCode;
      const errorMsg = data?.message;
      let displayMessage = 'Lỗi kết nối với AI. Bạn có thể nhấn "Thử gửi lại" hoặc nói lại câu khác.';
      if (errorCode) {
        displayMessage = `[${errorCode}] ${errorMsg || displayMessage}`;
      } else if (errorMsg) {
        displayMessage = errorMsg;
      }
      message.warning(displayMessage, 5);
      safeStartListening();
    } finally {
      setIsAiThinking(false);
      isSubmittingRef.current = false;
    }
  };

  const handleRetry = useCallback(() => {
    // (a) abort, (b) reset toàn bộ transcript refs & state, (c) xóa Feedback Card lượt này, (d) hủy timer tự gửi
    isSubmittingRef.current = false;
    setFailedTurn(null);
    setLatestEvaluation(null);
    setIntendedUtterance('');
    setLatestTurnConfidence(null);
    retrySpeech();
  }, [retrySpeech]);

  const handleMicAction = () => {
    // Không thao tác mic khi AI đang phân tích hoặc đang nói hoặc đang gửi request
    if (isAiThinking || isSubmittingRef.current || status === 'processing' || isAiSpeaking || isSpeaking) return;

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
    if (isAiThinking || isSubmittingRef.current || status === 'processing') {
      return {
        state: 'THINKING',
        tooltip: 'AI đang xử lý câu nói...',
        buttonClass: 'bg-slate-700 border-2 border-slate-600 cursor-not-allowed opacity-75',
        icon: <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />,
        statusText: 'AI đang xử lý câu nói của bạn...',
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
      {/* Mẹo chống dội âm cố định */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-xs">
        <span>💡 Mẹo: Dùng tai nghe để tránh mic thu lại giọng AI</span>
      </div>

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

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <p className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed transition-all">
                "{currentAiSpeech}"
              </p>
              <button
                type="button"
                onClick={() => playAiSpeech(currentAiSpeech, sessionData.uiConfig?.ttsRate || 0.95)}
                className="p-2 rounded-full hover:bg-orange-100 text-orange-600 transition-colors flex-shrink-0 cursor-pointer"
                title="Nghe lại câu này"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            {isAiThinking && (
              <div className="inline-flex items-center gap-2 text-orange-600 text-sm font-semibold animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                AI đang suy nghĩ và phân tích câu trả lời...
              </div>
            )}
          </div>

          {/* Quick Feedback Loop Card */}
          {latestEvaluation && (
            <div className="w-full max-w-lg mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200/90 rounded-2xl p-4 text-left shadow-sm animate-fade-in space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-slate-800">Đánh giá lượt nói vừa rồi:</span>
                </div>
                {(() => {
                  const status = (latestEvaluation.status || '').toUpperCase();
                  const score = latestEvaluation.score ?? 80;
                  if (status === 'EXCELLENT' || score >= 85) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Xuất sắc ({score}/100)
                      </span>
                    );
                  }
                  if (status === 'GOOD' || score >= 60) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold shadow-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Tốt ({score}/100)
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-orange-800 text-xs font-bold shadow-xs">
                      Cần cải thiện ({score}/100)
                    </span>
                  );
                })()}
              </div>

              {intendedUtterance && (
                <div className="text-xs text-slate-600 font-medium">
                  AI hiểu ý bạn là: <strong className="text-slate-800">"{intendedUtterance}"</strong>
                </div>
              )}

              {latestEvaluation.grammarCheck && (
                <div className="flex items-start gap-1.5 text-xs text-emerald-900 bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-2.5 py-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{latestEvaluation.grammarCheck}</span>
                </div>
              )}

              {latestEvaluation.phoneticTip && (
                <div className="flex items-start gap-1.5 text-xs text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-xl px-2.5 py-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-amber-800 mr-1">Mẹo phát âm:</strong>
                    {latestEvaluation.phoneticTip}
                  </span>
                </div>
              )}

              {latestEvaluation.suggestedImprovement && (
                <div className="text-xs text-slate-700 pt-1 border-t border-orange-100 flex flex-col sm:flex-row sm:items-baseline gap-1">
                  <span className="font-semibold text-orange-700 flex-shrink-0">
                    {latestEvaluation.hasError === false ? 'Cách nói tự nhiên hơn:' : 'Gợi ý câu đúng:'}
                  </span>
                  <span className="italic font-medium text-orange-900">"{latestEvaluation.suggestedImprovement}"</span>
                </div>
              )}

              {latestTurnConfidence !== null && latestTurnConfidence < 0.5 && (
                <div className="text-[11px] text-amber-800 bg-amber-100/80 border border-amber-300/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 font-medium mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Máy nghe chưa rõ, nên dùng tai nghe nếu bạn thấy kết quả sai</span>
                </div>
              )}
            </div>
          )}
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

        {/* Thông báo lỗi khi API thất bại hoặc mạng chập chờn: Cho phép "Thử gửi lại" hoặc "Nói lại" */}
        {failedTurn && !isAiThinking && (
          <div className="w-full max-w-lg mx-auto bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3 mb-2 flex items-center justify-between gap-3 text-xs animate-fade-in shadow-xs text-left">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                Không thể gửi câu: <strong className="text-slate-900 font-bold">"{failedTurn.text}"</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="small"
                type="primary"
                danger
                className="font-bold text-xs rounded-xl"
                onClick={() => {
                  const t = failedTurn;
                  setFailedTurn(null);
                  handleSendTurn(t.text, t.confidence, true, t.alternatives);
                }}
              >
                Thử gửi lại
              </Button>
              <Button
                size="small"
                className="text-xs rounded-xl"
                onClick={() => {
                  setFailedTurn(null);
                  handleRetry();
                }}
              >
                Nói lại
              </Button>
            </div>
          </div>
        )}

        {/* Trạng thái Đang nghe... khi status === 'listening' */}
        {status === 'listening' && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold mb-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
            <span>Đang nghe...</span>
          </div>
        )}

        {/* Real-time speech transcript: Phân tách rõ ràng giữa final và interim */}
        {isListening && (finalTranscript.trim().length > 0 || interimTranscript.trim().length > 0) && (
          <div className="text-sm font-medium text-orange-900 max-w-lg bg-orange-50/90 border border-orange-200 px-5 py-2.5 rounded-2xl mb-2 shadow-inner animate-fade-in flex items-center gap-2 text-left">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <span className="text-orange-800 mr-1">Bạn đang nói:</span>
              {finalTranscript && (
                <strong className="text-slate-900 not-italic font-bold">{finalTranscript} </strong>
              )}
              {interimTranscript && (
                <span className="text-slate-500 italic font-normal">
                  {interimTranscript}{' '}
                  <span className="text-xs text-orange-600 font-medium not-italic">(đang nhận diện...)</span>
                </span>
              )}
            </div>
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
              onClick={handleRetry}
              disabled={isAiThinking || isSubmittingRef.current || status === 'processing'}
            >
              <RefreshCw className="w-4 h-4" />
              Nói lại
            </Button>

            {/* Nút Mic chính với các trạng thái rõ ràng */}
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
              disabled={isAiThinking || isSubmittingRef.current || status === 'processing'}
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
                disabled={isAiThinking || isSubmittingRef.current}
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
                disabled={isAiThinking || isSubmittingRef.current || !textInputFallback.trim()}
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
