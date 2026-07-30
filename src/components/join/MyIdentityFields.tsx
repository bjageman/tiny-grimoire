import { useState } from 'react';
import { cn } from '../../utils/cn';

const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'Ask Me'];

interface MyIdentityFieldsProps {
  isLight: boolean;
  name: string;
  pronouns: string;
  onChangeName: (next: string) => void;
  onSelectPronoun: (next: string) => void;
}

// The joined player's own name and pronouns — the only identity fields they are allowed to edit.
export default function MyIdentityFields({ isLight, name, pronouns, onChangeName, onSelectPronoun }: MyIdentityFieldsProps) {
  const [draftName, setDraftName] = useState(name);
  const [lastName, setLastName] = useState(name);

  // Adjust during render rather than in an effect, so a name arriving from elsewhere replaces an untouched draft.
  if (name !== lastName) {
    setLastName(name);
    setDraftName(name);
  }

  // Only announce a rename once the player is done typing, so the storyteller's roster does not flicker per keystroke.
  const commitName = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === name) {
      setDraftName(name);
      return;
    }
    onChangeName(trimmed);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className={cn("text-[10px] uppercase font-bold tracking-wider text-center", isLight ? "text-gray-400" : "text-gray-500")}>Your Name</p>
        <input
          id="my-name-input"
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          autoCapitalize="words"
          maxLength={24}
          placeholder="Your name"
          className={cn(
            "w-full text-center rounded-lg px-3 py-2 text-sm font-bold border focus:outline-none focus:border-clocktower-blood transition-colors",
            isLight
              ? "bg-white border-gray-300 text-clocktower-night"
              : "bg-gray-950 border-gray-700 text-white"
          )}
        />
      </div>

      <div className="space-y-2">
        <p className={cn("text-[10px] uppercase font-bold tracking-wider text-center", isLight ? "text-gray-400" : "text-gray-500")}>Pronouns (optional)</p>
        <div className="flex justify-center gap-1.5">
          {PRONOUN_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onSelectPronoun(pronouns === p ? '' : p)}
              className={cn(
                "px-2 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                pronouns === p
                  ? "bg-clocktower-blood text-white border-clocktower-blood"
                  : isLight
                    ? "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                    : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
