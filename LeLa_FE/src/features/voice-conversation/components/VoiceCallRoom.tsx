import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Drawer, Dropdown } from 'antd';
import { Bot, Check, Headphones, Lightbulb, Mic, MicOff, MoreHorizontal, PhoneOff, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { SttAlternative } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { initialRoomState, voiceRoomReducer, fallbackSuggestions } from '../hooks/voiceRoomMachine';
import type { RoomEvent } from '../hooks/voiceRoomMachine';
import { voiceConversationApi } from '../api/voice-conversation.api';
import type { VoiceStartResponse, VoiceTurnResponse } from '../api/voice-conversation.api';
import './VoiceCallRoom.css';

interface Props {
  sessionData: VoiceStartResponse;
  onFinishSession: (reviews?: VoiceTurnResponse[]) => void;
  onAbandonSession: () => void;
}
const labels = { idle: 'AI đang nói', aiSpeaking: 'AI đang nói', ready: 'Đến lượt bạn',
  recording: 'Đang nghe', processing: 'Đang xử lý', error: 'Đến lượt bạn', finished: 'Đã kết thúc' };
export function VoiceCallRoom({ sessionData, onFinishSession }: Props) {
  const [state, dispatch] = useReducer(voiceRoomReducer, sessionData.openingLine, initialRoomState);
  // A synchronous mirror closes the gap between callbacks and React rendering.
  const current = useRef(state);
  const send = useCallback((event: RoomEvent) => {
    current.current = voiceRoomReducer(current.current, event);
    dispatch(event);
  }, []);
  const [text, setText] = useState('');
  const [hintsOpen, setHintsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [silent, setSilent] = useState(false);
  const [headphoneHint, setHeadphoneHint] = useState(true);
  const [manualText, setManualText] = useState(false);
  const started = useRef(Date.now());
  const finishCalled = useRef(false);
  const { speak, stop: stopTts } = useSpeechSynthesis();
  const config = sessionData.uiConfig;
  const recognition = useSpeechRecognition({ lang: 'en-US', silenceMs: config.autoCommitSilenceMs,
    incompleteExtraMs: config.incompleteExtraMs, autoCommit: state.mode === 'handsFree',
    isAiSpeaking: state.phase === 'aiSpeaking',
    onUtteranceEnd: (value, alternatives, confidence, alternativeDetails) => { void submit(value, confidence, alternatives, alternativeDetails); },
    onStopped: () => send({ type: 'STOPPED' }),
    onError: (message, fatal) => {
      send({ type: 'MIC', enabled: false });
      if (fatal) setManualText(true);
      send({ type: 'FAILED', message });
    },
  });
  const { abortAndReset, start: startListening, finishNow } = recognition;
  useEffect(() => { send({ type: 'GREET' }); }, [send]);
  // One deferred speech effect: StrictMode cancels its rehearsal before speak().
  useEffect(() => {
    const speech = state.speech;
    const timer = window.setTimeout(() => {
      if (current.current.phase !== 'aiSpeaking' || current.current.speech.id !== speech.id) return;
      abortAndReset();
      speak(speech.text, config.ttsRate, () => send({ type: 'SPEECH_DONE', id: speech.id }));
    }, 0);
    return () => { window.clearTimeout(timer); stopTts(); };
  }, [state.speech.id, abortAndReset, speak, stopTts, config.ttsRate, send]);
  // Both native flags must stay quiet for a full 400 ms before opening the mic.
  useEffect(() => {
    if (state.phase !== 'ready' || state.mode !== 'handsFree' || !state.micEnabled
      || manualText || hintsOpen || menuOpen || !recognition.isSupported) return;
    let quietSince: number | null = null;
    const timer = window.setInterval(() => {
      if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) { quietSince = null; return; }
      quietSince ??= performance.now();
      if (performance.now() - quietSince < 400 || current.current.phase !== 'ready'
        || !current.current.micEnabled || current.current.mode !== 'handsFree') return;
      window.clearInterval(timer);
      send({ type: 'RECORD' });
      console.debug(`[VOICE MIC START][${new Date().toISOString()}] hands-free`);
      startListening();
    }, 50);
    return () => window.clearInterval(timer);
  }, [state.phase, state.mode, state.micEnabled, manualText, hintsOpen, menuOpen, recognition.isSupported, send, startListening]);
  const finish = useCallback(() => {
    if (finishCalled.current) return;
    finishCalled.current = true;
    abortAndReset(); stopTts(); onFinishSession(current.current.reviews);
  }, [abortAndReset, stopTts, onFinishSession]);
  useEffect(() => { if (state.phase === 'finished') finish(); }, [state.phase, finish]);
  useEffect(() => {
    setSilent(false);
    if (!['ready', 'recording'].includes(state.phase) || !config.hintAfterSilenceMs) return;
    const timer = window.setTimeout(() => setSilent(true), config.hintAfterSilenceMs);
    return () => window.clearTimeout(timer);
  }, [state.phase, recognition.transcript, config.hintAfterSilenceMs]);
  useEffect(() => {
    const timer = window.setTimeout(() => setHeadphoneHint(false), 12000);
    return () => window.clearTimeout(timer);
  }, []);
  async function submit(value: string, confidence = 1, alternatives: string[] = [], alternativeDetails: SttAlternative[] = []) {
    if (!['recording', 'ready', 'error'].includes(current.current.phase) || value.trim().length < 2) return;
    const at = current.current.submitAt ?? performance.now();
    send({ type: 'SEND', text: value }); abortAndReset();
    console.debug(`[VOICE SEND][${new Date().toISOString()}]`);
    try {
      const result = await voiceConversationApi.processTurn(sessionData.publicId, value, confidence,
        Math.floor((Date.now() - started.current) / 1000), false, alternatives, current.current.reply, alternativeDetails);
      if (current.current.phase !== 'processing') return;
      send({ type: 'RECEIVED', turn: { ...result.data, rawTranscript: value }, latencyMs: performance.now() - at });
      setText('');
    } catch { send({ type: 'FAILED', message: 'Chưa gửi được. Bạn có thể thử nói lại hoặc gửi lại.' }); }
  }
  useEffect(() => {
    if (state.latencyMs != null) console.debug(`[VOICE FEEDBACK][${new Date().toISOString()}] elapsedMs=${state.latencyMs.toFixed(1)}`);
  }, [state.latencyMs]);
  const locked = ['aiSpeaking', 'processing', 'finished', 'idle'].includes(state.phase);
  const evaluation = state.turn?.evaluation || state.turn?.userEvaluation;
  const suggestions = state.turn?.suggestions?.length === 3 ? state.turn.suggestions : fallbackSuggestions;
  const raw = state.phase === 'recording' ? recognition.transcript : state.pendingText;
  const showRaw = Boolean(raw);
  const understood = showRaw ? raw : state.turn?.intendedUtterance;
  const micLabel = state.phase === 'recording' && state.mode === 'pushToTalk' ? 'Dừng và gửi'
    : !state.micEnabled && !locked ? 'Bật mic' : labels[state.phase];
  function pauseListening() { abortAndReset(); send({ type: 'STOPPED' }); }
  function pressMic() {
    if (locked) return;
    if (!current.current.micEnabled) { send({ type: 'MIC', enabled: true }); if (state.mode === 'handsFree') return; }
    if (current.current.phase === 'recording') {
      if (state.mode === 'handsFree') { pauseListening(); send({ type: 'MIC', enabled: false }); }
      else { send({ type: 'REQUEST_SEND', at: performance.now() }); finishNow(); }
      return;
    }
    if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) return;
    send({ type: 'RECORD' }); startListening();
  }
  return <section className="voice-room" aria-label="Phòng luyện nói">
    <header className="voice-room-header">
      <Dropdown trigger={['click']} open={menuOpen} onOpenChange={open => { if (open) pauseListening(); setMenuOpen(open); }}
        menu={{ selectedKeys: [state.mode], items: [{ key: 'handsFree', label: 'Trò chuyện rảnh tay' },
          { key: 'pushToTalk', label: 'Bấm để nói' }, { key: 'mic', label: state.micEnabled ? 'Tắt mic' : 'Bật mic' },
          { key: 'text', label: manualText ? 'Dùng micro' : 'Nhập văn bản' }], onClick: ({ key }) => {
          pauseListening();
          if (key === 'mic') send({ type: 'MIC', enabled: !current.current.micEnabled });
          else if (key === 'text') { setManualText(v => !v); send({ type: 'MIC', enabled: true }); }
          else send({ type: 'MODE', mode: key as 'handsFree' | 'pushToTalk' });
          setMenuOpen(false);
        } }}>
        <button className="voice-small-button" aria-label="Tùy chọn cuộc gọi"><MoreHorizontal size={22} /></button>
      </Dropdown>
      <button className="voice-small-button voice-end" disabled={state.phase === 'processing'}
        onClick={() => send({ type: 'FINISH' })}><PhoneOff size={16} /> Kết thúc</button>
    </header>
    <div className="voice-room-conversation">
      <p className="voice-scenario">{sessionData.scenarioTitle}</p>
      <div className={`voice-avatar ${state.phase === 'aiSpeaking' ? 'voice-avatar-speaking' : ''}`} aria-hidden="true"><Bot size={64} strokeWidth={1.6} /></div>
      <p className="voice-ai-sentence" data-testid="voice-ai-sentence">{state.reply}</p>
      <p className={`voice-user-sentence ${showRaw ? 'voice-user-raw' : ''}`} aria-live="polite" data-testid="voice-user-sentence">
        {understood ? <>Bạn: {understood} {!showRaw && evaluation && !state.turn?.degraded &&
          (evaluation.hasError ? <span className="voice-retry">Thử nói lại?</span> : <Check size={18} aria-label="Đã ghi nhận" className="voice-check" />)}</>
          : ' '}
      </p>
      <div className="voice-controls">
        <button className={`voice-mic voice-mic-${state.phase} ${!state.micEnabled ? 'voice-mic-off' : ''}`}
          disabled={locked || !recognition.isSupported || manualText} onClick={pressMic} aria-label={micLabel}
          aria-pressed={state.phase === 'recording'}>
          {state.phase === 'aiSpeaking' ? <Volume2 size={38} /> : !state.micEnabled ? <MicOff size={38} /> : <Mic size={38} />}
          <span data-testid="voice-phase" role="status">{micLabel}</span>
        </button>
        <p className="voice-mode-label">{!state.micEnabled ? 'Mic đã tắt' : state.mode === 'handsFree' ? 'Rảnh tay · Chạm để bật/tắt mic' : 'Bấm để nói · Bấm lần nữa để gửi'}</p>
        <button className="voice-hint-button" onClick={() => { pauseListening(); setHintsOpen(true); }}><Lightbulb size={18} /> Gợi ý</button>
        {silent && <p className="voice-silence" role="status">Cứ từ từ. Bấm Gợi ý nếu bạn cần câu mẫu.</p>}
        {headphoneHint && <button className="voice-headphones" onClick={() => setHeadphoneHint(false)}><Headphones size={16} /> Dùng tai nghe để mic không thu lại giọng AI</button>}
      </div>
      {(!recognition.isSupported || manualText) && <form className="voice-text-form" onSubmit={event => { event.preventDefault(); void submit(text); }}>
        <input aria-label="Câu trả lời tiếng Anh" value={text} onChange={event => setText(event.target.value)} disabled={locked} />
        <button disabled={locked || !text.trim()}>Gửi</button>
      </form>}
      {state.error && <p role="alert" className="voice-error">{state.error} {state.pendingText && <button onClick={() => void submit(state.pendingText)}>Gửi lại</button>}</p>}
    </div>
    <Drawer title="Gợi ý" placement="bottom" height="auto" open={hintsOpen} onClose={() => setHintsOpen(false)} styles={{ body: { padding: '0 24px 24px' } }}>
      <div className="voice-hint-sheet">{suggestions.map((hint, i) => <p key={hint.difficulty}>
        <span>{['Dễ', 'Vừa', 'Thử thách'][i]}</span>{hint.text}</p>)}</div>
    </Drawer>
  </section>;
}
