import type { Dispatch, SetStateAction } from 'react';
import type { Player, Role } from '../types';

interface UsePlayerRosterArgs<P extends Player> {
  players: P[];
  setPlayers: Dispatch<SetStateAction<P[]>>;
  // Resolves a role id against the mode's role list (custom-script-aware where the mode supports it).
  findRole: (roleId?: string) => Role | undefined;
  phase: string;
  onLog: (message: string) => void;
  // Called when a player is turned into the Lil' Monsta, so the mode can flag the game.
  onLilMonstaEnabled: () => void;
  // Whale Bucket marks a role as chosen-from-preference; other modes leave this unset.
  resolveAssignedFromPref?: (player: P, roleId: string) => boolean;
}

const alignmentOf = (player: Player, role: Role | undefined): boolean => {
  if (player.isEvil !== undefined) return player.isEvil;
  if (player.isTheLunatic) return false;
  if (player.isTheMarionette) return true;
  return role ? role.team === 'minion' || role.team === 'demon' : false;
};

// The storyteller's player-state mutations, shared by StandardSetup and WhaleBucket.
// PlayerTracker keeps its own guess-oriented handlers and does not use this.
export function usePlayerRoster<P extends Player>({ players, setPlayers, findRole, phase, onLog, onLilMonstaEnabled, resolveAssignedFromPref }: UsePlayerRosterArgs<P>) {
  const updatePlayerName = (id: string, name: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const updatePlayerNotes = (id: string, notes: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
  };

  const updatePlayerPronouns = (id: string, pronouns: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, pronouns } : p));
  };

  const updatePlayerRoles = (id: string, roleIds: string[]) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, roleIds } : p));
  };

  const updatePlayerRole = (id: string, roleId: string) => {
    const player = players.find(p => p.id === id);
    const currentAlignment = player ? alignmentOf(player, findRole(player.roleId)) : undefined;

    if (phase === 'game' && player && player.roleId !== (roleId || undefined)) {
      const oldRole = findRole(player.roleId);
      const newRole = findRole(roleId);
      if (oldRole && newRole) onLog(`${player.name} changed from ${oldRole.name} to ${newRole.name}`);
      else if (newRole) onLog(`${player.name} assigned ${newRole.name}`);
    }

    let newPlayers = players.map(p => {
      if (p.id !== id) return p;
      const assigned: P = {
        ...p,
        roleId: roleId || undefined,
        isEvil: phase === 'game' ? currentAlignment : undefined,
        isTheDrunk: false,
        isTheMarionette: false,
        isTheLunatic: false,
        isTheLilMonsta: false,
      };
      if (resolveAssignedFromPref) assigned.assignedFromPref = resolveAssignedFromPref(p, roleId);
      return assigned;
    });

    // A Choirboy needs a King, and a Huntsman needs a Damsel — seed one if the script doesn't already have it.
    const pairing: Record<string, string> = { choirboy: 'king', huntsman: 'damsel' };
    const partner = pairing[roleId];
    if (partner && !newPlayers.some(p => p.roleId === partner)) {
      const candidate = newPlayers.find(p => p.id !== id && !p.roleId)
        || newPlayers.find(p => p.id !== id && p.roleId !== roleId);
      if (candidate) {
        newPlayers = newPlayers.map(p => p.id === candidate.id
          ? { ...p, roleId: partner, ...(resolveAssignedFromPref ? { assignedFromPref: false } : {}) }
          : p);
      }
    }

    setPlayers(newPlayers);
  };

  const togglePlayerDead = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) onLog(!player.isDead ? `${player.name} died` : `${player.name} returned to life`);
    setPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextDead = !p.isDead;
      return { ...p, isDead: nextDead, hasDeadVote: nextDead ? true : undefined };
    }));
  };

  const togglePlayerDeadVote = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) onLog(player.hasDeadVote ? `${player.name}'s ghost vote used` : `${player.name}'s ghost vote restored`);
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, hasDeadVote: !p.hasDeadVote } : p));
  };

  const togglePlayerEvil = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) {
      const currentEvil = alignmentOf({ ...player, isTheLunatic: false, isTheMarionette: false }, findRole(player.roleId));
      onLog(`${player.name} marked as ${!currentEvil ? 'Evil' : 'Good'}`);
    }
    setPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const role = findRole(p.roleId);
      const defaultEvil = role ? role.team === 'minion' || role.team === 'demon' : false;
      const currentEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;
      return { ...p, isEvil: !currentEvil };
    }));
  };

  const togglePlayerDrunkOrPoisoned = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) onLog(`${player.name} ${!player.isDrunkOrPoisoned ? 'marked as Drunk/Poisoned' : 'cleared of Drunk/Poisoned'}`);
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, isDrunkOrPoisoned: !p.isDrunkOrPoisoned } : p));
  };

  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextVal = !p.isTheDrunk;
      return { ...p, isTheDrunk: nextVal, isTheMarionette: nextVal ? false : p.isTheMarionette, isTheLilMonsta: nextVal ? false : p.isTheLilMonsta };
    }));
  };

  const togglePlayerTheMarionette = (id: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextVal = !p.isTheMarionette;
      return { ...p, isTheMarionette: nextVal, isTheDrunk: nextVal ? false : p.isTheDrunk, isTheLilMonsta: nextVal ? false : p.isTheLilMonsta, isEvil: nextVal ? true : undefined };
    }));
  };

  const togglePlayerTheLunatic = (id: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextVal = !p.isTheLunatic;
      return { ...p, isTheLunatic: nextVal, isTheDrunk: nextVal ? false : p.isTheDrunk, isTheMarionette: nextVal ? false : p.isTheMarionette, isTheLilMonsta: nextVal ? false : p.isTheLilMonsta, isEvil: nextVal ? false : undefined };
    }));
  };

  const togglePlayerTheLilMonsta = (id: string) => {
    const isTurningOn = !players.find(p => p.id === id)?.isTheLilMonsta;
    if (isTurningOn) onLilMonstaEnabled();
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheLilMonsta;
        return { ...p, isTheLilMonsta: nextVal, isTheDrunk: nextVal ? false : p.isTheDrunk, isTheMarionette: nextVal ? false : p.isTheMarionette, isTheLunatic: nextVal ? false : p.isTheLunatic };
      }
      return isTurningOn ? { ...p, isTheLilMonsta: false } : p;
    }));
  };

  return {
    updatePlayerName, updatePlayerNotes, updatePlayerPronouns, updatePlayerRoles, updatePlayerRole,
    togglePlayerDead, togglePlayerDeadVote, togglePlayerEvil, togglePlayerDrunkOrPoisoned,
    togglePlayerTheDrunk, togglePlayerTheMarionette, togglePlayerTheLunatic, togglePlayerTheLilMonsta,
  };
}
