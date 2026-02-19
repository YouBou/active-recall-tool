import { createClient } from '@supabase/supabase-js';
import type { Card, Deck, StudySession, MultipleChoiceOption } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------- DB row types (snake_case) ----------

interface DeckRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface CardRow {
  id: string;
  user_id: string;
  deck_id: string;
  type: string;
  front: string;
  back: string;
  language: string | null;
  image_url: string | null;
  options: MultipleChoiceOption[] | null;
  interval: number;
  ease_factor: number;
  repetitions: number;
  next_review: string;
  last_review: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  deck_id: string;
  started_at: string;
  ended_at: string | null;
  cards_studied: number;
  ratings_forgot: number;
  ratings_hard: number;
  ratings_good: number;
}

// ---------- Mappers ----------

export function rowToDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function deckToRow(deck: Deck, userId: string): DeckRow {
  return {
    id: deck.id,
    user_id: userId,
    name: deck.name,
    description: deck.description,
    category: deck.category,
    created_at: deck.createdAt,
    updated_at: deck.updatedAt,
  };
}

export function rowToCard(row: CardRow): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    type: row.type as Card['type'],
    front: row.front,
    back: row.back,
    language: row.language ?? undefined,
    imageUrl: row.image_url ?? undefined,
    options: row.options ?? undefined,
    interval: row.interval,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    nextReview: row.next_review,
    lastReview: row.last_review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function cardToRow(card: Card, userId: string): CardRow {
  return {
    id: card.id,
    user_id: userId,
    deck_id: card.deckId,
    type: card.type,
    front: card.front,
    back: card.back,
    language: card.language ?? null,
    image_url: card.imageUrl ?? null,
    options: card.options ?? null,
    interval: card.interval,
    ease_factor: card.easeFactor,
    repetitions: card.repetitions,
    next_review: card.nextReview,
    last_review: card.lastReview,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
  };
}

export function rowToSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    deckId: row.deck_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    cardsStudied: row.cards_studied,
    ratings: {
      forgot: row.ratings_forgot,
      hard: row.ratings_hard,
      good: row.ratings_good,
    },
  };
}

export function sessionToRow(session: StudySession, userId: string): SessionRow {
  return {
    id: session.id,
    user_id: userId,
    deck_id: session.deckId,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    cards_studied: session.cardsStudied,
    ratings_forgot: session.ratings.forgot,
    ratings_hard: session.ratings.hard,
    ratings_good: session.ratings.good,
  };
}
