import type { AppData } from '../types';
import { generateSeedData } from './seed';

const STORAGE_KEY = 'active-recall-data';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppData;
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
  const data = JSON.parse(json) as AppData;
  if (!data.decks || !data.cards || !data.sessions) {
    throw new Error('Invalid data format');
  }
  saveData(data);
  return data;
}
