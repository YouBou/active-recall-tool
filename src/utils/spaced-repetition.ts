import type { Card, Rating } from '../types';

/**
 * SM-2 based spaced repetition algorithm with 3-level rating.
 *
 * forgot → reset to 1 day, reset repetitions
 * hard   → interval * 1.2, ease factor decreases slightly
 * good   → standard SM-2 progression
 */
export function calculateNextReview(card: Card, rating: Rating): Partial<Card> {
  const now = new Date().toISOString();
  let { interval, easeFactor, repetitions } = card;

  switch (rating) {
    case 'forgot':
      interval = 1;
      repetitions = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;

    case 'hard':
      interval = Math.max(1, Math.round(interval * 1.2));
      repetitions += 1;
      easeFactor = Math.max(1.3, easeFactor - 0.1);
      break;

    case 'good':
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      easeFactor = Math.max(1.3, easeFactor + 0.1);
      break;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: now,
    updatedAt: now,
  };
}

export function isDueForReview(card: Card): boolean {
  return new Date(card.nextReview) <= new Date();
}

export function getDueCards(cards: Card[], deckId: string): Card[] {
  return cards
    .filter((c) => c.deckId === deckId && isDueForReview(c))
    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
}

export function getMasteryLevel(card: Card): 'new' | 'learning' | 'reviewing' | 'mastered' {
  if (card.repetitions === 0) return 'new';
  if (card.interval < 7) return 'learning';
  if (card.interval < 30) return 'reviewing';
  return 'mastered';
}
