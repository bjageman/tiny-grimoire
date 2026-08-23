import { useRef, useState, useEffect } from 'react';
import { Venus, Mars, NonBinary, MessageCircleQuestionMark, VenusAndMars, ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { PRONOUN_MAX_LENGTH } from '../../../constants';
import { readCustomPronouns, saveCustomPronouns } from '../../../utils/customPronouns';

const FIXED_PRONOUNS = ['He/Him', 'She/Her', 'They/Them'];

const FIXED_ICON: Record<string, typeof VenusAndMars> = {
  'He/Him': Mars,
  'She/Her': Venus,
  'They/Them': NonBinary,
};

interface PronounSelectProps {
  id: string;
  pronouns?: string;
  onChange: (pronouns: string) => void;
  isLightModeActive: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Renders a full-width labeled button (e.g. "Select Pronouns (optional)") instead of the round icon badge. */
  triggerLabel?: string;
}

// Pronoun picker that opens a dropdown; open state is owned by the parent modal so Escape can close this first.
export default function PronounSelect({ id, pronouns, onChange, isLightModeActive, open, onOpenChange, triggerLabel }: PronounSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [customPronouns, setCustomPronouns] = useState<string[]>(readCustomPronouns);
  const [addingCustom, setAddingCustom] = useState(false);
  const [draftCustom, setDraftCustom] = useState('');

  // Drop back to the option list whenever the badge closes, so it reopens fresh next time.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setAddingCustom(false);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onOpenChange]);

  const commitCustom = () => {
    const text = draftCustom.trim();
    if (!text) return;
    const next = customPronouns.includes(text) ? customPronouns : [...customPronouns, text];
    setCustomPronouns(next);
    saveCustomPronouns(next);
    onChange(text);
    setDraftCustom('');
    setAddingCustom(false);
    onOpenChange(false);
  };

  const removeCustomPronoun = (value: string) => {
    const next = customPronouns.filter(p => p !== value);
    setCustomPronouns(next);
    saveCustomPronouns(next);
  };

  const PronounIcon = !pronouns ? VenusAndMars : (FIXED_ICON[pronouns] ?? MessageCircleQuestionMark);

  return (
    <div className={cn('relative z-30', triggerLabel ? 'w-full' : 'shrink-0')} ref={containerRef}>
      {triggerLabel ? (
        <button
          id={id}
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-label="Pronouns"
          className={cn(
            'flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold border transition-colors',
            open ? 'border-clocktower-blood' : isLightModeActive ? 'bg-white border-gray-300 text-gray-600 hover:border-gray-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500',
            pronouns && (isLightModeActive ? 'text-gray-800' : 'text-gray-200')
          )}
        >
          <span className="truncate">{pronouns || triggerLabel}</span>
          <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
      ) : (
        <button
          id={id}
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-label="Pronouns"
          title={pronouns || 'Pronouns'}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-full text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-95 ring-2 ring-white/30',
            open ? 'bg-amber-600' : 'bg-amber-500 hover:bg-amber-600'
          )}
        >
          <PronounIcon size={18} />
        </button>
      )}
      {open && (
        <div className={cn(
          'absolute left-0 top-full mt-1.5 z-20 rounded-lg border shadow-xl p-1.5 space-y-0.5',
          triggerLabel ? 'w-full' : 'w-48',
          isLightModeActive ? 'bg-white border-gray-300' : 'bg-gray-950 border-gray-700'
        )}>
          {addingCustom ? (
            <div className="p-0.5 space-y-1.5">
              <input
                autoFocus
                value={draftCustom}
                onChange={(e) => setDraftCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitCustom(); }}
                maxLength={PRONOUN_MAX_LENGTH}
                placeholder="e.g. Xe/Xem"
                className={cn(
                  'w-full px-2 py-1 rounded-md text-sm font-semibold border outline-none focus:ring-2 focus:ring-amber-500/40',
                  isLightModeActive ? 'bg-white border-gray-300 text-gray-800 placeholder-gray-400' : 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600'
                )}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setAddingCustom(false)}
                  className={cn(
                    'flex-1 px-2 py-1 rounded-md text-xs font-bold border transition-colors',
                    isLightModeActive ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitCustom}
                  disabled={!draftCustom.trim()}
                  className="flex-1 px-2 py-1 rounded-md text-xs font-bold text-white bg-amber-600 shadow-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {FIXED_PRONOUNS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { onChange(option); onOpenChange(false); }}
                  className={cn(
                    'block w-full text-left px-2.5 py-1.5 rounded-md text-sm font-semibold transition-colors hover:bg-gray-500/10 truncate',
                    pronouns === option ? 'text-clocktower-blood' : isLightModeActive ? 'text-gray-700' : 'text-gray-300'
                  )}
                >
                  {option}
                </button>
              ))}
              {customPronouns.map(value => (
                <div key={value} className="group flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => { onChange(value); onOpenChange(false); }}
                    className={cn(
                      'flex-1 min-w-0 text-left px-2.5 py-1.5 rounded-md text-sm font-semibold transition-colors hover:bg-gray-500/10 truncate',
                      pronouns === value ? 'text-clocktower-blood' : isLightModeActive ? 'text-gray-700' : 'text-gray-300'
                    )}
                  >
                    {value}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCustomPronoun(value)}
                    aria-label={`Delete pronoun "${value}"`}
                    title="Delete pronoun"
                    className={cn(
                      'shrink-0 p-1 rounded-md transition-colors opacity-60 group-hover:opacity-100',
                      isLightModeActive ? 'text-red-650 hover:bg-red-50' : 'text-red-400 hover:bg-red-950/40'
                    )}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => { setDraftCustom(''); setAddingCustom(true); }}
                className={cn(
                  'flex items-center gap-1.5 w-full text-left px-2.5 py-1.5 mt-1 rounded-md text-sm font-bold border-t transition-colors hover:bg-amber-500/10',
                  isLightModeActive ? 'text-amber-700 border-gray-200' : 'text-amber-400 border-gray-800'
                )}
              >
                Add Custom Pronoun <Plus size={12} />
              </button>
              {pronouns && (
                <button
                  type="button"
                  onClick={() => { onChange(''); onOpenChange(false); }}
                  className={cn(
                    'block w-full text-left px-2.5 py-1.5 rounded-md text-sm font-semibold transition-colors hover:bg-gray-500/10 border-t mt-0.5 pt-1.5',
                    isLightModeActive ? 'text-gray-500 border-gray-200' : 'text-gray-400 border-gray-800'
                  )}
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
