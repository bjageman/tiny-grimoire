import type { LoreRole, Player, Role } from '../types';

export const STANDARD_GAME_STORAGE_KEY = 'standard-botc-game';
export const PLAYER_TRACKER_STORAGE_KEY = 'player-tracker-botc-game';

interface TransferSource {
  players: Player[];
  scriptName: string;
  scriptAuthor: string;
  customScriptRoles: Role[] | null;
  scriptLoricRoles?: LoreRole[];
}

function transferPlayers(players: Player[]): Player[] {
  return players.map(({ id, name, pronouns }) => ({
    id,
    name,
    ...(pronouns ? { pronouns } : {}),
    isDead: false,
  }));
}

export function buildPlayerTrackerTransfer(source: TransferSource) {
  return {
    players: transferPlayers(source.players),
    phase: 'game' as const,
    timeOfDay: 'night' as const,
    dayNumber: 1,
    customScriptRoles: source.customScriptRoles,
    scriptLoricRoles: source.scriptLoricRoles ?? [],
    scriptName: source.scriptName,
    scriptAuthor: source.scriptAuthor,
    gameNotes: '',
    enableReminders: false,
    reminderTokens: [],
    alwaysShowNotes: false,
  };
}

export function buildStandardTransfer(source: TransferSource) {
  return {
    players: transferPlayers(source.players),
    phase: 'setup' as const,
    timeOfDay: 'night' as const,
    dayNumber: 1,
    customScriptRoles: source.customScriptRoles,
    scriptLoricRoles: source.scriptLoricRoles ?? [],
    scriptName: source.scriptName,
    scriptAuthor: source.scriptAuthor,
    isLilMonstaGame: false,
    demonBluffs: [],
    gameLog: [],
    gameNotes: '',
    reminderTokens: [],
    checkedItems: {},
    selectedCharacterIds: source.customScriptRoles?.map(role => role.id) ?? null,
    villageIdiotCount: 1,
    rotationOffset: 0,
    alwaysShowNotes: false,
    fullNightOrder: false,
    allReminders: false,
  };
}
