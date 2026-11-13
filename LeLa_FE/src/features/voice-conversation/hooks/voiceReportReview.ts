import type { VoiceReportResponse, VoiceTurnResponse } from '../api/voice-conversation.api';

/** Merge this room's text-based tips with saved corrections; leave scores/XP intact. */
export function mergeSessionReview(report: VoiceReportResponse, reviews: VoiceTurnResponse[]): VoiceReportResponse {
  const corrections = new Map(report.corrections.map(c => [c.turnNumber, c]));
  for (const turn of reviews) {
    const evaluation = turn.evaluation || turn.userEvaluation;
    const saved = corrections.get(turn.turnNumber);
    const assessed = Boolean(evaluation?.grammarCheck?.trim()) && !turn.degraded;
    corrections.set(turn.turnNumber, {
      turnNumber: turn.turnNumber,
      originalTranscript: turn.intendedUtterance || saved?.originalTranscript || turn.rawTranscript || '',
      correctedText: assessed ? evaluation?.suggestedImprovement || saved?.correctedText || '' : '',
      errors: !assessed ? [] : saved?.errors?.length ? saved.errors : turn.grammarErrors?.length ? turn.grammarErrors
        : evaluation?.hasError ? [evaluation.grammarCheck] : [],
      phoneticTip: evaluation?.phoneticTip,
      assessmentAvailable: assessed,
    });
  }
  return { ...report, corrections: [...corrections.values()] };
}
