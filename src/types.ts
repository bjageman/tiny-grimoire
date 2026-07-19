export interface Role {
  id: string;
  name: string;
  team: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler';
  /** Only set for custom/homebrew roles carrying their own ability text from the uploaded script. */
  ability?: string;
  /** Only set for custom/homebrew roles: [good-token image URL, evil-token image URL] from the uploaded script. */
  image?: string[];
  /** Custom/homebrew reminder tokens carried from the uploaded script. */
  reminders?: string[];
  /** Custom/homebrew reminder tokens that are always available, regardless of who is in play. */
  remindersGlobal?: string[];
  /** Custom/homebrew first-night order number from the uploaded script (Bloodstar scale). 0/absent = does not act. */
  firstNight?: number;
  /** Storyteller text read for this character on the first night (custom/homebrew scripts). */
  firstNightReminder?: string;
  /** Custom/homebrew other-night order number from the uploaded script. 0/absent = does not act. */
  otherNight?: number;
  /** Storyteller text read for this character on other nights (custom/homebrew scripts). */
  otherNightReminder?: string;
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
