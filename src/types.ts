export interface Role {
  id: string;
  name: string;
  team: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler';
  /** Only set for custom/homebrew roles carrying their own ability text from the uploaded script. */
  ability?: string;
  /** Only set for custom/homebrew roles: [good-token image URL, evil-token image URL] from the uploaded script. */
  image?: string[];
}

export interface PlayerPreferences {
  townsfolk: string[];
  outsider: string[];
  minion: string[];
  demon: string[];
  traveler: string[];
}

export interface Player {
  id: string;
  name: string;
  preferences?: PlayerPreferences;
  roleId?: string;
  roleIds?: string[];
  assignedFromPref?: boolean;
  isDead: boolean;
  pronouns?: string;
  isEvil?: boolean;
  isTheDrunk?: boolean;
  isTheMarionette?: boolean;
  isTheLunatic?: boolean;
  isTheLilMonsta?: boolean;
  isDrunkOrPoisoned?: boolean;
  hasDeadVote?: boolean;
  notes?: string;
}

export interface PlacedReminder {
  id: string;
  sourceCharId: string;
  text: string;
  targetPlayerId: string;
}

export interface AssignmentResult {
  player: Player;
  role: Role;
  fromPref: boolean;
}

export const TEAM_ORDER: Record<string, number> = {
  townsfolk: 1,
  outsider: 2,
  minion: 3,
  demon: 4,
  traveler: 5,
};
