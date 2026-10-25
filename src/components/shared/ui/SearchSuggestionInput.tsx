import { useId, useState } from 'react';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { cn } from '../../../utils/cn';

interface Suggestion {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: Suggestion[];
  emptyMessage: string;
  isLightModeActive: boolean;
  onChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDismiss?: () => void;
}

export default function SearchSuggestionInput({ id, label, placeholder, value, options, emptyMessage, isLightModeActive, onChange, onSelect, onDismiss }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = options.filter(option => !searching || option.label.toLowerCase().includes(value.trim().toLowerCase()));
  const activeOption = matches[activeIndex];
  const dismiss = () => {
    setOpen(false);
    onDismiss?.();
  };
  const select = (option: Suggestion) => {
    onSelect(option.id);
    setOpen(false);
  };
  useEscapeKey(dismiss, open);

  return (
    <div className="relative flex-1 min-w-0" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) dismiss();
    }}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeOption ? `${listId}-${activeOption.id}` : undefined}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onClick={() => {
          if (!open) {
            setOpen(true);
            setSearching(false);
            setActiveIndex(0);
          }
        }}
        onFocus={event => {
          setOpen(true);
          setSearching(false);
          setActiveIndex(0);
          event.currentTarget.select();
        }}
        onChange={event => {
          onChange(event.target.value);
          setSearching(true);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            const nextIndex = matches.length ? (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length : 0;
            setActiveIndex(nextIndex);
            if (matches[nextIndex]) document.getElementById(`${listId}-${matches[nextIndex].id}`)?.scrollIntoView({ block: 'nearest' });
          } else if (event.key === 'Enter' && open && activeOption) {
            event.preventDefault();
            select(activeOption);
          }
        }}
        className={cn(
          'w-full rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-clocktower-blood border',
          isLightModeActive ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400' : 'bg-gray-955 border-gray-800 text-white placeholder-gray-650'
        )}
      />
      {open && (
        <div id={listId} role="listbox" aria-label={label} className={cn(
          'absolute left-0 right-0 mt-1 border rounded-md shadow-xl z-20 max-h-48 overflow-y-auto',
          isLightModeActive ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
        )}>
          {matches.length === 0 ? <div className="p-2 text-xs text-gray-500 italic">{emptyMessage}</div> : matches.map((option, index) => (
            <button
              key={option.id}
              id={`${listId}-${option.id}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              tabIndex={-1}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(option)}
              className={cn(
                'w-full text-left px-3 py-1.5 text-xs flex justify-between items-center gap-2 transition-colors',
                isLightModeActive ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-950' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white',
                index === activeIndex && (isLightModeActive ? 'bg-gray-100' : 'bg-gray-800/50')
              )}
            >
              <span>{option.label}</span>
              {option.description && <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">{option.description}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
