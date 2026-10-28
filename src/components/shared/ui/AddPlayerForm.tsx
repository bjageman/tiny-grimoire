import { Plus } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface AddPlayerFormProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  playerCount: number;
  maxPlayers: number;
  addButtonId?: string;
  inputClassName?: string;
}

export default function AddPlayerForm({ value, onChange, onAdd, playerCount, maxPlayers, addButtonId, inputClassName }: AddPlayerFormProps) {
  const atLimit = playerCount >= maxPlayers;

  return (
    <div className="flex gap-2 mb-4">
      <input
        id="new-player-input"
        type="text"
        aria-label="New player name"
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && !atLimit) onAdd(); }}
        disabled={atLimit}
        placeholder={atLimit ? `Maximum players reached (${maxPlayers})` : 'Enter player name in seating order...'}
        autoCapitalize="words"
        className={cn('flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed', inputClassName)}
      />
      <button
        id={addButtonId}
        type="button"
        aria-label="Add player"
        onClick={onAdd}
        disabled={atLimit}
        className={cn(
          'px-4 py-2 rounded transition-colors text-white',
          atLimit
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-800'
            : 'bg-clocktower-blood hover:bg-red-800 border border-clocktower-blood'
        )}
      >
        <Plus size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
