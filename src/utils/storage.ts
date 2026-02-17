import type { AppData } from '../types';
import { generateSeedData } from './seed';

const STORAGE_KEY = 'active-recall-data';

function isValidAppData(value: unknown): value is AppData {
  const v = value as AppData;
  return !!v && Array.isArray(v.decks) && Array.isArray(v.cards) && Array.isArray(v.sessions);
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidAppData(parsed)) return parsed;
    }
  } catch {
    // corrupted data, reset
  }
  const seed = generateSeedData();
  saveData(seed);
  return seed;
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportData(): string {
  return localStorage.getItem(STORAGE_KEY) || JSON.stringify(generateSeedData());
}

export function importData(json: string): AppData {
  const data = JSON.parse(json);
  if (!isValidAppData(data)) {
    throw new Error('Invalid data format');
  }
  saveData(data);
  return data;
}
