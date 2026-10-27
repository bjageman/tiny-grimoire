import { useIsMobile } from '../../../hooks/useIsMobile';
import { cn } from '../../../utils/cn';

interface PlayerNameFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  className?: string;
}

export default function PlayerNameField({ id, value, onChange, onClose, className }: PlayerNameFieldProps) {
  const isMobile = useIsMobile();

  return (
    <input
      id={id}
      type="text"
      aria-label="Player name"
      value={value}
      onChange={event => onChange(event.target.value)}
      onFocus={event => event.target.select()}
      onKeyDown={event => { if (event.key === 'Enter') { event.currentTarget.blur(); onClose(); } }}
      autoFocus={!isMobile}
      autoCapitalize="words"
      placeholder="Player name"
      className={cn('flex-1 min-w-0 bg-gray-955 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm font-semibold', className)}
    />
  );
}
