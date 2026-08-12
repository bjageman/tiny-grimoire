import { cn } from '../../../utils/cn';
import { PLAYABLE_ROLES as rolesData } from '../../../utils/roleData';
import type { Role } from '../../../types';

interface AddTravelerCardProps {
  isLightModeActive: boolean;
  title: string;
  name: string;
  onNameChange: (value: string) => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  disabled: boolean;
  onAdd: () => void;
}

// Traveler name + role picker shown to the storyteller during a game.
export default function AddTravelerCard({ isLightModeActive, title, name, onNameChange, roleId, onRoleIdChange, disabled, onAdd }: AddTravelerCardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-3.5 space-y-3 transition-colors duration-300',
      isLightModeActive
        ? 'bg-white/50 border-gray-300 text-clocktower-night'
        : 'bg-gray-900/40 border-gray-800/80'
    )}>
      <h4 className={cn(
        'text-xs uppercase font-bold tracking-wider',
        isLightModeActive ? 'text-gray-600' : 'text-gray-500'
      )}>{title}</h4>
      <div className="flex flex-col gap-2">
        <input
          id="game-traveler-name-input"
          type="text"
          placeholder="Traveler name..."
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoCapitalize="words"
          className={cn(
            'w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border transition-colors',
            isLightModeActive
              ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
              : 'bg-gray-955 border-gray-800 text-gray-200 focus:border-clocktower-blood'
          )}
        />
        <div className="flex gap-2">
          <select
            id="game-traveler-role-select"
            value={roleId}
            onChange={(e) => onRoleIdChange(e.target.value)}
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
                : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood'
            )}
          >
            {(rolesData as Role[]).filter(r => r.team === 'traveler').map(r => (
              <option key={r.id} value={r.id} className={isLightModeActive ? 'bg-white text-clocktower-night' : 'bg-gray-955 text-gray-200'}>
                {r.name}
              </option>
            ))}
          </select>
          <button
            id="game-add-traveler-button"
            onClick={onAdd}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40 text-white shadow-sm',
              isLightModeActive
                ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                : 'bg-clocktower-traveler hover:bg-purple-400 active:bg-purple-600'
            )}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
