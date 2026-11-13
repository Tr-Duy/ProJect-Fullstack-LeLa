import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VoiceCallRoom } from '../src/features/voice-conversation/components/VoiceCallRoom';
import '../src/index.css';

// Test-only speech adapters. Never bundled through the application entry point.
const trace: { event: string; at: string; text?: string }[] = [];
function record(event: string, text?: string) {
  trace.push({ event, at: new Date().toISOString(), text });
  document.getElementById('trace')!.textContent = JSON.stringify(trace);
}
class Recognition {
  static current: Recognition;
  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  start() { Recognition.current = this; record('mic-start'); this.onstart?.(); }
  stop() { record('mic-stop'); this.onend?.(); }
  abort() { record('mic-abort'); }
}
(window as any).SpeechRecognition = Recognition;
if (!new URLSearchParams(location.search).has('nativeTts')) {
  let timer: ReturnType<typeof setTimeout>;
  const synthesis = {
    speaking: false, pending: false, paused: false,
    getVoices: () => [], resume() {}, onvoiceschanged: null,
    cancel() { clearTimeout(timer); synthesis.speaking = false; record('tts-cancel'); },
    speak(utterance: SpeechSynthesisUtterance) {
      synthesis.speaking = true; record('tts-speak', utterance.text);
      utterance.onstart?.({} as SpeechSynthesisEvent);
      timer = setTimeout(() => {
        synthesis.speaking = false; record('tts-end'); utterance.onend?.({} as SpeechSynthesisEvent);
      }, 300);
    },
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synthesis });
}
function App() {
  const [started, start] = useState(false);
  const [finished, finish] = useState(0);
  return <><pre id="trace" />
    <button onClick={() => start(true)}>Start fixture</button>
    <button onClick={() => Recognition.current?.onresult?.({ resultIndex: 0,
      results: [Object.assign([{ transcript: 'I would like a hot coffee please', confidence: .95 }], { isFinal: true })] })}>Deliver final speech</button>
    <output data-testid="finished">{finished}</output>
    {started && <VoiceCallRoom sessionData={{ publicId: new URLSearchParams(location.search).get('sessionId') || 'test-session', scenarioTitle: 'Coffee shop',
      aiRole: 'Barista', userRole: 'Customer', openingLine: new URLSearchParams(location.search).get('opening') || 'Hello! What would you like?', currentLevel: 200,
      durationSecondsLimit: 300, maxTurns: 10, targetWords: [], uiConfig: { ttsRate: 1, bilingualSupport: true,
      autoHintOnSilence: true, silenceThresholdSeconds: 8, autoCommitSilenceMs: 1200, incompleteExtraMs: 800,
      hintAfterSilenceMs: 8000, inputModes: ['WEB_SPEECH', 'TEXT'], configVersion: '1A' } as any }}
      onFinishSession={() => { record('finish'); finish(v => v + 1); }}
      onAbandonSession={() => start(false)} />}</>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
