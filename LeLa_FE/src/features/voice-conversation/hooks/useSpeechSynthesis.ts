import { useState, useCallback, useEffect } from 'react';

// Giữ tham chiếu toàn cục để tránh trình duyệt (đặc biệt là Chrome) Garbage Collect Utterance giữa chừng
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Lắng nghe sự kiện window.speechSynthesis.onvoiceschanged để nạp danh sách giọng đọc của trình duyệt
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices && availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      } catch (e) {
        console.warn('[useSpeechSynthesis] Lỗi khi nạp danh sách voice:', e);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // Ưu tiên chọn voice tự nhiên tiếng Anh (Google US English, Microsoft Zira/David hoặc Samantha)
  const selectEnglishVoice = useCallback((availableVoices: SpeechSynthesisVoice[]) => {
    if (!availableVoices || availableVoices.length === 0) return null;

    const preferredKeywords = [
      'Google US English',
      'Microsoft Zira',
      'Microsoft David',
      'Samantha',
      'Natural',
    ];

    for (const kw of preferredKeywords) {
      const match = availableVoices.find(
        (v) => v.name.includes(kw) && v.lang.startsWith('en')
      );
      if (match) return match;
    }

    // Fallback: giọng en-US bất kỳ
    const usVoice = availableVoices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
    if (usVoice) return usVoice;

    // Fallback: giọng tiếng Anh bất kỳ
    return availableVoices.find((v) => v.lang.startsWith('en')) || null;
  }, []);

  const speak = useCallback(
    (text: string, rate: number = 0.95, onEnd?: () => void) => {
      if (!isSupported || !text) {
        onEnd?.();
        return;
      }

      console.log('TTS Speaking:', text);

      // Đảm bảo trình duyệt không ở trạng thái paused
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.pitch = 1.0;
      utterance.rate = Math.max(0.6, Math.min(1.4, rate));

      // Gán voice tự nhiên tiếng Anh
      const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const chosenVoice = selectEnglishVoice(currentVoices);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      activeUtterance = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        activeUtterance = null;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('[useSpeechSynthesis] utterance.onerror:', e);
        setIsSpeaking(false);
        activeUtterance = null;
        onEnd?.();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[useSpeechSynthesis] speak error:', err);
        setIsSpeaking(false);
        activeUtterance = null;
        onEnd?.();
      }
    },
    [isSupported, voices, selectEnglishVoice]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setIsSpeaking(false);
      activeUtterance = null;
    }
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
  };
}
