import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'listening' | 'processing';
export interface SttAlternative { transcript: string; confidence: number }

export interface UseSpeechRecognitionOptions {
  lang?: string;
  silenceMs?: number;
  incompleteExtraMs?: number;
  minWords?: number;
  isAiSpeaking?: boolean;
  autoCommit?: boolean;
  onStopped?: () => void;
  onUtteranceEnd: (text: string, alternatives?: string[], confidence?: number, alternativeDetails?: SttAlternative[]) => void;
  onError?: (error: string, isFatal?: boolean) => void;
}

const INCOMPLETE_ENDING =
  /\b(i|i want|i'd like|i would like|to|a|an|the|and|or|but|because|with|for|of|in|on|at|my|your|is|are|am|have|has|can|will|would|like|want|need)\s*$/i;

const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export function useSpeechRecognition({
  lang = 'en-US',
  silenceMs,
  incompleteExtraMs,
  minWords = 1,
  isAiSpeaking = false,
  autoCommit = false,
  onStopped,
  onUtteranceEnd,
  onError,
}: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');
  const alternativesRef = useRef<string[]>([]);
  const alternativeDetailsRef = useRef<SttAlternative[]>([]);
  const confidenceRef = useRef<number>(1.0);
  const timerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const speechStartTimeRef = useRef<number>(0);
  const wantListeningRef = useRef<boolean>(false);
  const submittedRef = useRef<boolean>(false);
  const onEndRef = useRef(onUtteranceEnd);
  const onErrorRef = useRef(onError);
  const isAiSpeakingRef = useRef<boolean>(isAiSpeaking);
  const sessionIdRef = useRef<number>(0);
  const finishRequestedRef = useRef(false);
  const onStoppedRef = useRef(onStopped);
  onStoppedRef.current = onStopped;

  useEffect(() => {
    onEndRef.current = onUtteranceEnd;
  }, [onUtteranceEnd]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    interimRef.current = '';
    alternativesRef.current = [];
    alternativeDetailsRef.current = [];
    confidenceRef.current = 1.0;
    submittedRef.current = false;
    finishRequestedRef.current = false;
    setTranscript('');
    setFinalTranscript('');
    setInterimTranscript('');
    setConfidence(1.0);
    setError(null);
    clearTimer();
  }, [clearTimer]);

  const abortAndReset = useCallback(() => {
    sessionIdRef.current++;
    wantListeningRef.current = false;
    clearTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e: any) {
        // ignore
      }
      recognitionRef.current = null;
    }
    reset();
    setStatus('idle');
  }, [clearTimer, reset]);

  // Khóa cứng micro ngay lập tức khi AI bắt đầu nói
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
    if (isAiSpeaking) {
      abortAndReset();
    }
  }, [isAiSpeaking, abortAndReset]);

  const commit = useCallback(
    (requiredWords: number) => {
      if (submittedRef.current || isAiSpeakingRef.current) return;
      // Backend CHỈ nhận final transcript, tuyệt đối không gửi interim lên BE
      const finalText = finalRef.current.replace(/\s+/g, ' ').trim();
      const hasLetters = /[a-zA-Z]/.test(finalText);
      const durationMs = Date.now() - speechStartTimeRef.current;
      
      // Lọc bỏ nếu final rỗng, ngắn hơn 2 ký tự hoặc không chứa chữ cái
      if (!finalText || finalText.length < 2 || !hasLetters) {
        clearTimer();
        return;
      }

      // Lọc bỏ tạp âm quá ngắn dưới 0.4s
      if (durationMs < 400 && countWords(finalText) < 1) {
        clearTimer();
        return;
      }
      if (countWords(finalText) < requiredWords) return;

      submittedRef.current = true;
      wantListeningRef.current = false;
      clearTimer();

      try {
        recognitionRef.current?.stop();
      } catch (e: any) {
        if (e?.name !== 'InvalidStateError') {
          console.warn('SpeechRecognition stop failed', e);
        }
      }

      setTranscript(finalText);
      setInterimTranscript('');
      setStatus('idle');
      const alts = [...alternativesRef.current];
      const details = [...alternativeDetailsRef.current];
      const conf = confidenceRef.current;
      onEndRef.current(finalText, alts, conf, details);
    },
    [clearTimer],
  );

  const scheduleCommit = useCallback(() => {
    if (isAiSpeakingRef.current || !autoCommit || silenceMs == null || incompleteExtraMs == null) return;
    clearTimer();

    // Chỉ bắt đầu đếm im lặng để tự gửi khi ĐÃ CÓ kết quả final
    if (!finalRef.current.trim() || interimRef.current.trim()) return;

    const fullText = `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim();
    if (!fullText) return;

    const wait = INCOMPLETE_ENDING.test(fullText) ? silenceMs + incompleteExtraMs : silenceMs;
    timerRef.current = window.setTimeout(() => commit(minWords), wait);
  }, [clearTimer, commit, silenceMs, incompleteExtraMs, minWords, autoCommit]);

  const start = useCallback(() => {
    // Không bao giờ khởi động nhận diện nếu loa AI đang phát âm thanh thật
    const isBrowserSpeaking =
      typeof window !== 'undefined' &&
      Boolean(window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending));

    if (isBrowserSpeaking) {
      console.log('[STT] Blocked start() because window.speechSynthesis is active (echo guard)');
      return;
    }

    // Đặt lại cờ echo guard khi loa đã im lặng hoàn toàn
    isAiSpeakingRef.current = false;

    const currentSessionId = ++sessionIdRef.current;

    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      const msg = 'Trình duyệt không hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.';
      setError(msg);
      onErrorRef.current?.(msg, true);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    reset();
    wantListeningRef.current = true;
    speechStartTimeRef.current = Date.now();

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = lang || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    // Results are cumulative within one engine run. Rebuild by index instead of
    // appending repeated final packets; retain a prefix only across engine restarts.
    let prefix = '';

    recognition.onresult = (event: any) => {
      // Bỏ qua mọi kết quả trễ từ phiên cũ
      if (sessionIdRef.current !== currentSessionId) {
        return;
      }

      // Diagnostic log theo yêu cầu LỖI B.1
      const now = new Date().toISOString();
      console.log(`[STT ONRESULT DIAGNOSTIC][${now}] lang=${recognition.lang}, continuous=${recognition.continuous}, interimResults=${recognition.interimResults}`);

      // Guard chống echo: Hủy bỏ ngay mọi tạp âm thu được nếu AI đang phát âm
      if (isAiSpeakingRef.current || window.speechSynthesis?.speaking || window.speechSynthesis?.pending || submittedRef.current) {
        console.log('[STT] Echo guard: Discarded speech packet because AI is speaking');
        return;
      }

      let currentInterim = '';
      const capturedAlts: string[] = [];
      const details: SttAlternative[] = [];
      const finals: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const piece: string = result[0]?.transcript || '';
        const conf = result[0]?.confidence ?? 0;
        console.debug(`[STT RESULT][${now}] index=${i}, isFinal=${result.isFinal}, confidence=${conf}`);

        if (Number.isFinite(conf) && conf >= 0 && conf <= 1) {
          confidenceRef.current = conf;
          setConfidence(conf);
        }

        for (let a = 0; a < result.length; a++) {
          const altPiece = result[a]?.transcript?.trim();
          // Alternatives are whole utterances, not disconnected result fragments.
          const alternative = [prefix, ...Array.from({ length: event.results.length }, (_, index) =>
            index === i ? altPiece : event.results[index][0]?.transcript || '')].join(' ').replace(/\s+/g, ' ').trim();
          if (altPiece && !capturedAlts.includes(alternative)) {
            capturedAlts.push(alternative);
            details.push({ transcript: alternative, confidence: result[a]?.confidence ?? 0 });
          }
        }
        if (result.isFinal) {
          finals.push(piece);
        } else {
          currentInterim += piece;
        }
      }
      finalRef.current = [prefix, ...finals].join(' ').replace(/\s+/g, ' ').trim();
      setFinalTranscript(finalRef.current);
      if (capturedAlts.length > 0) {
        alternativesRef.current = capturedAlts;
        alternativeDetailsRef.current = details;
      }
      interimRef.current = currentInterim.trim();
      setInterimTranscript(interimRef.current);
      const combined = `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim();
      setTranscript(combined);
      scheduleCommit();
    };

    recognition.onerror = (event: any) => {
      if (sessionIdRef.current !== currentSessionId) return;
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        wantListeningRef.current = false;
        clearTimer();
        setStatus('idle');
        const msg = 'Chưa được cấp quyền micro. Hãy cho phép micro trong cài đặt trình duyệt.';
        setError(msg);
        onErrorRef.current?.(msg, true);
        return;
      }

      const msg = `Lỗi nhận dạng giọng nói: ${event.error}`;
      wantListeningRef.current = false;
      clearTimer();
      setStatus('idle');
      setError(msg);
      onErrorRef.current?.(msg, false);
    };

    recognition.onend = () => {
      if (sessionIdRef.current !== currentSessionId) {
        return;
      }
      if (isAiSpeakingRef.current) {
        setStatus('idle');
        return;
      }

      if (!autoCommit || finishRequestedRef.current) {
        if (finishRequestedRef.current) commit(1);
        wantListeningRef.current = false;
        setStatus('idle');
        onStoppedRef.current?.();
        return;
      }

      if (wantListeningRef.current && !submittedRef.current) {
        if (restartTimerRef.current !== null) {
          window.clearTimeout(restartTimerRef.current);
        }
        restartTimerRef.current = window.setTimeout(() => {
          try {
            if (sessionIdRef.current === currentSessionId && wantListeningRef.current && !submittedRef.current && !isAiSpeakingRef.current
              && !window.speechSynthesis?.speaking && !window.speechSynthesis?.pending) {
              prefix = finalRef.current;
              recognition.start();
            }
          } catch (e: any) {
            if (e?.name !== 'InvalidStateError') {
              console.warn('SpeechRecognition restart failed', e);
            }
          }
        }, 150);
      }
    };

    recognitionRef.current = recognition;
    if (typeof window !== 'undefined') {
      (window as any)._activeRecognitionInstance = recognition;
    }
    try {
      recognition.start();
      setStatus('listening');
    } catch (e: any) {
      if (e?.name === 'InvalidStateError') {
        setStatus('listening');
      } else {
        const msg = 'Không thể bật micro. Vui lòng thử lại.';
        setError(msg);
        onErrorRef.current?.(msg, false);
        console.error('SpeechRecognition start failed', e);
      }
    }
  }, [lang, reset, scheduleCommit, clearTimer, autoCommit, commit]);

  const finishNow = useCallback(() => {
    if (isAiSpeakingRef.current) return;
    const flushSessionId = sessionIdRef.current;
    finishRequestedRef.current = true;
    wantListeningRef.current = false;
    clearTimer();
    try { recognitionRef.current?.stop(); } catch { commit(1); }
    // Some engines omit onend; this is a flush deadline, never an auto-send silence threshold.
    if (sessionIdRef.current === flushSessionId && !submittedRef.current) {
      timerRef.current = window.setTimeout(() => {
        if (sessionIdRef.current !== flushSessionId || submittedRef.current) return;
        commit(1); setStatus('idle'); onStoppedRef.current?.();
      }, 1000);
    }
  }, [commit, clearTimer]);

  const retry = useCallback(() => {
    if (isAiSpeakingRef.current) return;
    sessionIdRef.current++;
    wantListeningRef.current = false;
    clearTimer();
    reset();
    setStatus('idle');

    const oldInstance = recognitionRef.current;
    if (oldInstance) {
      recognitionRef.current = null;
      try {
        oldInstance.onresult = null;
        oldInstance.onerror = null;
        let restarted = false;
        const doRestart = () => {
          if (restarted) return;
          restarted = true;
          oldInstance.onend = null;
          if (!isAiSpeakingRef.current) {
            start();
          }
        };
        oldInstance.onend = doRestart;
        oldInstance.abort();
        // Fallback sau 120ms nếu trình duyệt không phát onend
        window.setTimeout(doRestart, 120);
      } catch {
        start();
      }
    } else {
      start();
    }
  }, [reset, start, clearTimer]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    clearTimer();
    try {
      recognitionRef.current?.stop();
    } catch (e: any) {
      if (e?.name !== 'InvalidStateError') {
        console.warn('SpeechRecognition stop failed', e);
      }
    }
    setStatus('idle');
  }, [clearTimer]);

  const setIdle = useCallback(() => {
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      clearTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [clearTimer]);

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return {
    status,
    isListening: status === 'listening',
    isProcessing: status === 'processing',
    transcript,
    finalTranscript,
    interimTranscript,
    confidence,
    error,
    isSupported,
    start,
    startListening: start,
    finishNow,
    retry,
    stop,
    stopListening: stop,
    abortAndReset,
    resetTranscript: reset,
    setIdle,
  };
}
