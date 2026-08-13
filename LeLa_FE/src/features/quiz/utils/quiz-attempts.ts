export function normalizeQuizId(quizId: number | string | null | undefined): number | null {
  if (quizId === null || quizId === undefined) {
    return null;
  }

  if (typeof quizId === 'string' && quizId.trim() === '') {
    return null;
  }

  const numericQuizId = Number(quizId);

  if (!Number.isInteger(numericQuizId) || numericQuizId <= 0) {
    return null;
  }

  return numericQuizId;
}
