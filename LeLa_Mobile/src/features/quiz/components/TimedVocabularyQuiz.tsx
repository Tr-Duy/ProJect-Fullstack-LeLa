import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { timedVocabularyService as api } from '../services/timedVocabularyService';
import { useTimedVocabularyQuiz, vocabularyModes } from './useTimedVocabularyQuiz';
import type { QuizCell, TimedQuizView, VocabularyMode } from './useTimedVocabularyQuiz';
import type { QuizAttemptDetailResponse } from '../../../types';

export function VocabularyQuizLauncher({ onFinished }: { onFinished: (result: QuizAttemptDetailResponse) => void }) {
  const [modes, setModes] = useState<Record<string, boolean | number>>({});
  const [initial, setInitial] = useState<TimedQuizView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exitRequest, setExitRequest] = useState(0);
  useEffect(() => { let live = true; api.modes().then(m => { if (live) setModes(m); }).catch(() => {}); return () => { live = false; }; }, []);
  async function start(type: VocabularyMode) {
    if (busy) return;
    setBusy(true); setError('');
    try { setInitial(await api.start(type)); }
    catch { setError('Không thể bắt đầu bài. Kho từ có thể chưa đủ hoặc máy chủ chưa sẵn sàng.'); }
    finally { setBusy(false); }
  }
  return <View style={styles.launcher}>
    <Text style={styles.title}>Bài thi từ vựng</Text>
    {vocabularyModes.filter(m => modes[m.type] === true).map(m => <TouchableOpacity key={m.type} style={styles.button} disabled={busy} onPress={() => void start(m.type)}><Text style={styles.text}>{m.title}</Text></TouchableOpacity>)}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {busy && <ActivityIndicator color="#ea580c" />}
    <Modal visible={!!initial} animationType="slide" onRequestClose={() => setExitRequest(n => n + 1)}>
      {initial && <TimedVocabularyQuiz initial={initial} exitRequest={exitRequest} onFinished={r => { setInitial(null); onFinished(r); }} />}
    </Modal>
  </View>;
}

