import { describe, expect, it } from 'vitest';
import type { LoreRole, Player, Role } from '../types';
import { buildPlayerTrackerTransfer, buildStandardTransfer } from './gameTransfer';

const customRoles: Role[] = [
  { id: 'homebrew', name: 'Homebrew', team: 'townsfolk', ability: 'Knows something.' },
];

const players: Player[] = [
  {
    id: 'alice-id',
    name: 'Alice',
    pronouns: 'she/her',
    isDead: true,
    hasDeadVote: true,
    roleId: 'imp',
    roleIds: ['imp'],
    isEvil: true,
    isDrunkOrPoisoned: true,
    notes: 'Private note',
  },
  { id: 'bob-id', name: 'Bob', isDead: false, roleId: 'washerwoman' },
];

const source = {
  players,
  scriptName: 'A Custom Script',
  scriptAuthor: 'Script Author',
  customScriptRoles: customRoles,
  scriptLoreRoles: [{ id: 'bootlegger', name: 'Bootlegger', team: 'loric', ability: 'A custom rule.' }] as LoreRole[],
};

describe('game transfers', () => {
  it('builds a fresh Game Notes grimoire with only player identity and script data', () => {
    const transfer = buildPlayerTrackerTransfer(source);

    expect(transfer.players).toEqual([
      { id: 'alice-id', name: 'Alice', pronouns: 'she/her', isDead: false },
      { id: 'bob-id', name: 'Bob', isDead: false },
    ]);
    expect(transfer).toMatchObject({
      phase: 'game',
      timeOfDay: 'night',
      dayNumber: 1,
      scriptName: 'A Custom Script',
      scriptAuthor: 'Script Author',
      customScriptRoles: customRoles,
      scriptLoreRoles: source.scriptLoreRoles,
      gameNotes: '',
      reminderTokens: [],
    });
  });

  it('builds a fresh Standard setup with only player identity and script data', () => {
    const transfer = buildStandardTransfer(source);

    expect(transfer.players).toEqual([
      { id: 'alice-id', name: 'Alice', pronouns: 'she/her', isDead: false },
      { id: 'bob-id', name: 'Bob', isDead: false },
    ]);
    expect(transfer).toMatchObject({
      phase: 'setup',
      timeOfDay: 'night',
      dayNumber: 1,
      scriptName: 'A Custom Script',
      scriptAuthor: 'Script Author',
      customScriptRoles: customRoles,
      scriptLoreRoles: source.scriptLoreRoles,
      selectedCharacterIds: ['homebrew'],
      gameLog: [],
      reminderTokens: [],
      checkedItems: {},
    });
  });
});
