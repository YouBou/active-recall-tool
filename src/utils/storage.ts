import type { AppData, Card, Deck, StudySession } from '../types';
import {
  supabase,
  rowToDeck, deckToRow,
  rowToCard, cardToRow,
  rowToSession, sessionToRow,
} from '../lib/supabase';

function isValidAppData(value: unknown): value is AppData {
  const v = value as AppData;
  return !!v && Array.isArray(v.decks) && Array.isArray(v.cards) && Array.isArray(v.sessions);
}

// ---------- Initial load ----------

export async function fetchAllData(userId: string): Promise<AppData> {
  const [decksRes, cardsRes, sessionsRes] = await Promise.all([
    supabase.from('decks').select('*').eq('user_id', userId),
    supabase.from('cards').select('*').eq('user_id', userId),
    supabase.from('study_sessions').select('*').eq('user_id', userId),
  ]);

  if (decksRes.error) throw decksRes.error;
  if (cardsRes.error) throw cardsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decks: (decksRes.data ?? []).map((r: any) => rowToDeck(r)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cards: (cardsRes.data ?? []).map((r: any) => rowToCard(r)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessions: (sessionsRes.data ?? []).map((r: any) => rowToSession(r)),
  };
}

// ---------- Individual upsert/delete ----------

export async function upsertDeck(deck: Deck, userId: string): Promise<void> {
  const { error } = await supabase.from('decks').upsert(deckToRow(deck, userId));
  if (error) throw error;
}

export async function removeDeck(deckId: string): Promise<void> {
  const { error } = await supabase.from('decks').delete().eq('id', deckId);
  if (error) throw error;
}

export async function upsertCard(card: Card, userId: string): Promise<void> {
  const { error } = await supabase.from('cards').upsert(cardToRow(card, userId));
  if (error) throw error;
}

export async function removeCard(cardId: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', cardId);
  if (error) throw error;
}

export async function upsertSession(session: StudySession, userId: string): Promise<void> {
  const { error } = await supabase.from('study_sessions').upsert(sessionToRow(session, userId));
  if (error) throw error;
}

// ---------- Bulk seed insert ----------

export async function bulkInsertSeedData(data: AppData, userId: string): Promise<void> {
  const deckRows = data.decks.map((d) => deckToRow(d, userId));
  const cardRows = data.cards.map((c) => cardToRow(c, userId));

  if (deckRows.length > 0) {
    const { error } = await supabase.from('decks').upsert(deckRows);
    if (error) throw error;
  }
  if (cardRows.length > 0) {
    const { error } = await supabase.from('cards').upsert(cardRows);
    if (error) throw error;
  }
}

// ---------- Export / Import ----------

export function exportData(data: AppData): string {
  return JSON.stringify(data);
}

export function importData(json: string): AppData {
  const data = JSON.parse(json);
  if (!isValidAppData(data)) {
    throw new Error('Invalid data format');
  }
  return data;
}
