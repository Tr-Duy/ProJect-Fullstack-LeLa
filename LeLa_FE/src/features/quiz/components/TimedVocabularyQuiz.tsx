import { useSpeechSynthesis } from '../../voice-conversation/hooks/useSpeechSynthesis';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Modal } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quizAttemptsApi } from '../api/quiz-attempts.api';
import { timedVocabularyApi } from '../api/timed-vocabulary.api';
import { useTimedVocabularyQuiz, vocabularyModes } from './useTimedVocabularyQuiz';
import type { QuizCell, TimedQuizView, VocabularyMode } from './useTimedVocabularyQuiz';

export function VocabularyQuizLauncher() {
  const { data: modes } = useQuery({ queryKey: ['vocabulary-modes'], queryFn: timedVocabularyApi.modes });
  const [initial, setInitial] = useState<TimedQuizView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function start(type: VocabularyMode) {
    if (busy) return;
    setBusy(true); setError('');
    try { setInitial(await timedVocabularyApi.start(type)); }
    catch { setError('Không thể bắt đầu bài. Kho từ có thể chưa đủ hoặc máy chủ chưa sẵn sàng.'); }
    finally { setBusy(false); }
  }
  return <section className="mb-6 rounded-xl bg-white p-5 border border-orange-200">
    <h2 className="text-xl font-bold mb-3">Bài thi từ vựng</h2>
    <div className="flex flex-wrap gap-3">{vocabularyModes.filter(m => modes?.[m.type] === true).map(m =>
      <Button key={m.type} disabled={busy} className="!min-h-12 !text-base" onClick={() => void start(m.type)}>{m.title}</Button>)}</div>
    {error && <Alert type="error" title={error} />}
    <Modal open={!!initial} footer={null} closable={false} width={800} destroyOnHidden maskClosable={false} keyboard={false}>
      {initial && <TimedVocabularyQuiz initial={initial} onExit={() => setInitial(null)} />}
    </Modal>
  </section>;
}

