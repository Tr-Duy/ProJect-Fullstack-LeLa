import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../lib/api';

export type ServerHealthStatus = 'idle' | 'checking' | 'waking' | 'ready' | 'timeout' | 'error';

interface ServerHealthContextType {
  isBackendReady: boolean;
  status: ServerHealthStatus;
  elapsedSeconds: number;
  retryCount: number;
  retryCheck: () => void;
  checkOnce: () => Promise<boolean>;
}

const ServerHealthContext = createContext<ServerHealthContextType | undefined>(undefined);

// Constrained bounds for Render Free cold start (approx 60-90 seconds maximum total duration)
const TIMEOUT_PER_REQUEST_MS = 8000;  // 8s timeout per single HTTP attempt
const POLL_INTERVAL_MS = 2500;        // 2.5s delay between retry attempts
const MAX_DURATION_MS = 80000;        // 80s hard max duration
const MAX_RETRIES = 18;               // 18 attempts hard upper bound

export function ServerHealthProvider({ children }: { children: React.ReactNode }) {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [status, setStatus] = useState<ServerHealthStatus>('checking');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef(false);

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
    isCheckingRef.current = false;
  }, []);

  const performHealthCheck = async (): Promise<boolean> => {
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

  const startHealthCheckLoop = useCallback(async () => {
    if (isCheckingRef.current) return;

    cleanup();
    isCheckingRef.current = true;
    setStatus('checking');
    setElapsedSeconds(0);
    setRetryCount(0);

    const startTime = Date.now();
    let currentRetries = 0;

    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= 3) {
        setStatus((prev) => (prev === 'checking' ? 'waking' : prev));
      }
    }, 1000);

    const poll = async () => {
      if (!isCheckingRef.current) return;

      const totalElapsed = Date.now() - startTime;
      if (totalElapsed >= MAX_DURATION_MS || currentRetries >= MAX_RETRIES) {
        cleanup();
        setStatus('timeout');
        return;
      }

      currentRetries += 1;
      setRetryCount(currentRetries);

      const isHealthy = await performHealthCheck();
      if (!isCheckingRef.current) return;

      if (isHealthy) {
        cleanup();
        setIsBackendReady(true);
        setStatus('ready');
      } else {
        setStatus('waking');
        pollingTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    // First health check immediately
    poll();
  }, [cleanup]);

  const retryCheck = useCallback(() => {
    setIsBackendReady(false);
    startHealthCheckLoop();
  }, [startHealthCheckLoop]);

  const checkOnce = useCallback(async (): Promise<boolean> => {
    const isUp = await performHealthCheck();
    if (isUp) {
      setIsBackendReady(true);
      setStatus('ready');
    }
    return isUp;
  }, []);

  useEffect(() => {
    startHealthCheckLoop();

    return () => {
      cleanup();
    };
  }, [startHealthCheckLoop, cleanup]);

  return (
    <ServerHealthContext.Provider
      value={{
        isBackendReady,
        status,
        elapsedSeconds,
        retryCount,
        retryCheck,
        checkOnce,
      }}
    >
      {children}
    </ServerHealthContext.Provider>
  );
}

export function useServerHealth() {
  const context = useContext(ServerHealthContext);
  if (context === undefined) {
    throw new Error('useServerHealth must be used within a ServerHealthProvider');
  }
  return context;
}
