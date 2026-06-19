export const DISTRIBUTION: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
  5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
  14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
  15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 },
};

export interface RoleDistribution {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
  traveler: number;
}

export function getDistribution(count: number): RoleDistribution {
  if (count < 5) {
    return { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };
  }
  if (count > 15) {
    const base = DISTRIBUTION[15];
    return {
      ...base,
      traveler: count - 15,
    };
  }
  const base = DISTRIBUTION[count] || { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
  return {
    ...base,
    traveler: 0,
  };
}
