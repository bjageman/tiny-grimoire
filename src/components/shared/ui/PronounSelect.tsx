import { useRef, useEffect } from 'react';
import { Venus, Mars, NonBinary, MessageCircleQuestionMark, VenusAndMars } from 'lucide-react';
import { cn } from '../../../utils/cn';

const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'Ask Me'];

const PRONOUN_ICON: Record<string, typeof VenusAndMars> = {
  'He/Him': Mars,
  'She/Her': Venus,
  'They/Them': NonBinary,
  'Ask Me': MessageCircleQuestionMark,
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onOpenChange]);

  const PronounIcon = (pronouns && PRONOUN_ICON[pronouns]) || VenusAndMars;

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
          {PRONOUN_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); onOpenChange(false); }}
              className={cn(
                'block w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-gray-500/10',
                pronouns === option
                  ? 'text-clocktower-blood'
                  : isLightModeActive ? 'text-gray-700' : 'text-gray-300'
              )}
            >
              {option}
            </button>
          ))}
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
        </div>
      )}
    </div>
  );
}
