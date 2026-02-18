import { createContext, useContext } from 'react';
import type { AppData, Card, Deck, StudySession, Rating } from '../types';

export interface AppContextType {
  data: AppData;
  addDeck: (name: string, description: string, category: string) => Deck;
  updateDeck: (deck: Deck) => void;
  deleteDeck: (id: string) => void;
  addCard: (card: Omit<Card, 'id' | 'interval' | 'easeFactor' | 'repetitions' | 'nextReview' | 'lastReview' | 'createdAt' | 'updatedAt'>) => Card;
  updateCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  rateCard: (cardId: string, rating: Rating) => void;
  startSession: (deckId: string) => StudySession;
  endSession: (session: StudySession) => void;
  setData: (data: AppData) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
