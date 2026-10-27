import { useState } from 'react';
import type { Player } from '../../../types';
import { cn } from '../../../utils/cn';
import GrimoireCard from '../ui/GrimoireCard';
import { PLAYABLE_ROLES } from '../../../utils/roleData';
import SearchSuggestionInput from '../ui/SearchSuggestionInput';

interface AddTravelerCardProps {
  isLightModeActive: boolean;
  title: string;
  name: string;
  onNameChange: (value: string) => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  disabled: boolean;
  spectators?: Pick<Player, 'id' | 'name'>[];
  onAdd: (spectatorId?: string) => void;
}

// Traveler name + role picker shown to the storyteller during a game.
export default function AddTravelerCard({ isLightModeActive, title, name, onNameChange, roleId, onRoleIdChange, disabled, spectators = [], onAdd }: AddTravelerCardProps) {
  const [selectedSpectatorId, setSelectedSpectatorId] = useState('');
  const travelerRoles = PLAYABLE_ROLES.filter(role => role.team === 'traveler');
  const selectedSpectator = spectators.find(spectator => spectator.id === selectedSpectatorId && spectator.name === name);

  return (
    <GrimoireCard
      isLightModeActive={isLightModeActive}
      className={cn('space-y-3', isLightModeActive && 'text-clocktower-night')}
    >
      <h4 className={cn(
        'text-xs uppercase font-bold tracking-wider',
        isLightModeActive ? 'text-gray-600' : 'text-gray-500'
      )}>{title}</h4>
      <div className="flex flex-col gap-2">
        <SearchSuggestionInput
          id="game-traveler-name-input"
          label="Traveler name"
          placeholder="Traveler name..."
          value={name}
          options={spectators.map(spectator => ({ id: spectator.id, label: spectator.name, description: 'Spectator' }))}
          emptyMessage="No matching spectators"
          isLightModeActive={isLightModeActive}
          onChange={value => {
            onNameChange(value);
            setSelectedSpectatorId('');
          }}
          onSelect={id => {
            const spectator = spectators.find(candidate => candidate.id === id);
            setSelectedSpectatorId(spectator?.id || '');
            onNameChange(spectator?.name || '');
          }}
        />
        <div className="flex gap-2">
          <select
            id="game-traveler-role-select"
            aria-label="Traveler character"
            value={roleId}
            onChange={event => onRoleIdChange(event.target.value)}
            className={cn(
              'flex-1 min-w-0 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
                : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood'
            )}
          >
            {travelerRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
          <button
            id="game-add-traveler-button"
            onClick={() => onAdd(selectedSpectator?.id)}
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
    </GrimoireCard>
  );
}
