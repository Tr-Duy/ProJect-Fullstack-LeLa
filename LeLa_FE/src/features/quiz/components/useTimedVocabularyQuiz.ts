import { useEffect, useRef, useState } from 'react';

export type VocabularyMode = 'MULTIPLE_CHOICE_MEANING' | 'MATCHING_PAIRS';
export interface QuizCell { id: string; text: string }
export interface TimedQuizView {
  attemptId: number; publicId: string; title: string; index: number; total: number;
  serverNow: number; deadline: number; seconds: number; started: boolean; paused: boolean; done: boolean; timedOut: boolean;
  closed: boolean; type: VocabularyMode; prompt: string; left: QuizCell[]; right: QuizCell[];
  matched: string[]; errors: number; selected: string | null; solution: Record<string, string>;
  score: number; lastCorrect: boolean | null;
}
export interface QuizEvent { action: string; index: number; requestId: string; leftId?: string; rightId?: string }
export const vocabularyModes: { type: VocabularyMode; title: string }[] = [
  { type: 'MULTIPLE_CHOICE_MEANING', title: 'Chọn đáp án đúng' },
  { type: 'MATCHING_PAIRS', title: 'Ghép cặp từ - Định nghĩa' },
];

export function useTimedVocabularyQuiz(initial: TimedQuizView,
  send: (event: QuizEvent) => Promise<TimedQuizView>) {
  const [view, setView] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState(false);
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((initial.deadline - initial.serverNow) / 1000)));
  const [selection, setSelection] = useState<{ side: 'left' | 'right'; id: string } | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const latest = useRef(view);
  useEffect(() => { latest.current = view; }, [view]);
  const [initialOffset] = useState(() => initial.serverNow - Date.now());
  const offset = useRef(initialOffset);
  const lock = useRef(false);
  const pending = useRef<QuizEvent | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function execute(event: QuizEvent) {
    if (lock.current) return;
    lock.current = true; pending.current = event; setBusy(true); setError('');
    try {
      const next = await send(event);
      if (!mounted.current) return;
      offset.current = next.serverNow - Date.now();
      setView(next); setSelection(null);
      setRemaining(Math.max(0, Math.ceil((next.deadline - next.serverNow) / 1000)));
      if (next.lastCorrect === false && event.action === 'PAIR') setWrong([event.leftId!, event.rightId!]);
      pending.current = null;
    } catch {
      if (mounted.current) setError('Chưa nhận được xác nhận từ máy chủ. Hãy thử lại.');
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  function act(action: string, leftId?: string, rightId?: string) {
    if (pending.current || lock.current) return;
    return execute({ action, leftId, rightId, index: latest.current.index,
      requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  }
  const actionRef = useRef(act);
  useEffect(() => { actionRef.current = act; });
  useEffect(() => {
    if (!view.started) { void actionRef.current('BEGIN'); return; }
    if (hidden || view.paused || view.done || view.closed) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((view.deadline - Date.now() - offset.current) / 1000));
      setRemaining(left);
      if (left === 0) void actionRef.current('TIMEOUT');
    };
    tick(); const timer = setInterval(tick, 200); return () => clearInterval(timer);
  }, [view.deadline, view.started, view.paused, view.done, view.closed, hidden]);
  useEffect(() => {
    if (!wrong.length) return;
    const timer = setTimeout(() => setWrong([]), 500); return () => clearTimeout(timer);
  }, [wrong]);

  function choose(side: 'left' | 'right', id: string) {
    if (busy || error || hidden || view.paused || view.done || remaining === 0 || view.matched.includes(id) || wrong.length) return;
    if (view.type === 'MULTIPLE_CHOICE_MEANING') { void act('ANSWER', id); return; }
    if (!selection || selection.side === side) setSelection({ side, id });
    else void act('PAIR', side === 'left' ? id : selection.id, side === 'right' ? id : selection.id);
  }
  function background() { setHidden(true); setSelection(null); }
  async function foreground() {
    // Background does not extend the authoritative deadline.
    if (pending.current) await execute(pending.current);
    else await act('SYNC');
    setHidden(false);
  }
  return { view, remaining, busy, error, hidden, selection, wrong, choose, act, background, foreground,
    retry: () => pending.current && execute(pending.current) };
}
