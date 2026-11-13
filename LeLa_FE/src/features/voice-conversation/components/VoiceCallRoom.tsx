import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Button } from 'antd';
import { Mic, Volume2, PhoneOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { initialRoomState, voiceRoomReducer, fallbackSuggestions } from '../hooks/voiceRoomMachine';
import type { RoomEvent } from '../hooks/voiceRoomMachine';
import { voiceConversationApi } from '../api/voice-conversation.api';
import type { VoiceStartResponse } from '../api/voice-conversation.api';

interface Props { sessionData: VoiceStartResponse; onFinishSession: () => void; onAbandonSession: () => void }
const labels = { idle: 'Sẵn sàng', ready: 'Sẵn sàng', recording: 'Đang thu', processing: 'Đang gửi',
  aiSpeaking: 'AI đang nói', error: 'Sẵn sàng', finished: 'Đã hoàn thành' };
export function VoiceCallRoom({ sessionData, onFinishSession, onAbandonSession }: Props) {
  const [state, dispatch] = useReducer(voiceRoomReducer, sessionData.openingLine, initialRoomState);
  // One synchronous reducer mirror prevents double clicks before React commits a render.
  const current = useRef(state);
  const send = useCallback((event: RoomEvent) => {
    current.current = voiceRoomReducer(current.current, event);
    dispatch(event);
  }, []);
  const [text, setText] = useState('');
  const [details, setDetails] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [selectedHint, setSelectedHint] = useState('');
  const [autoCommit, setAutoCommit] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(sessionData.durationSecondsLimit);
  const [manualText, setManualText] = useState(false);
  const started = useRef(Date.now());
  const finishCalled = useRef(false);
  const { speak, stop: stopTts } = useSpeechSynthesis();
  const config = sessionData.uiConfig;
  const recognition = useSpeechRecognition({ lang: 'en-US', silenceMs: config.autoCommitSilenceMs,
    incompleteExtraMs: config.incompleteExtraMs, autoCommit, isAiSpeaking: state.phase === 'aiSpeaking',
    onUtteranceEnd: (value, alternatives, confidence) => { void submit(value, confidence, alternatives); },
    onStopped: () => send({ type: 'STOPPED' }),
    onError: (message, fatal) => { if (fatal) setManualText(true); send({ type: 'FAILED', message }); },
  });
  const { abortAndReset, start: startListening, finishNow } = recognition;
  useEffect(() => { send({ type: 'GREET' }); }, [send]);
  // The only speak() call site for greeting, replies, replay and hint preview.
  // Deferring one task lets StrictMode cancel its rehearsal before speech starts.
  useEffect(() => {
    const speech = state.speech;
    const timer = window.setTimeout(() => {
      if (current.current.phase !== 'aiSpeaking' || current.current.speech.id !== speech.id) return;
      abortAndReset();
      speak(speech.text, config.ttsRate, () => send({ type: 'SPEECH_DONE', id: speech.id }));
    }, 0);
    return () => { window.clearTimeout(timer); stopTts(); };
  }, [state.speech.id, abortAndReset, speak, stopTts, config.ttsRate, send]);
  const finish = useCallback(() => {
    if (finishCalled.current) return;
    finishCalled.current = true;
    abortAndReset(); stopTts(); onFinishSession();
  }, [abortAndReset, stopTts, onFinishSession]);
  useEffect(() => { if (state.phase === 'finished') finish(); }, [state.phase, finish]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, sessionData.durationSecondsLimit - Math.floor((Date.now() - started.current) / 1000));
      setSecondsLeft(remaining);
      if (!remaining && current.current.phase !== 'aiSpeaking' && current.current.phase !== 'processing') send({ type: 'FINISH' });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionData.durationSecondsLimit, send]);
  useEffect(() => {
    if (!config.hintAfterSilenceMs || !['ready', 'recording'].includes(state.phase)) return;
    const timer = window.setTimeout(() => setShowHints(true), config.hintAfterSilenceMs);
    return () => window.clearTimeout(timer);
  }, [state.phase, recognition.transcript, config.hintAfterSilenceMs]);
  async function submit(value: string, confidence = 1, alternatives: string[] = []) {
    if (!['recording', 'ready', 'error'].includes(current.current.phase) || value.trim().length < 2) return;
    const at = current.current.submitAt ?? performance.now();
    send({ type: 'SEND', text: value });
    abortAndReset(); setDetails(false); setSelectedHint('');
    console.debug(`[VOICE SEND][${new Date().toISOString()}]`);
    try {
      const result = await voiceConversationApi.processTurn(sessionData.publicId, value, confidence,
        Math.floor((Date.now() - started.current) / 1000), false, alternatives, current.current.reply);
      if (current.current.phase !== 'processing') return;
      send({ type: 'RECEIVED', turn: result.data, latencyMs: performance.now() - at });
      setText(''); setShowHints(true);
    } catch { send({ type: 'FAILED', message: 'Chưa gửi được. Bạn có thể thử gửi lại hoặc nói câu khác.' }); }
  }
  useEffect(() => {
    if (state.latencyMs != null) console.debug(`[VOICE FEEDBACK][${new Date().toISOString()}] elapsedMs=${state.latencyMs.toFixed(1)}`);
  }, [state.latencyMs]);
  const locked = ['aiSpeaking', 'processing', 'finished', 'idle'].includes(state.phase);
  const evaluation = state.turn?.evaluation || state.turn?.userEvaluation;
  const suggestions = state.turn?.suggestions?.length === 3 ? state.turn.suggestions : fallbackSuggestions;
  const targetWords = state.turn?.updatedTargetWords ?? sessionData.targetWords;
  const hintNames = { EASY: 'Dễ', MEDIUM: 'Vừa', CHALLENGE: 'Thử thách' };
  return <section className="max-w-3xl mx-auto p-5 space-y-5 bg-white rounded-3xl border border-orange-100 shadow-sm" aria-label="Phòng luyện nói">
    <header className="flex justify-between gap-4 items-center">
      <div><h2 className="font-bold text-xl">{sessionData.scenarioTitle}</h2><p>{sessionData.aiRole} · {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} · Lượt nói {state.turn?.validTurnCount ?? 0}/{sessionData.maxTurns}</p></div>
      <Button onClick={() => { abortAndReset(); stopTts(); onAbandonSession(); }} icon={<PhoneOff size={16} />}>Thoát</Button>
    </header>
    {targetWords.length > 0 && <div aria-label="Từ mục tiêu" className="flex flex-wrap gap-2">{targetWords.map(word =>
      <span key={word.flashcardId} title={word.meaning} className={`rounded-full px-3 py-1 text-sm ${word.usedCorrectly ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-800'}`}>
        {word.usedCorrectly ? '✓ ' : ''}{word.word}
      </span>)}</div>}
    <p role="status" data-testid="voice-phase" className="text-orange-700 font-semibold">{labels[state.phase]}</p>
    <div className="bg-orange-50 rounded-2xl p-5"><p className="text-xl">{state.reply}</p>
      <Button aria-label="Nghe lại câu AI" disabled={locked || state.phase === 'recording'} icon={<Volume2 size={16} />}
        onClick={() => send({ type: 'SPEAK', text: state.reply })}>Nghe lại</Button>
      {state.phase === 'aiSpeaking' && <Button onClick={() => { stopTts(); send({ type: 'SPEECH_DONE', id: state.speech.id }); }}>Bỏ qua giọng AI</Button>}
    </div>
    {state.turn && <div><button className="text-left text-orange-800 underline" aria-expanded={details}
      onClick={() => setDetails(value => !value)}>{state.turn.feedbackLine || (state.turn.degraded ? 'AI đang bận, bạn có thể tiếp tục luyện tập.' : evaluation?.grammarCheck || 'Bạn đã hoàn thành lượt nói.')}</button>
      {details && <dl className="mt-3 p-4 bg-slate-50 rounded-xl text-sm space-y-2">
        <dt>Câu AI hiểu</dt><dd>{state.turn.intendedUtterance}</dd><dt>Ngữ pháp</dt><dd>{evaluation?.grammarCheck || 'Chưa đánh giá'}</dd>
        <dt>Cách nói tự nhiên hơn</dt><dd>{evaluation?.suggestedImprovement || 'Không có gợi ý thêm'}</dd>
        <dt>Mẹo phát âm</dt><dd>{evaluation?.phoneticTip || 'Chưa có mẹo thêm'} (Mẹo chung từ văn bản, không chấm phát âm.)</dd>
      </dl>}</div>}
    <div><Button onClick={() => { setShowHints(true); setSelectedHint(suggestions[0].text); }}>Không biết nói gì</Button>
      {showHints && <div className="flex flex-wrap gap-2 mt-2">{suggestions.map(hint => <button key={hint.difficulty}
        className="rounded-full border border-orange-200 px-4 py-2 hover:bg-orange-50 disabled:opacity-50" disabled={locked || state.phase === 'recording'}
        onClick={() => setSelectedHint(hint.text)}>{hintNames[hint.difficulty]}</button>)}</div>}
      {selectedHint && <div className="mt-2"><p>{selectedHint}</p><Button disabled={locked || state.phase === 'recording'}
        onClick={() => send({ type: 'SPEAK', text: selectedHint })}>Nghe câu mẫu</Button></div>}
    </div>
    {state.phase === 'recording' && <div aria-live="polite"><strong>{recognition.finalTranscript}</strong> <em>{recognition.interimTranscript}</em></div>}
    <div className="flex gap-3 flex-wrap">
      <Button type="primary" disabled={locked || !recognition.isSupported || manualText} icon={<Mic size={18} />}
        onClick={() => {
          if (current.current.phase === 'recording') { send({ type: 'REQUEST_SEND', at: performance.now() }); finishNow(); return; }
          if (!['ready', 'error'].includes(current.current.phase)) return;
          if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) return;
          send({ type: 'RECORD' }); console.debug(`[VOICE MIC START][${new Date().toISOString()}] user-click`); startListening();
        }}>{state.phase === 'recording' ? 'Dừng và gửi' : 'Bấm để nói'}</Button>
      {state.phase === 'recording' && <Button onClick={() => { abortAndReset(); send({ type: 'CANCEL' }); }}>Hủy</Button>}
      <Button disabled={state.phase === 'processing'} onClick={() => send({ type: 'FINISH' })}>Hoàn thành</Button>
    </div>
    {config.autoCommitSilenceMs != null && config.incompleteExtraMs != null && <label className="block text-sm"><input type="checkbox"
      disabled={state.phase === 'recording' || locked} checked={autoCommit} onChange={event => setAutoCommit(event.target.checked)} /> Tự động gửi (tắt mặc định)</label>}
    {recognition.isSupported && <Button disabled={locked || state.phase === 'recording'} onClick={() => setManualText(v => !v)}>Nhập văn bản</Button>}
    {(!recognition.isSupported || manualText) && <form onSubmit={event => { event.preventDefault(); void submit(text); }} className="flex gap-2">
      <input aria-label="Câu trả lời tiếng Anh" value={text} onChange={event => setText(event.target.value)} disabled={locked} className="border rounded-lg p-2 flex-1" />
      <Button htmlType="submit" disabled={locked || !text.trim()}>Gửi</Button></form>}
    {state.error && <div role="alert">{state.error}{state.pendingText && <Button onClick={() => void submit(state.pendingText)}>Thử gửi lại</Button>}</div>}
  </section>;
}
