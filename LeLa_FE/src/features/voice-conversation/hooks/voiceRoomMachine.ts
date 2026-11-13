import type { VoiceTurnResponse, VoiceSuggestion } from '../api/voice-conversation.api';
export type RoomPhase = 'idle' | 'aiSpeaking' | 'ready' | 'recording' | 'processing' | 'error' | 'finished';
export interface RoomState {
  phase: RoomPhase;
  speech: { id: number; text: string; endsSession: boolean };
  reply: string;
  turn: VoiceTurnResponse | null;
  error: string;
  pendingText: string;
  latencyMs: number | null;
  submitAt: number | null;
  mode: 'handsFree' | 'pushToTalk';
  micEnabled: boolean;
  reviews: VoiceTurnResponse[];
}
export type RoomEvent =
  | { type: 'GREET' } | { type: 'RECORD' } | { type: 'CANCEL' } | { type: 'STOPPED' }
  | { type: 'REQUEST_SEND'; at: number } | { type: 'SEND'; text: string } | { type: 'FAILED'; message: string }
  | { type: 'RECEIVED'; turn: VoiceTurnResponse; latencyMs: number }
  | { type: 'SPEAK'; text: string } | { type: 'SPEECH_DONE'; id: number } | { type: 'FINISH' }
  | { type: 'MODE'; mode: RoomState['mode'] } | { type: 'MIC'; enabled: boolean };
export function initialRoomState(reply: string): RoomState {
  return { phase: 'idle', speech: { id: 0, text: reply, endsSession: false }, reply,
    turn: null, error: '', pendingText: '', latencyMs: null, submitAt: null,
    mode: 'handsFree', micEnabled: true, reviews: [] };
}
export function voiceRoomReducer(state: RoomState, event: RoomEvent): RoomState {
  switch (event.type) {
    case 'GREET': return state.phase === 'idle' ? { ...state, phase: 'aiSpeaking' } : state;
    case 'RECORD': return state.micEnabled && ['ready', 'error'].includes(state.phase) ? { ...state, phase: 'recording', error: '', submitAt: null } : state;
    case 'MODE': return { ...state, mode: event.mode, phase: state.phase === 'recording' ? 'ready' : state.phase };
    case 'MIC': return { ...state, micEnabled: event.enabled, phase: !event.enabled && state.phase === 'recording' ? 'ready' : state.phase };
    case 'REQUEST_SEND': return state.phase === 'recording' ? { ...state, submitAt: event.at } : state;
    case 'CANCEL': case 'STOPPED': return state.phase === 'recording' ? { ...state, phase: 'ready', pendingText: '' } : state;
    case 'SEND': return ['recording', 'ready', 'error'].includes(state.phase) && event.text.trim()
      ? { ...state, phase: 'processing', pendingText: event.text, error: '' } : state;
    case 'RECEIVED': return state.phase === 'processing' ? { ...state, phase: 'aiSpeaking', reply: event.turn.aiReply,
      turn: event.turn, reviews: [...state.reviews, event.turn], pendingText: '', latencyMs: event.latencyMs, submitAt: null,
      speech: { id: state.speech.id + 1, text: event.turn.aiReply, endsSession: event.turn.sessionEnded } } : state;
    case 'FAILED': return state.phase !== 'finished' ? { ...state, phase: 'error', error: event.message } : state;
    case 'SPEAK': return ['ready', 'error'].includes(state.phase) ? { ...state, phase: 'aiSpeaking',
      speech: { id: state.speech.id + 1, text: event.text, endsSession: false } } : state;
    case 'SPEECH_DONE': return state.phase === 'aiSpeaking' && state.speech.id === event.id
      ? { ...state, phase: state.speech.endsSession ? 'finished' : 'ready' } : state;
    case 'FINISH': return { ...state, phase: 'finished' };
  }
}
export const fallbackSuggestions: VoiceSuggestion[] = [
  { difficulty: 'EASY', text: 'Could you say that again, please?' },
  { difficulty: 'MEDIUM', text: 'Could you explain what you mean, please?' },
  { difficulty: 'CHALLENGE', text: 'I am not quite sure I understand. Could you give me an example?' },
];
