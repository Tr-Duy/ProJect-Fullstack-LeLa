import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { flashcardsApi } from '../../study-content/api/flashcards.api';
import { cardProgressApi } from '../api/card-progress.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
import { srsReviewsApi } from '../api/srs-reviews.api';
import { studyApi } from '../api/study.api';

export function useStudySession(deckId: string | undefined, mode?: string | null) {
  const [studyQueue, setStudyQueue] = useState<any[]>([]);
  const [isQueueInitialized, setIsQueueInitialized] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, newGainedXp: 0 });

  const isCramMode = mode === 'cram';
  const effectiveMode = isCramMode ? 'cram' : 'srs';

  const { data: cards, isLoading, refetch } = useQuery({
    queryKey: ['study-cards', deckId, effectiveMode],
    queryFn: async () => {
      try {
        const res = await studyApi.getStudyCards(Number(deckId), effectiveMode);
        return res?.data || [];
      } catch (err) {
        console.warn('Failed to load study cards from /study endpoint, attempting fallback:', err);
        const fallbackRes = await flashcardsApi.getByDeckId(Number(deckId), { size: 10000 });
        const allCards = fallbackRes?.content || [];

        if (isCramMode) {
          // Shuffle all cards for cram mode
          return [...allCards].sort(() => Math.random() - 0.5);
        }

        // SRS fallback using progress
        try {
          const progressRes = await cardProgressApi.getAllProgress(Number(deckId), { size: 10000 });
          const allProgress = progressRes?.content || [];
          const now = new Date();
          let dueReviewIds: number[] = [];
          let newIds: number[] = [];

          allCards.forEach((card: any) => {
            const prog = allProgress.find((p: any) => p.cardId === card.id);
            if (!prog || prog.state === 'NEW') {
              newIds.push(card.id);
            } else if (prog.state !== 'SUSPENDED') {
              if (!prog.dueAt || new Date(prog.dueAt) <= now) {
                dueReviewIds.push(card.id);
              }
            }
          });

          newIds = newIds.slice(0, 20);
          dueReviewIds = dueReviewIds.slice(0, 100);
          const targetIds = new Set([...dueReviewIds, ...newIds]);
          return allCards.filter((c: any) => targetIds.has(c.id));
        } catch {
          return allCards;
        }
      }
    },
    enabled: !!deckId,
    retry: 1,
  });

  // Reset when deckId or mode changes
  useEffect(() => {
    setIsQueueInitialized(false);
    setStudyQueue([]);
    setSessionStats({ reviewed: 0, newGainedXp: 0 });
  }, [deckId, effectiveMode]);

  // Initialize queue once cards query completes
  useEffect(() => {
    if (cards !== undefined && !isQueueInitialized) {
      setStudyQueue(cards);
      setIsQueueInitialized(true);

      // Auto enroll in the deck if not already enrolled
      if (deckId) {
        deckEnrollmentsApi.enroll(Number(deckId)).catch(console.error);
      }
    }
  }, [cards, isQueueInitialized, deckId]);

  const currentCard = studyQueue[0];
  const isFinished = isQueueInitialized && studyQueue.length === 0;

  const handleReview = async (rating: number) => {
    if (!currentCard) return;

    try {
      await srsReviewsApi.reviewCard({
        cardId: currentCard.id,
        rating: rating,
        cramMode: isCramMode,
      });

      // Handle XP calculation identically as Backend
      let xpEarned = 2;
      if (rating === 2) xpEarned = 5;
      else if (rating === 3) xpEarned = 10;
      else if (rating === 4) xpEarned = 15;

      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        newGainedXp: prev.newGainedXp + xpEarned,
      }));

      // Pop card from queue
      if (rating === 1) {
        // Again -> Put it at the end of the queue
        setStudyQueue(prev => {
          const newQ = [...prev];
          const card = newQ.shift();
          if (card) newQ.push(card);
          return newQ;
        });
      } else {
        setStudyQueue(prev => prev.slice(1));
      }
    } catch (err) {
      console.error('Failed to submit review', err);
      // Even if failed, pop card so user isn't stuck
      setStudyQueue(prev => prev.slice(1));
    }
  };

  const restartSession = () => {
    setIsQueueInitialized(false);
    setStudyQueue([]);
    setSessionStats({ reviewed: 0, newGainedXp: 0 });
    refetch();
  };

  return {
    currentCard,
    isFinished,
    isLoading: isLoading || !isQueueInitialized,
    sessionStats,
    studyQueue,
    isCramMode,
    handleReview,
    restartSession,
  };
}
