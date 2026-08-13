import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { flashcardsApi } from '../../study-content/api/flashcards.api';
import { cardProgressApi } from '../api/card-progress.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
import { srsReviewsApi } from '../api/srs-reviews.api';

export function useStudySession(deckId: string | undefined) {
  const [studyQueue, setStudyQueue] = useState<any[]>([]);
  const [isQueueInitialized, setIsQueueInitialized] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, newGainedXp: 0 });

  const MAX_NEW = 20;
  const MAX_REVIEW = 100;

  const { data: onlineData, isLoading: isLoadingCards } = useQuery({
    queryKey: ['study-cards', deckId],
    queryFn: () => flashcardsApi.getByDeckId(Number(deckId), { size: 10000 }),
    enabled: !!deckId,
    retry: 1,
  });

  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['study-progress', deckId],
    queryFn: () => cardProgressApi.getAllProgress(Number(deckId), { size: 10000 }),
    enabled: !!deckId,
  });

  useEffect(() => {
    if (onlineData && progressData && !isQueueInitialized) {
      const allCards = onlineData.content || [];
      const allProgress = progressData.content || [];
      
      const now = new Date();
      let dueReviewIds: number[] = [];
      let newIds: number[] = [];

      allCards.forEach(card => {
        const prog = allProgress.find((p: any) => p.cardId === card.id);
        if (!prog || prog.state === 'NEW') {
          newIds.push(card.id);
        } else if (prog.state !== 'SUSPENDED') {
          if (!prog.dueAt || new Date(prog.dueAt) <= now) {
            dueReviewIds.push(card.id);
          }
        }
      });

      // Enforce Limits
      newIds = newIds.slice(0, MAX_NEW);
      dueReviewIds = dueReviewIds.slice(0, MAX_REVIEW);
      const targetIds = new Set([...dueReviewIds, ...newIds]);

      let queue = allCards.filter(c => targetIds.has(c.id));
      setStudyQueue(queue);
      setIsQueueInitialized(true);
      
      // Auto enroll in the deck if not already enrolled
      if (deckId) {
        deckEnrollmentsApi.enroll(Number(deckId)).catch(console.error);
      }
    }
  }, [onlineData, progressData, isQueueInitialized, deckId]);

  const currentCard = studyQueue[0];
  const isFinished = isQueueInitialized && studyQueue.length === 0;

  const handleReview = async (rating: number) => {
    if (!currentCard) return;

    try {
      await srsReviewsApi.reviewCard({
        cardId: currentCard.id,
        rating: rating
      });

      // Handle XP calculation identically as Backend
      let xpEarned = 2;
      if (rating === 2) xpEarned = 5;
      else if (rating === 3) xpEarned = 10;
      else if (rating === 4) xpEarned = 15;

      setSessionStats(prev => ({ 
        reviewed: prev.reviewed + 1,
        newGainedXp: prev.newGainedXp + xpEarned
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
      console.error("Failed to submit review", err);
      // Even if failed, pop card so user isn't stuck
      setStudyQueue(prev => prev.slice(1));
    }
  };

  return {
    currentCard,
    isFinished,
    isLoading: isLoadingCards || isLoadingProgress,
    sessionStats,
    studyQueue,
    handleReview
  };
}
