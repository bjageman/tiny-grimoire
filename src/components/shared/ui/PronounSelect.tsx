import { useRef, useState, useEffect } from 'react';
import { Venus, Mars, NonBinary, MessageCircleQuestionMark, VenusAndMars } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { PRONOUN_MAX_LENGTH } from '../../../constants';

const FIXED_PRONOUNS = ['He/Him', 'She/Her', 'They/Them'];
const PRONOUN_OPTIONS = [...FIXED_PRONOUNS, 'Custom'];

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
}

// Round pronoun badge that opens a dropdown; open state is owned by the parent modal so Escape can close this first.
export default function PronounSelect({ id, pronouns, onChange, isLightModeActive, open, onOpenChange }: PronounSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCustom = !!pronouns && !FIXED_PRONOUNS.includes(pronouns);
  const [editingCustom, setEditingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  // Drop back to the option list whenever the badge closes, so it reopens fresh next time.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setEditingCustom(false);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onOpenChange]);

  const startCustom = () => {
    setCustomDraft(isCustom ? pronouns! : '');
    setEditingCustom(true);
  };

  const commitCustom = () => {
    const text = customDraft.trim();
    if (!text) return;
    onChange(text);
    setEditingCustom(false);
    onOpenChange(false);
  };

  const PronounIcon = !pronouns ? VenusAndMars : (FIXED_ICON[pronouns] ?? MessageCircleQuestionMark);

  return (
    <div className="relative shrink-0 z-30" ref={containerRef}>
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
      {open && (
        <div className={cn(
          'absolute left-0 top-full mt-1.5 z-20 w-40 rounded-lg border shadow-xl p-1.5 space-y-0.5',
          isLightModeActive ? 'bg-white border-gray-300' : 'bg-gray-950 border-gray-700'
        )}>
          {editingCustom ? (
            <div className="p-0.5 space-y-1.5">
              <input
                autoFocus
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitCustom(); }}
                maxLength={PRONOUN_MAX_LENGTH}
                placeholder="e.g. Xe/Xem"
                className={cn(
                  'w-full px-2 py-1 rounded-md text-xs font-semibold border outline-none focus:ring-2 focus:ring-amber-500/40',
                  isLightModeActive ? 'bg-white border-gray-300 text-gray-800 placeholder-gray-400' : 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600'
                )}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEditingCustom(false)}
                  className={cn(
                    'flex-1 px-2 py-1 rounded-md text-[11px] font-bold border transition-colors',
                    isLightModeActive ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitCustom}
                  disabled={!customDraft.trim()}
                  className="flex-1 px-2 py-1 rounded-md text-[11px] font-bold text-white bg-amber-600 shadow-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {PRONOUN_OPTIONS.map(option => {
                const selected = option === 'Custom' ? isCustom : pronouns === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => { if (option === 'Custom') startCustom(); else { onChange(option); onOpenChange(false); } }}
                    className={cn(
                      'block w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-gray-500/10 truncate',
                      selected ? 'text-clocktower-blood' : isLightModeActive ? 'text-gray-700' : 'text-gray-300'
                    )}
                  >
                    {option === 'Custom' && isCustom ? pronouns : option}
                  </button>
                );
              })}
              {pronouns && (
                <button
                  type="button"
                  onClick={() => { onChange(''); onOpenChange(false); }}
                  className={cn(
                    'block w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-gray-500/10 border-t mt-0.5 pt-1.5',
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
