import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { AppData, Card, Deck, StudySession, Rating } from '../types';
import { loadData, saveData } from '../utils/storage';
import { calculateNextReview } from '../utils/spaced-repetition';
import { generateId } from '../utils/id';

type Action =
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'ADD_DECK'; payload: Deck }
  | { type: 'UPDATE_DECK'; payload: Deck }
  | { type: 'DELETE_DECK'; payload: string }
  | { type: 'ADD_CARD'; payload: Card }
  | { type: 'UPDATE_CARD'; payload: Card }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'RATE_CARD'; payload: { cardId: string; rating: Rating } }
  | { type: 'ADD_SESSION'; payload: StudySession }
  | { type: 'UPDATE_SESSION'; payload: StudySession };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'SET_DATA':
      return action.payload;
    case 'ADD_DECK':
      return { ...state, decks: [...state.decks, action.payload] };
    case 'UPDATE_DECK':
      return { ...state, decks: state.decks.map((d) => (d.id === action.payload.id ? action.payload : d)) };
    case 'DELETE_DECK':
      return {
        ...state,
        decks: state.decks.filter((d) => d.id !== action.payload),
        cards: state.cards.filter((c) => c.deckId !== action.payload),
      };
    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.payload] };
    case 'UPDATE_CARD':
      return { ...state, cards: state.cards.map((c) => (c.id === action.payload.id ? action.payload : c)) };
    case 'DELETE_CARD':
      return { ...state, cards: state.cards.filter((c) => c.id !== action.payload) };
    case 'RATE_CARD': {
      const { cardId, rating } = action.payload;
      return {
        ...state,
        cards: state.cards.map((c) => {
          if (c.id !== cardId) return c;
          return { ...c, ...calculateNextReview(c, rating) };
        }),
      };
    }
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return { ...state, sessions: state.sessions.map((s) => (s.id === action.payload.id ? action.payload : s)) };
    default:
      return state;
  }
}

interface AppContextType {
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

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, null, loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addDeck = useCallback((name: string, description: string, category: string) => {
    const now = new Date().toISOString();
    const deck: Deck = { id: generateId(), name, description, category, createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_DECK', payload: deck });
    return deck;
  }, []);

  const updateDeck = useCallback((deck: Deck) => {
    dispatch({ type: 'UPDATE_DECK', payload: { ...deck, updatedAt: new Date().toISOString() } });
  }, []);

  const deleteDeck = useCallback((id: string) => {
    dispatch({ type: 'DELETE_DECK', payload: id });
  }, []);

  const addCard = useCallback((cardData: Omit<Card, 'id' | 'interval' | 'easeFactor' | 'repetitions' | 'nextReview' | 'lastReview' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const card: Card = {
      ...cardData,
      id: generateId(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReview: now,
      lastReview: null,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_CARD', payload: card });
    return card;
  }, []);

  const updateCard = useCallback((card: Card) => {
    dispatch({ type: 'UPDATE_CARD', payload: { ...card, updatedAt: new Date().toISOString() } });
  }, []);

  const deleteCard = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CARD', payload: id });
  }, []);

  const rateCard = useCallback((cardId: string, rating: Rating) => {
    dispatch({ type: 'RATE_CARD', payload: { cardId, rating } });
  }, []);

  const startSession = useCallback((deckId: string) => {
    const session: StudySession = {
      id: generateId(),
      deckId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      cardsStudied: 0,
      ratings: { forgot: 0, hard: 0, good: 0 },
    };
    dispatch({ type: 'ADD_SESSION', payload: session });
    return session;
  }, []);

  const endSession = useCallback((session: StudySession) => {
    dispatch({ type: 'UPDATE_SESSION', payload: { ...session, endedAt: new Date().toISOString() } });
  }, []);

  const setData = useCallback((newData: AppData) => {
    dispatch({ type: 'SET_DATA', payload: newData });
  }, []);

  return (
    <AppContext.Provider value={{ data, addDeck, updateDeck, deleteDeck, addCard, updateCard, deleteCard, rateCard, startSession, endSession, setData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
