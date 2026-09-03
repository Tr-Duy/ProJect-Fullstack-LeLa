import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { useServerHealth } from '../../../shared/providers/ServerHealthProvider';
import { API_BASE_URL, checkBackendHealth } from '../../../shared/lib/api';

export type WakeStatus = 'connecting' | 'waking' | 'ready' | 'timeout' | 'error';

const TIMEOUT_PER_REQUEST_MS = 8000;
const POLL_INTERVAL_MS = 2500;
const MAX_DURATION_MS = 80000; // 80s maximum duration (within 60-90s bound)

export function useGoogleLoginWithWake() {
  const { isAuthenticated } = useAuth();
  const { isBackendReady, retryCheck } = useServerHealth();

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<WakeStatus>('connecting');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWaking, setIsWaking] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWakingRef = useRef(false);

  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const googleAuthUrl = `${cleanBaseUrl}/oauth2/authorization/google`;

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    isWakingRef.current = false;
    setIsWaking(false);
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    setIsOpen(false);
  }, [cleanup]);

  const startWakeAndLogin = useCallback(async () => {
    if (isAuthenticated) return;

    // If backend is already confirmed ready, navigate to Google OAuth directly without modal delay
    if (isBackendReady) {
      window.location.href = googleAuthUrl;
      return;
    }

    if (isWakingRef.current) return;

    cleanup();
    isWakingRef.current = true;
    setIsWaking(true);
    setIsOpen(true);
    setStatus('connecting');
    setElapsedSeconds(0);

    const startTime = Date.now();

    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= 3) {
        setStatus((prev) => (prev === 'connecting' ? 'waking' : prev));
      }
    }, 1000);

    const checkHealth = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_REQUEST_MS);
        const isUp = await checkBackendHealth(controller.signal);
        clearTimeout(timeoutId);

        return isUp;
      } catch {
        return false;
      }
    };

    const poll = async () => {
      if (!isWakingRef.current) return;

      const totalElapsed = Date.now() - startTime;
      if (totalElapsed >= MAX_DURATION_MS) {
        cleanup();
        setStatus('timeout');
        return;
      }

      const isHealthy = await checkHealth();
      if (!isWakingRef.current) return;

      if (isHealthy) {
        cleanup();
        setStatus('ready');
        retryCheck();
        setTimeout(() => {
          window.location.href = googleAuthUrl;
        }, 500);
      } else {
        pollingTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    // Trigger first attempt immediately
    poll();
  }, [isAuthenticated, isBackendReady, googleAuthUrl, retryCheck, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isWaking,
    isOpen,
    status,
    elapsedSeconds,
    startWakeAndLogin,
    handleClose,
  };
}
