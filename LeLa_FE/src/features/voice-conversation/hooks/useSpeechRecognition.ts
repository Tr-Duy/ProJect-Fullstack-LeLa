import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'listening' | 'processing';

export interface UseSpeechRecognitionOptions {
  lang?: string;
  silenceMs?: number;
  incompleteExtraMs?: number;
  minWords?: number;
  onUtteranceEnd: (text: string) => void;
  onError?: (error: string, isFatal?: boolean) => void;
}

const INCOMPLETE_ENDING =
  /\b(i|i want|i'd like|i would like|to|a|an|the|and|or|but|because|with|for|of|in|on|at|my|your|is|are|am|have|has|can|will|would|like|want|need)\s*$/i;

const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export function useSpeechRecognition({
  lang = 'en-US',
  silenceMs = 2200,
  incompleteExtraMs = 1800,
  minWords = 2,
  onUtteranceEnd,
  onError,
}: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);
  const wantListeningRef = useRef<boolean>(false);
  const submittedRef = useRef<boolean>(false);
  const onEndRef = useRef(onUtteranceEnd);
  const onErrorRef = useRef(onError);

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
  }, []);

  const commit = useCallback(
    (requiredWords: number) => {
      if (submittedRef.current) return;
      const text = `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim();
      if (countWords(text) < requiredWords) return;

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

      setTranscript(text);
      setStatus('processing');
      onEndRef.current(text);
    },
    [clearTimer],
  );

  const scheduleCommit = useCallback(() => {
    clearTimer();
    const text = `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const wait = INCOMPLETE_ENDING.test(text) ? silenceMs + incompleteExtraMs : silenceMs;
    timerRef.current = window.setTimeout(() => commit(minWords), wait);
  }, [clearTimer, commit, silenceMs, incompleteExtraMs, minWords]);

  const reset = useCallback(() => {
    finalRef.current = '';
    interimRef.current = '';
    submittedRef.current = false;
    setTranscript('');
    setError(null);
    clearTimer();
  }, [clearTimer]);

  const start = useCallback(() => {
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

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece: string = result[0]?.transcript || '';
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${piece}`.replace(/\s+/g, ' ').trim();
        } else {
          interim += piece;
        }
      }
      interimRef.current = interim.trim();
      const combined = `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim();
      setTranscript(combined);
      scheduleCommit();
    };

    recognition.onerror = (event: any) => {
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
      setError(msg);
      onErrorRef.current?.(msg, false);
    };

    recognition.onend = () => {
      if (wantListeningRef.current && !submittedRef.current) {
        try {
          recognition.start();
        } catch (e: any) {
          if (e?.name !== 'InvalidStateError') {
            console.warn('SpeechRecognition restart failed', e);
          }
        }
      }
    };

    recognitionRef.current = recognition;
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
  }, [lang, reset, scheduleCommit, clearTimer]);

  const finishNow = useCallback(() => {
    commit(1);
  }, [commit]);

  const retry = useCallback(() => {
    wantListeningRef.current = false;
    clearTimer();
    try {
      recognitionRef.current?.abort();
    } catch (e: any) {
      if (e?.name !== 'InvalidStateError') {
        console.warn('SpeechRecognition abort failed', e);
      }
    }
    reset();
    setStatus('idle');
    window.setTimeout(start, 150);
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
    error,
    isSupported,
    start,
    startListening: start,
    finishNow,
    retry,
    stop,
    stopListening: stop,
    setIdle,
  };
}
