'use client';

// ============================================================
// Digital Nursing Care EMR - Local Storage Store
// DEMO APPLICATION - Browser storage only. Not secure clinical storage.
// ============================================================

import type { EMRStore } from './types';
import { SEED_DATA } from './seedData';

const STORAGE_KEY = 'nursing_emr_demo_data';

export function getStore(): EMRStore {
  if (typeof window === 'undefined') return SEED_DATA;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  try {
    return JSON.parse(raw) as EMRStore;
  } catch {
    return SEED_DATA;
  }
}

export function saveStore(store: EMRStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetStore(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function nowDateStr(): string {
  const d = new Date();
  return d.toISOString().substring(0, 10);
}

export function nowTimeStr(): string {
  const d = new Date();
  return d.toTimeString().substring(0, 5);
}
