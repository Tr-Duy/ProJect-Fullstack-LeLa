import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { TimedVocabularyQuiz } from '../src/features/quiz/components/TimedVocabularyQuiz';
import { ExamQuestionCard } from '../src/features/quiz/components/ExamQuestionCard';
import type { TimedQuizView } from '../src/features/quiz/components/useTimedVocabularyQuiz';
import '../src/index.css';

const params = new URLSearchParams(location.search);
const matching = params.get('mode') === 'matching';
const seconds = Number(params.get('seconds') || (matching ? 60 : 20));
const initial: TimedQuizView = {
  attemptId: 99, publicId: 'fixture-attempt', title: matching ? 'Ghép cặp từ - Định nghĩa' : 'Chọn đáp án đúng',
  index: 0, total: matching ? 5 : 20, serverNow: Date.now(), deadline: Date.now() + seconds * 1000,
  seconds, started: true, paused: false, done: false, timedOut: false, closed: false,
  type: matching ? 'MATCHING_PAIRS' : 'MULTIPLE_CHOICE_MEANING', prompt: matching ? '' : 'tận hưởng / thích',
  left: matching ? [{ id: 'l1', text: 'apple' }, { id: 'l2', text: 'book' }, { id: 'l3', text: 'cat' }, { id: 'l4', text: 'sun' }]
    : [{ id: '1', text: 'enjoy' }, { id: '2', text: 'build' }, { id: '3', text: 'write' }, { id: '4', text: 'walk' }],
  right: matching ? [{ id: 'r3', text: 'con mèo' }, { id: 'r1', text: 'quả táo' }, { id: 'r4', text: 'mặt trời' }, { id: 'r2', text: 'quyển sách' }] : [],
  matched: [], errors: 0, selected: null, solution: {}, score: 0, lastCorrect: null,
};
function Fixture() {
  const [answer, setAnswer] = useState<any>();
  if (params.has('legacy')) return <div className="max-w-3xl mx-auto p-5"><ExamQuestionCard
    questionNumber={1} totalQuestions={1} question={{ id: 1, questionText: 'Existing quiz', questionType: params.get('legacy')!,
      options: [{ id: 10, optionText: 'Existing option' }, { id: 11, optionText: 'Other option' }] }} currentAnswer={answer}
    onOptionSelect={(questionId, optionId) => setAnswer({ attemptQuestionId: questionId, selectedAttemptOptionId: optionId })}
    onTextAnswer={(questionId, text) => setAnswer({ attemptQuestionId: questionId, answerText: text })}/><output data-testid="answer">{JSON.stringify(answer)}</output></div>;
  return <div className="max-w-3xl mx-auto p-5 bg-[#fffaf5] min-h-screen"><TimedVocabularyQuiz initial={initial} onExit={() => {}} /></div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><MemoryRouter><Fixture /></MemoryRouter></StrictMode>);
