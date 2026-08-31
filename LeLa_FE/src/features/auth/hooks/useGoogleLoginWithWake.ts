import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../../shared/providers/AuthProvider';

export type WakeStatus = 'connecting' | 'waking' | 'ready' | 'timeout' | 'error';

export function useGoogleLoginWithWake() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<WakeStatus>('connecting');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWaking, setIsWaking] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWakingRef = useRef(false);

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
    if (isWakingRef.current) return;

    cleanup();
    isWakingRef.current = true;
    setIsWaking(true);
    setIsOpen(true);
    setStatus('connecting');
    setElapsedSeconds(0);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const healthUrl = `${cleanBaseUrl}/health`;
    const googleAuthUrl = `${cleanBaseUrl}/oauth2/authorization/google`;

    const startTime = Date.now();
    const TIMEOUT_MS = 120000; // 120 seconds maximum timeout
    const POLLING_INTERVAL_MS = 2500; // 2.5 seconds between polling attempts

    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= 4) {
        setStatus((prev) => (prev === 'connecting' ? 'waking' : prev));
      }
    }, 1000);

    const checkHealth = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Timeout per single HTTP attempt: 6 seconds
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(healthUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const poll = async () => {
      if (!isWakingRef.current) return;

      const totalElapsed = Date.now() - startTime;
      if (totalElapsed >= TIMEOUT_MS) {
        cleanup();
        setStatus('timeout');
        return;
      }

      const isHealthy = await checkHealth();
      if (!isWakingRef.current) return;

      if (isHealthy) {
        cleanup();
        setStatus('ready');
        setTimeout(() => {
          window.location.href = googleAuthUrl;
        }, 600);
      } else {
        pollingTimerRef.current = setTimeout(poll, POLLING_INTERVAL_MS);
      }
    };

    // Trigger first attempt immediately
    poll();
  }, [isAuthenticated, cleanup]);

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