export function TimedVocabularyQuiz({ initial, onFinished, legacyAnswers = [], exitRequest = 0 }: { initial: TimedQuizView; onFinished: (result: QuizAttemptDetailResponse) => void; legacyAnswers?: unknown[]; exitRequest?: number }) {
  const quiz = useTimedVocabularyQuiz(initial, event => api.event(initial.attemptId, event));
  const { view, remaining, busy, error, hidden, selection, wrong, choose, act } = quiz;
  const [exiting, setExiting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');
  const lock = useRef(false);
  const latest = useRef(quiz);
  useEffect(() => { latest.current = quiz; });
  useEffect(() => { if (exitRequest > 0) setExiting(true); }, [exitRequest]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') { latest.current.background(); void Speech.stop(); }
      else void latest.current.foreground();
    });
    return () => { subscription.remove(); void Speech.stop(); };
  }, []);
  useEffect(() => { if (view.paused || hidden || exiting) void Speech.stop(); }, [view.paused, hidden, exiting]);
  async function finish(abandoned = false) {
    if (lock.current) return;
    lock.current = true; setFinishing(true); setFinishError('');
    try { const result = await api.finish(view.attemptId, abandoned, legacyAnswers); onFinished(result); }
    catch { setFinishError('Chưa nộp được bài. Bấm lại để thử nộp.'); }
    finally { lock.current = false; setFinishing(false); }
  }
  const covered = view.paused || hidden || exiting;
  function cell(cell: QuizCell, side: 'left' | 'right') {
    const matched = view.matched.includes(cell.id);
    const correct = view.done && view.type === 'MULTIPLE_CHOICE_MEANING' && view.solution.answer === cell.id;
    const incorrect = wrong.includes(cell.id) || (view.done && view.selected === cell.id && !correct);
    return <TouchableOpacity key={cell.id} accessibilityRole="button" accessibilityState={{ selected: selection?.id === cell.id, disabled: busy || view.done || matched }}
      disabled={busy || !!error || view.done || matched || remaining === 0} onPress={() => choose(side, cell.id)}
      style={[styles.cell, matched && styles.matched, correct && styles.correct, incorrect && styles.incorrect, selection?.id === cell.id && styles.selected]}>
      <Text style={styles.text}>{cell.text}{matched || correct ? ' ✓' : incorrect ? ' ✕' : ''}</Text>
    </TouchableOpacity>;
  }
  return <SafeAreaView style={styles.safe}>
    {!covered && <View style={styles.header}>
      <TouchableOpacity style={styles.smallButton} accessibilityLabel="Thoát" disabled={busy || finishing} onPress={() => setExiting(true)}><Text style={styles.text}>X</Text></TouchableOpacity>
      <Text style={styles.text}>{view.index + 1}/{view.total}</Text>
      <TouchableOpacity style={styles.smallButton} accessibilityLabel="Tạm dừng" disabled={busy || view.done || finishing} onPress={() => void act('PAUSE')}><Text style={styles.text}>||</Text></TouchableOpacity>
    </View>}
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{view.title}</Text>
      <Text accessibilityRole="timer" style={[styles.clock, remaining <= 5 && styles.error]}>{remaining}s</Text>
      {!covered && <>
        {view.type === 'MULTIPLE_CHOICE_MEANING' ? <><Text style={styles.prompt}>{view.prompt}</Text>{view.left.map(c => cell(c, 'left'))}</>
          : <><Text style={styles.text}>Chạm từ rồi chọn nghĩa tương ứng. Lỗi: {view.errors}</Text><View style={styles.columns}><View style={styles.column}>{view.left.map(c => cell(c, 'left'))}</View><View style={styles.column}>{view.right.map(c => cell(c, 'right'))}</View></View></>}
        {view.done && <Text style={styles.feedback}>{view.timedOut ? 'Hết giờ. ' : ''}{view.type === 'MULTIPLE_CHOICE_MEANING' ? `Đáp án đúng: ${view.left.find(c => c.id === view.solution.answer)?.text ?? ''}` : `Đã ghép ${view.matched.length / 2}/4 cặp. Điểm màn: ${view.score}`}</Text>}
        {view.done && view.left.map(c => view.type === 'MATCHING_PAIRS' ? <Text key={c.id} style={styles.text}>{c.text} — {view.right.find(r => r.id === view.solution[c.id])?.text}</Text> : null)}
        {view.done && <TouchableOpacity style={styles.button} onPress={() => {
          const text = view.type === 'MULTIPLE_CHOICE_MEANING' ? view.left.find(c => c.id === view.solution.answer)?.text : view.left.map(c => c.text).join('. ');
          if (text) { void Speech.stop(); Speech.speak(text, { language: 'en-US' }); }
        }}><Text style={styles.text}>Nghe phát âm</Text></TouchableOpacity>}
      </>}
      {!!(error || finishError) && <Text accessibilityRole="alert" style={styles.error}>{error || finishError}</Text>}
      {!!error && <TouchableOpacity style={styles.button} onPress={() => void quiz.retry()}><Text style={styles.text}>Thử lại</Text></TouchableOpacity>}
      {!covered && <TouchableOpacity disabled={!view.done || busy || !!error || finishing} style={[styles.next, (!view.done || busy || finishing || !!error) && styles.disabled]}
        onPress={() => view.index + 1 === view.total ? void finish() : void act('NEXT')}><Text style={styles.nextText}>{view.type === 'MATCHING_PAIRS' ? 'Tiếp theo' : 'Tiếp tục'}</Text></TouchableOpacity>}
    </ScrollView>
    {covered && <View style={styles.overlay}>
      <Text style={styles.title}>{exiting ? 'Thoát bài thi?' : 'Đã tạm dừng'}</Text>
      {exiting && <Text style={styles.text}>Giữ kết quả phần đã làm. Phần chưa làm không cộng điểm hoặc XP.</Text>}
      <TouchableOpacity disabled={busy || finishing || hidden} style={styles.button} onPress={() => exiting ? setExiting(false) : void act('RESUME')}><Text style={styles.text}>Tiếp tục</Text></TouchableOpacity>
      <TouchableOpacity disabled={busy || finishing} style={styles.button} onPress={() => exiting ? void finish(true) : setExiting(true)}><Text style={styles.error}>Thoát</Text></TouchableOpacity>
      {!!(error || finishError) && <Text style={styles.error}>{error || finishError}</Text>}
      {!!error && <TouchableOpacity style={styles.button} onPress={() => void quiz.retry()}><Text style={styles.text}>Thử lại</Text></TouchableOpacity>}
    </View>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  launcher: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  safe: { flex: 1, backgroundColor: '#fffaf5' }, content: { padding: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  smallButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#2b1b0e' }, text: { fontSize: 16, color: '#2b1b0e', lineHeight: 24 },
  clock: { fontSize: 24, fontWeight: '700', color: '#ea580c', textAlign: 'right' }, prompt: { fontSize: 22, textAlign: 'center', marginVertical: 24, color: '#2b1b0e' },
  cell: { minHeight: 64, padding: 14, borderWidth: 2, borderColor: '#e7e5e4', borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', marginBottom: 10 },
  columns: { flexDirection: 'row', gap: 12 }, column: { flex: 1 }, selected: { borderColor: '#ea580c', backgroundColor: '#fff7ed' },
  matched: { opacity: 0.4, borderColor: '#16a34a' }, correct: { backgroundColor: '#dcfce7', borderColor: '#16a34a' }, incorrect: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  feedback: { fontSize: 16, fontWeight: '600', color: '#2b1b0e' }, error: { fontSize: 16, color: '#dc2626' },
  button: { minHeight: 48, borderRadius: 14, padding: 14, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center' },
  next: { minHeight: 52, padding: 14, borderRadius: 14, backgroundColor: '#ea580c', alignItems: 'center', marginTop: 16 },
  nextText: { fontSize: 18, color: '#fff', fontWeight: '700' }, disabled: { backgroundColor: '#a8a29e' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10, backgroundColor: '#fffaf5', justifyContent: 'center', padding: 28, gap: 24 },
});
