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

      // Hủy bỏ phát âm dở dang nếu có để làm sạch hàng đợi của trình duyệt (tránh bị kẹt queue trong Chrome)
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

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
      setIsSpeaking(true);

      utterance.onstart = () => {
        const now = new Date().toISOString();
        console.log(`[TTS ONSTART][${now}] utterance started speaking`);
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        const now = new Date().toISOString();
        console.log(`[TTS ONEND][${now}] utterance finished speaking`);
        setIsSpeaking(false);
        activeUtterance = null;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        const now = new Date().toISOString();
        console.warn(`[TTS ONERROR][${now}] utterance.onerror:`, e);
        setIsSpeaking(false);
        activeUtterance = null;
        onEnd?.();
      };

      // Đệm 50ms sau khi cancel() để Chrome engine giải phóng buffer hoàn toàn trước khi phát câu mới
      setTimeout(() => {
        try {
          const now = new Date().toISOString();
          console.log(`[TTS EXECUTE SPEAK][${now}] window.speechSynthesis.speak called`);
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error('[useSpeechSynthesis] speak error:', err);
          setIsSpeaking(false);
          activeUtterance = null;
          onEnd?.();
        }
      }, 50);
    },
    [isSupported, voices, selectEnglishVoice]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      if (activeUtterance) {
        activeUtterance = null;
      }
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
  };
}
