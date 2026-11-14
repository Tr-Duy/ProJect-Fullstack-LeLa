import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface ReviewScreen {
  questionId: number; type: string; prompt: string; score: number; errors: number; timedOut: boolean;
  left: Array<{ id: string; text: string }>; right: Array<{ id: string; text: string }>;
  solution: Record<string, string>;
}
export function TimedVocabularyResult({ result }: { result: {
  preciseScore: number; preciseMaxScore: number; scorePercent: number; xpAwarded: number;
  quizTitle: string; abandonedAt?: string; timedReview?: ReviewScreen[];
} }) {
  const navigate = useNavigate();
  return <main className="max-w-3xl mx-auto p-6 text-base text-stone-900">
    <h1 className="text-3xl font-bold mb-4">Kết quả: {result.quizTitle}</h1>
    {result.abandonedAt && <p className="mb-3">Đã kết thúc sớm. Kết quả phần đã làm được giữ lại.</p>}
    <div className="rounded-2xl bg-orange-50 p-6 mb-6"><p className="text-3xl font-bold">{result.preciseScore}/{result.preciseMaxScore} điểm</p><p>{result.scorePercent}% · +{result.xpAwarded} XP</p></div>
    <div className="flex gap-3 mb-6"><Button className="!min-h-12 !text-base" onClick={() => navigate('/quizzes')}>Bài thi mới</Button><Button className="!min-h-12 !text-base" onClick={() => navigate('/my-quiz-attempts')}>Lịch sử</Button></div>
    {result.timedReview?.map((s, i) => <section key={s.questionId} className="border rounded-2xl p-5 mb-4 bg-white">
      <h2 className="font-bold mb-3">{i + 1}. {s.type === 'MATCHING_PAIRS' ? 'Ghép cặp từ - Định nghĩa' : s.prompt}</h2>
      <p>{s.score} điểm{s.type === 'MATCHING_PAIRS' ? ` · ${s.errors} lỗi` : ''}{s.timedOut ? ' · Hết giờ/chưa hoàn thành' : ''}</p>
      {s.type === 'MATCHING_PAIRS' ? s.left.map(c => <p key={c.id}>{c.text} — {s.right.find(r => r.id === s.solution[c.id])?.text}</p>) : <p>Đáp án đúng: {s.left.find(c => c.id === s.solution.answer)?.text}</p>}
    </section>)}
  </main>;
}
