import { cn } from '../../../utils/cn';

const MODIFIERS = {
  drunk: { label: 'Drunk', activeClassName: 'bg-yellow-600 border-yellow-755 text-black font-black' },
  marionette: { label: 'Marionette', activeClassName: 'bg-clocktower-minion border-clocktower-minion/40 text-white font-black' },
  lunatic: { label: 'Lunatic', activeClassName: 'bg-clocktower-outsider border-clocktower-outsider/40 text-white font-black' },
  lilmonsta: { label: "Lil' Monsta", activeClassName: 'bg-clocktower-demon border-clocktower-demon/40 text-white font-black' },
};

interface CharacterModifierButtonProps {
  modifier: keyof typeof MODIFIERS;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  id?: string;
  size?: 'compact' | 'regular';
}

export default function CharacterModifierButton({ modifier, active, onClick, disabled = false, id, size = 'compact' }: CharacterModifierButtonProps) {
  const { label, activeClassName } = MODIFIERS[modifier];
  const compact = size === 'compact';

  return (
    <button
      id={id}
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded font-bold border transition-all flex items-center disabled:opacity-40 disabled:cursor-not-allowed',
        compact ? 'px-2.5 py-1 text-[14px] gap-1' : 'px-3 py-1.5 text-sm gap-1.5',
        active ? activeClassName : 'bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400'
      )}
    >
      <span className={cn('bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100', compact ? 'w-5 h-5 overflow-hidden' : 'w-4 h-4')}>
        <img
          src={`/icons/${modifier}.svg`}
          alt=""
          className={cn('object-contain', compact || modifier === 'lilmonsta' ? 'w-3.5 h-3.5' : 'w-3 h-3')}
          onError={event => { event.currentTarget.parentElement!.style.display = 'none'; }}
        />
      </span>
      {label}
    </button>
  );
}
