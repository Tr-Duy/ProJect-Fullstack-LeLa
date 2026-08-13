const cases = [
  { name: 'NORMAL 10/10', type: 'NORMAL', correct: 10, total: 10, maxScore: 100 },
  { name: 'FINAL BASIC 10/10', type: 'FINAL', correct: 10, total: 10, maxScore: 500 },
  { name: 'FINAL INTERMEDIATE 10/10', type: 'FINAL', correct: 10, total: 10, maxScore: 700 },
  { name: 'FINAL ADVANCED 10/10', type: 'FINAL', correct: 10, total: 10, maxScore: 850 },
  { name: 'FINAL EXCELLENT 10/10', type: 'FINAL', correct: 10, total: 10, maxScore: 990 },
  { name: 'FINAL INTERMEDIATE 8/10', type: 'FINAL', correct: 8, total: 10, maxScore: 700 },
  { name: 'FINAL INTERMEDIATE 7/10', type: 'FINAL', correct: 7, total: 10, maxScore: 700 },
  { name: 'LEVEL_UP -> INTERMEDIATE 10/10', type: 'LEVEL_UP', correct: 10, total: 10, maxScore: 700 },
  { name: 'LEVEL_UP -> INTERMEDIATE 8/10', type: 'LEVEL_UP', correct: 8, total: 10, maxScore: 700 },
  { name: 'LEVEL_UP -> INTERMEDIATE 7/10', type: 'LEVEL_UP', correct: 7, total: 10, maxScore: 700 }
];

function calc(correct, total, maxScore) {
  if (!total || total <= 0) return 0;
  const ratio = correct / total;
  const est = Math.round(ratio * maxScore);
  const clamped = Math.max(0, Math.min(est, maxScore));
  return clamped;
}

for (const c of cases) {
  const est = calc(c.correct, c.total, c.maxScore);
  const scorePercent = c.total>0 ? Math.round((c.correct / c.total) * 100) : 0;
  const passed = scorePercent >= 80;
  console.log(`${c.name}: ${c.correct}/${c.total} => ${est} / ${c.maxScore} (percent ${scorePercent}%) -> passed: ${passed}`);
}
