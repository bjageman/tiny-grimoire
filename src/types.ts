export interface Role {
  id: string;
  name: string;
  team: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler';
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
  assignedFromPref?: boolean;
  isDead: boolean;
  isTheDrunk?: boolean;
  isTheMarionette?: boolean;
}

export interface AssignmentResult {
  player: Player;
  role: Role;
  fromPref: boolean;
}
