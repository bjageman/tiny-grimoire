const STORAGE_KEY = 'botc-custom-note-prompts';

/** Extra note prompts the storyteller added, saved per-device. */
export function readCustomNotePrompts(): string[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function saveCustomNotePrompts(prompts: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}
