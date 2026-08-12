import rolesData from '../roles.json';
import type { AnyRole, Role } from '../types';

const LORE_TEAMS = new Set(['fabled', 'loric']);

/** Every character in the data, including Fabled and Lorics. */
export const ALL_ROLES = rolesData as AnyRole[];

/** Characters that can be dealt to a player — everything except Fabled and Lorics. */
export const PLAYABLE_ROLES: Role[] = ALL_ROLES.filter((r): r is Role => !LORE_TEAMS.has(r.team));

/** Ability text by character id, for looking up official wording a script file omits. */
export const ABILITY_BY_ID = new Map(ALL_ROLES.map(r => [r.id, r.ability]));
