const STORAGE_KEY = 'botc-custom-pronouns';

/** Custom pronouns typed into a pronoun picker, saved per-device for quick reuse. */
export function readCustomPronouns(): string[] {
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

export function saveCustomPronouns(pronouns: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pronouns));
}