export function TimedVocabularyQuiz({ initial, onExit, legacyAnswers = [] }: { initial: TimedQuizView; onExit: () => void; legacyAnswers?: unknown[] }) {
  const quiz = useTimedVocabularyQuiz(initial, event => timedVocabularyApi.event(initial.attemptId, event));
  const { view, remaining, busy, error, hidden, selection, wrong, choose, act } = quiz;
  const navigate = useNavigate();
  const speech = useSpeechSynthesis();
  const [exiting, setExiting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');
  const finishLock = useRef(false);
  const hiddenRef = useRef(quiz);
  useEffect(() => { hiddenRef.current = quiz; });
  useEffect(() => {
    const changed = () => document.hidden ? hiddenRef.current.background() : void hiddenRef.current.foreground();
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  async function finish(abandoned = false) {
    if (finishLock.current) return;
    finishLock.current = true; setFinishing(true); setFinishError('');
    try {
      await quizAttemptsApi.submitAttempt(view.attemptId, { answers: legacyAnswers, abandoned });
      navigate(`/quiz-attempts/${view.publicId}/result`, { replace: true });
      onExit();
    } catch { setFinishError('Chưa nộp được bài. Bấm lại để thử nộp.'); }
    finally { finishLock.current = false; setFinishing(false); }
  }
  async function next() {
    if (view.index + 1 === view.total) await finish();
    else await act('NEXT');
  }
  const covered = view.paused || hidden || exiting;
  useEffect(() => { if (covered) speech.stop(); }, [covered, speech.stop]);
  function cell(cell: QuizCell, side: 'left' | 'right') {
    const matched = view.matched.includes(cell.id);
    const correct = view.done && view.type === 'MULTIPLE_CHOICE_MEANING' && view.solution.answer === cell.id;
    const incorrect = wrong.includes(cell.id) || (view.done && view.selected === cell.id && !correct);
    return <button key={cell.id} type="button" disabled={busy || !!error || view.done || matched || remaining === 0}
      onClick={() => choose(side, cell.id)} aria-pressed={selection?.id === cell.id}
      className={`w-full min-h-14 rounded-2xl border-2 px-4 py-4 text-base font-semibold transition-colors ${matched ? 'opacity-40 border-green-500 bg-green-50' : correct ? 'border-green-600 bg-green-100' : incorrect ? 'border-red-600 bg-red-100' : selection?.id === cell.id ? 'border-orange-600 bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-400'}`}>
      {cell.text}{matched ? ' ✓' : ''}{correct ? ' ✓' : ''}{incorrect ? ' ✕' : ''}
    </button>;
  }
  return <div className="relative min-h-[520px] text-stone-900" style={{ fontSize: 16 }}>
    {!covered && <div className="flex items-center justify-between gap-3 mb-4">
      <Button aria-label="Thoát" className="!min-w-12 !min-h-12 !text-lg" disabled={busy || finishing} onClick={() => setExiting(true)}>X</Button>
      <strong>{view.index + 1}/{view.total}</strong>
      <Button aria-label="Tạm dừng" className="!min-w-12 !min-h-12 !text-lg" disabled={busy || view.done || finishing} onClick={() => void act('PAUSE')}>||</Button>
    </div>}
    <h2 className="text-2xl font-bold mb-4">{view.title}</h2>
    <div role="timer" aria-label="Thời gian còn lại" className={`text-right font-bold text-xl mb-2 ${remaining <= 5 ? 'text-red-600' : 'text-orange-600'}`}>{remaining}s</div>
    <div className="h-2 bg-stone-100 rounded-full mb-6"><div className={`h-full rounded-full ${remaining <= 5 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, remaining / view.seconds * 100)}%` }} /></div>
    {!covered && <>
      {view.type === 'MULTIPLE_CHOICE_MEANING' ? <><p className="text-xl text-center font-semibold my-8">{view.prompt}</p><div className="grid gap-3">{view.left.map(c => cell(c, 'left'))}</div></>
        : <><p className="mb-4">Chạm một từ rồi chọn nghĩa tương ứng. Lỗi: {view.errors}</p><div className="grid grid-cols-2 gap-3"><div className="grid gap-3">{view.left.map(c => cell(c, 'left'))}</div><div className="grid gap-3">{view.right.map(c => cell(c, 'right'))}</div></div></>}
      {view.done && <p role="status" className="my-4 font-semibold">{view.timedOut ? 'Hết giờ. ' : ''}{view.type === 'MULTIPLE_CHOICE_MEANING' ? `Đáp án đúng: ${view.left.find(c => c.id === view.solution.answer)?.text ?? ''}` : `Đã ghép ${view.matched.length / 2}/4 cặp. Điểm màn: ${view.score}`}</p>}
      {view.done && view.type === 'MATCHING_PAIRS' && <div>{view.left.map(c => <p key={c.id}>{c.text} — {view.right.find(r => r.id === view.solution[c.id])?.text}</p>)}</div>}
    </>}
    {view.done && !covered && speech.isSupported && <Button className="!min-h-12 !text-base mt-4" onClick={() => speech.speak(view.type === 'MATCHING_PAIRS' ? view.left.map(c => c.text).join('. ') : view.left.find(c => c.id === view.solution.answer)?.text || '')}>Nghe phát âm</Button>}
    {(error || finishError) && <Alert className="mt-4" type="error" title={error || finishError} action={error && <Button onClick={() => void quiz.retry()}>Thử lại</Button>} />}
    {!covered && <Button type="primary" disabled={!view.done || busy || !!error || finishing} loading={finishing} className="!w-full !min-h-12 !text-base mt-6 !bg-orange-600 disabled:!bg-stone-300" onClick={() => void next()}>{view.type === 'MATCHING_PAIRS' ? 'Tiếp theo' : 'Tiếp tục'}</Button>}
    {covered && <div className="absolute inset-0 z-10 bg-[#fffaf5] flex flex-col items-center justify-center gap-5 p-6 text-center">
      <h3 className="text-2xl font-bold">{exiting ? 'Thoát bài thi?' : 'Đã tạm dừng'}</h3>
      {exiting && <p>Giữ kết quả phần đã làm. Phần chưa làm không cộng điểm hoặc XP.</p>}
      <Button className="!min-h-12 !text-base" disabled={busy || finishing || hidden} onClick={() => exiting ? setExiting(false) : void act('RESUME')}>Tiếp tục</Button>
      <Button danger className="!min-h-12 !text-base" disabled={busy || finishing} onClick={() => exiting ? void finish(true) : setExiting(true)}>Thoát</Button>
      {(finishError || error) && <p role="alert">{finishError || error}</p>}
      {error && <Button onClick={() => void quiz.retry()}>Thử lại</Button>}
    </div>}
  </div>;
}
