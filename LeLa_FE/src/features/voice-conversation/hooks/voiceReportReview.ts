import type { VoiceReportResponse, VoiceTurnResponse } from '../api/voice-conversation.api';

/** Merge this room's text-based tips with saved corrections; leave scores/XP intact. */
export function mergeSessionReview(report: VoiceReportResponse, reviews: VoiceTurnResponse[]): VoiceReportResponse {
  const corrections = new Map(report.corrections.map(c => [c.turnNumber, c]));
  for (const turn of reviews) {
    const evaluation = turn.evaluation || turn.userEvaluation;
    const saved = corrections.get(turn.turnNumber);
    corrections.set(turn.turnNumber, {
      turnNumber: turn.turnNumber,
      originalTranscript: turn.intendedUtterance || saved?.originalTranscript || turn.rawTranscript || '',
      correctedText: evaluation?.suggestedImprovement || saved?.correctedText || '',
      errors: saved?.errors?.length ? saved.errors : turn.grammarErrors?.length ? turn.grammarErrors
        : evaluation?.hasError ? [evaluation.grammarCheck] : [],
      phoneticTip: evaluation?.phoneticTip,
      assessmentAvailable: Boolean(evaluation) && !turn.degraded,
    });
  }
  return { ...report, corrections: [...corrections.values()] };
}
