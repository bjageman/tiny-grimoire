import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readPersistedField } from './usePersistedField';

const KEY = 'test-game';

describe('readPersistedField', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the fallback when the key is missing', () => {
    expect(readPersistedField(KEY, 'phase', 'setup')).toBe('setup');
  });

  it('returns the stored value when present', () => {
    localStorage.setItem(KEY, JSON.stringify({ phase: 'game', dayNumber: 3 }));
    expect(readPersistedField(KEY, 'phase', 'setup')).toBe('game');
    expect(readPersistedField(KEY, 'dayNumber', 1)).toBe(3);
  });

  it('returns the fallback for a field that is absent from the blob', () => {
    localStorage.setItem(KEY, JSON.stringify({ phase: 'game' }));
    expect(readPersistedField(KEY, 'dayNumber', 1)).toBe(1);
  });

  it('honors falsy stored values instead of the fallback', () => {
    localStorage.setItem(KEY, JSON.stringify({ allowTravelers: false, rotationOffset: 0 }));
    expect(readPersistedField(KEY, 'allowTravelers', true)).toBe(false);
    expect(readPersistedField(KEY, 'rotationOffset', 5)).toBe(0);
  });

  it('returns the fallback for stored null', () => {
    localStorage.setItem(KEY, JSON.stringify({ customScriptRoles: null }));
    expect(readPersistedField<string[] | null>(KEY, 'customScriptRoles', null)).toBeNull();
    expect(readPersistedField(KEY, 'customScriptRoles', 'fallback')).toBe('fallback');
  });

  it('returns the fallback when the stored JSON is corrupt', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(KEY, '{not valid json');
    expect(readPersistedField(KEY, 'phase', 'setup')).toBe('setup');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
