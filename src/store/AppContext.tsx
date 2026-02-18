import { useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppData, Card, Deck, StudySession, Rating } from '../types';
import {
  fetchAllData,
  upsertDeck, removeDeck,
  upsertCard, removeCard,
  upsertSession,
  bulkInsertSeedData,
} from '../utils/storage';
import { calculateNextReview } from '../utils/spaced-repetition';
import { generateId } from '../utils/id';
import { generateSeedData } from '../utils/seed';
import { AppContext } from './useAppContext';
import { useAuth } from './useAuth';

const EMPTY_DATA: AppData = { decks: [], cards: [], sessions: [] };

type Action =
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_DECK'; payload: Deck }
  | { type: 'UPDATE_DECK'; payload: Deck }
  | { type: 'DELETE_DECK'; payload: string }
  | { type: 'ADD_CARD'; payload: Card }
  | { type: 'UPDATE_CARD'; payload: Card }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'RATE_CARD'; payload: { cardId: string; rating: Rating; updated: Card } }
  | { type: 'ADD_SESSION'; payload: StudySession }
  | { type: 'UPDATE_SESSION'; payload: StudySession };

interface State extends AppData {
  isLoading: boolean;
  error: string | null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
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
    case 'RATE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.payload.cardId ? action.payload.updated : c)),
      };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return { ...state, sessions: state.sessions.map((s) => (s.id === action.payload.id ? action.payload : s)) };
    default:
      return state;
  }
}

const initialState: State = { ...EMPTY_DATA, isLoading: true, error: null };

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load data when user changes
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_DATA', payload: EMPTY_DATA });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    fetchAllData(user.id)
      .then((data) => {
        const isEmpty = data.decks.length === 0 && data.cards.length === 0;
        if (isEmpty) {
          const seed = generateSeedData();
          dispatch({ type: 'SET_DATA', payload: seed });
          void bulkInsertSeedData(seed, user.id);
        } else {
          dispatch({ type: 'SET_DATA', payload: data });
        }
      })
      .catch(() => {
        dispatch({ type: 'SET_ERROR', payload: 'データの読み込みに失敗しました' });
      })
      .finally(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      });
  }, [user]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // ---- Deck mutations ----

  const addDeck = useCallback((name: string, description: string, category: string): Deck => {
    const now = new Date().toISOString();
    const deck: Deck = { id: generateId(), name, description, category, createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_DECK', payload: deck });
    if (user) {
      void upsertDeck(deck, user.id).catch(() => {
        dispatch({ type: 'DELETE_DECK', payload: deck.id });
        dispatch({ type: 'SET_ERROR', payload: 'デッキの保存に失敗しました' });
      });
    }
    return deck;
  }, [user]);

  const updateDeck = useCallback((deck: Deck) => {
    const updated = { ...deck, updatedAt: new Date().toISOString() };
    const prev = state.decks.find((d) => d.id === deck.id);
    dispatch({ type: 'UPDATE_DECK', payload: updated });
    if (user) {
      void upsertDeck(updated, user.id).catch(() => {
        if (prev) dispatch({ type: 'UPDATE_DECK', payload: prev });
        dispatch({ type: 'SET_ERROR', payload: 'デッキの更新に失敗しました' });
      });
    }
  }, [user, state.decks]);

  const deleteDeck = useCallback((id: string) => {
    const prevDeck = state.decks.find((d) => d.id === id);
    const prevCards = state.cards.filter((c) => c.deckId === id);
    dispatch({ type: 'DELETE_DECK', payload: id });
    if (user) {
      void removeDeck(id).catch(() => {
        if (prevDeck) dispatch({ type: 'ADD_DECK', payload: prevDeck });
        prevCards.forEach((c) => dispatch({ type: 'ADD_CARD', payload: c }));
        dispatch({ type: 'SET_ERROR', payload: 'デッキの削除に失敗しました' });
      });
    }
  }, [user, state.decks, state.cards]);

  // ---- Card mutations ----

  const addCard = useCallback((cardData: Omit<Card, 'id' | 'interval' | 'easeFactor' | 'repetitions' | 'nextReview' | 'lastReview' | 'createdAt' | 'updatedAt'>): Card => {
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
    if (user) {
      void upsertCard(card, user.id).catch(() => {
        dispatch({ type: 'DELETE_CARD', payload: card.id });
        dispatch({ type: 'SET_ERROR', payload: 'カードの保存に失敗しました' });
      });
    }
    return card;
  }, [user]);

  const updateCard = useCallback((card: Card) => {
    const updated = { ...card, updatedAt: new Date().toISOString() };
    const prev = state.cards.find((c) => c.id === card.id);
    dispatch({ type: 'UPDATE_CARD', payload: updated });
    if (user) {
      void upsertCard(updated, user.id).catch(() => {
        if (prev) dispatch({ type: 'UPDATE_CARD', payload: prev });
        dispatch({ type: 'SET_ERROR', payload: 'カードの更新に失敗しました' });
      });
    }
  }, [user, state.cards]);

  const deleteCard = useCallback((id: string) => {
    const prev = state.cards.find((c) => c.id === id);
    dispatch({ type: 'DELETE_CARD', payload: id });
    if (user) {
      void removeCard(id).catch(() => {
        if (prev) dispatch({ type: 'ADD_CARD', payload: prev });
        dispatch({ type: 'SET_ERROR', payload: 'カードの削除に失敗しました' });
      });
    }
  }, [user, state.cards]);

  const rateCard = useCallback((cardId: string, rating: Rating) => {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const updated = { ...card, ...calculateNextReview(card, rating) };
    dispatch({ type: 'RATE_CARD', payload: { cardId, rating, updated } });
    if (user) {
      void upsertCard(updated, user.id).catch(() => {
        dispatch({ type: 'UPDATE_CARD', payload: card });
        dispatch({ type: 'SET_ERROR', payload: 'カードの評価の保存に失敗しました' });
      });
    }
  }, [user, state.cards]);

  // ---- Session mutations ----

  const startSession = useCallback((deckId: string): StudySession => {
    const session: StudySession = {
      id: generateId(),
      deckId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      cardsStudied: 0,
      ratings: { forgot: 0, hard: 0, good: 0 },
    };
    dispatch({ type: 'ADD_SESSION', payload: session });
    if (user) {
      void upsertSession(session, user.id);
    }
    return session;
  }, [user]);

  const endSession = useCallback((session: StudySession) => {
    const ended = { ...session, endedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_SESSION', payload: ended });
    if (user) {
      void upsertSession(ended, user.id);
    }
  }, [user]);

  const setData = useCallback((newData: AppData) => {
    dispatch({ type: 'SET_DATA', payload: newData });
  }, []);

  const data: AppData = { decks: state.decks, cards: state.cards, sessions: state.sessions };

  return (
    <AppContext.Provider value={{
      data,
      isLoading: state.isLoading,
      error: state.error,
      clearError,
      addDeck, updateDeck, deleteDeck,
      addCard, updateCard, deleteCard,
      rateCard,
      startSession, endSession,
      setData,
    }}>
      {children}
    </AppContext.Provider>
  );
}
