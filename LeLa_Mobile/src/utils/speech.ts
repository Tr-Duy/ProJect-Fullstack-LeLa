import * as Speech from 'expo-speech';

export const speakEnglish = (text: string, onEnd?: () => void) => {
  if (!text) return;
  try {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: onEnd,
      onError: onEnd,
    });
  } catch (error) {
    console.warn('[Speech] Error speaking:', error);
    onEnd?.();
  }
};

export const stopSpeech = () => {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
};

