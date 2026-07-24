import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/** Read a field from a JSON blob in localStorage; returns fallback when missing/corrupt/null (falsy values kept). */
export function readPersistedField<T>(storageKey: string, field: string, fallback: T): T {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const value = (JSON.parse(saved) as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) return value as T;
    } catch (e) {
      console.error(e);
    }
  }
  return fallback;
}

/** useState seeded from a field of a JSON blob in localStorage; persisting back is the caller's job. */
export function usePersistedField<T>(
  storageKey: string,
  field: string,
  fallback: T
): [T, Dispatch<SetStateAction<T>>] {
  return useState<T>(() => readPersistedField(storageKey, field, fallback));
}
