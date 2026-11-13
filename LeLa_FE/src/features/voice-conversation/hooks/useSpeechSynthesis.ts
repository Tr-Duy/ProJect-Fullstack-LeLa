import { useState, useCallback, useEffect, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const active = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const stop = useCallback(() => {
    const utterance = active.current;
    active.current = null;
    if (utterance) { utterance.onend = null; utterance.onerror = null; utterance.onstart = null; }
    if (isSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);
  const speak = useCallback((text: string, rate = .95, onEnd?: () => void) => {
    stop();
    if (!isSupported || !text) { onEnd?.(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = Math.max(.6, Math.min(1.4, rate));
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === 'en-US' && /Google|Natural|Zira/.test(v.name))
      || voices.find(v => v.lang.startsWith('en')) || null;
    active.current = utterance;
    setIsSpeaking(true);
    const done = () => {
      if (active.current !== utterance) return;
      active.current = null;
      setIsSpeaking(false);
      console.debug(`[VOICE TTS END][${new Date().toISOString()}]`);
      onEnd?.();
    };
    utterance.onstart = () => console.debug(`[VOICE TTS START][${new Date().toISOString()}]`);
    utterance.onend = done;
    utterance.onerror = done;
    try {
      console.debug(`[VOICE TTS SPEAK][${new Date().toISOString()}]`);
      window.speechSynthesis.speak(utterance);
    } catch { done(); }
  }, [isSupported, stop]);
  useEffect(() => stop, [stop]);
  return { isSpeaking, isSupported, speak, stop };
}
