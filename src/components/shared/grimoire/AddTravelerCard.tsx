import { useState } from 'react';
import type { Player } from '../../../types';
import { cn } from '../../../utils/cn';
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
  const [roleSearch, setRoleSearch] = useState<string | null>(null);
  const travelerRoles = PLAYABLE_ROLES.filter(role => role.team === 'traveler');
  const selectedRole = travelerRoles.find(role => role.id === roleId);
  const selectedSpectator = spectators.find(spectator => spectator.id === selectedSpectatorId && spectator.name === name);

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
        <SearchSuggestionInput
          id="game-traveler-name-input"
          label="Traveler name"
          placeholder="Traveler name..."
          value={name}
          options={spectators.map(spectator => ({ id: spectator.id, label: spectator.name, description: 'Spectator' }))}
          emptyMessage={spectators.length ? 'No matching spectators' : 'No connected spectators'}
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
          <SearchSuggestionInput
            id="game-traveler-role-input"
            label="Traveler character"
            placeholder="Search Travelers..."
            value={roleSearch ?? selectedRole?.name ?? ''}
            options={travelerRoles.map(role => ({ id: role.id, label: role.name, description: 'Traveler' }))}
            emptyMessage="No matching Travelers"
            isLightModeActive={isLightModeActive}
            onChange={setRoleSearch}
            onSelect={id => {
              onRoleIdChange(id);
              setRoleSearch(null);
            }}
            onDismiss={() => setRoleSearch(null)}
          />
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
    </div>
  );
}
