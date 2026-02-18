export type CardType = 'text' | 'code' | 'image' | 'multiple-choice';

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Card {
  id: string;
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  // For code cards
  language?: string;
  // For image cards
  imageUrl?: string;
  // For multiple choice
  options?: MultipleChoiceOption[];
  // Spaced repetition fields
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  nextReview: string; // ISO date string
  lastReview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export type Rating = 'forgot' | 'hard' | 'good';

export interface StudySession {
  id: string;
  deckId: string;
  startedAt: string;
  endedAt: string | null;
  cardsStudied: number;
  ratings: { forgot: number; hard: number; good: number };
}

export interface AppData {
  decks: Deck[];
  cards: Card[];
  sessions: StudySession[];
}
