import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VoiceCallRoom } from '../src/features/voice-conversation/components/VoiceCallRoom';
import { VoiceReportModal } from '../src/features/voice-conversation/components/VoiceReportModal';
import { mergeSessionReview } from '../src/features/voice-conversation/hooks/voiceReportReview';
import type { VoiceReportResponse } from '../src/features/voice-conversation/api/voice-conversation.api';
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
  const [preview, setPreview] = useState(false);
  const [report, setReport] = useState<VoiceReportResponse | null>(null);
  return <><div style={preview ? { display: 'none' } : undefined}><pre id="trace" />
    <button onClick={() => start(true)}>Start fixture</button>
    <button onClick={() => setPreview(true)}>Hide fixture controls</button>
    <button onClick={() => Recognition.current?.onresult?.({ resultIndex: 0,
      results: [Object.assign([{ transcript: 'I would like a hot coffee please', confidence: .95 }], { isFinal: true })] })}>Deliver final speech</button>
    <button onClick={() => Recognition.current?.onresult?.({ resultIndex: 0,
      results: [Object.assign([{ transcript: 'I would like a coffee and', confidence: .3 }, { transcript: 'I would like coffee and', confidence: .25 }], { isFinal: true })] })}>Deliver incomplete speech</button>
    <button onClick={() => Recognition.current?.onresult?.({ resultIndex: 0,
      results: [Object.assign([{ transcript: 'a', confidence: 0 }], { isFinal: true })] })}>Deliver noise</button>
    <button onClick={() => Recognition.current?.onresult?.({ resultIndex: 0,
      results: [Object.assign([{ transcript: 'I would like', confidence: .8 }], { isFinal: false })] })}>Deliver interim speech</button>
    <button onClick={() => Recognition.current?.onend?.()}>End recognition</button>
    <button onClick={() => Recognition.current?.onresult?.({ resultIndex: 0,
      results: [Object.assign([{ transcript: 'hot coffee please', confidence: .9 }, { transcript: 'hot toffee please', confidence: .4 }], { isFinal: true })] })}>Deliver continuation</button>
    <button onClick={() => { (window.speechSynthesis as unknown as { pending: boolean }).pending = true; }}>Hold native queue</button>
    <button onClick={() => { (window.speechSynthesis as unknown as { pending: boolean }).pending = false; }}>Release native queue</button>
    <output data-testid="finished">{finished}</output>
    </div>
    {started && <VoiceCallRoom sessionData={{ publicId: new URLSearchParams(location.search).get('sessionId') || 'test-session', scenarioTitle: 'Coffee shop',
      aiRole: 'Barista', userRole: 'Customer', openingLine: new URLSearchParams(location.search).get('opening') || 'Hello! What would you like?', currentLevel: 200,
      durationSecondsLimit: 300, maxTurns: 10, targetWords: [], uiConfig: { ttsRate: 1, bilingualSupport: true,
      autoHintOnSilence: true, silenceThresholdSeconds: 8, autoCommitSilenceMs: 1200, incompleteExtraMs: 800,
      hintAfterSilenceMs: 8000, inputModes: ['WEB_SPEECH', 'TEXT'], configVersion: '1A' } as any }}
      onFinishSession={reviews => {
        record('finish'); finish(v => v + 1);
        if (new URLSearchParams(location.search).has('report')) setReport(mergeSessionReview({
          publicId: 'test-session', overallScore: 75, pronunciationScore: null, grammarScore: 75,
          fluencyScore: 75, vocabularyScore: 0, vocabularyScoreAvailable: false, systemRecommendation: 'KEEP',
          userFeedback: '', oldLevel: 200, newLevel: 200, xpAwarded: 50, consecutiveHardWarning: false,
          targetWords: [], corrections: [],
        }, reviews || []));
      }}
      onAbandonSession={() => start(false)} />}
    <VoiceReportModal visible={Boolean(report)} report={report} onFeedback={() => setReport(null)} onClose={() => setReport(null)} />
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
