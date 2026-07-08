import { useMemo, useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { cn } from '../../utils/cn';
import type { Role } from '../../types';
import remindersData from '../../reminders.json';

interface ReminderOption {
  sourceCharId: string;
  sourceCharName: string;
  text: string;
}

interface ReminderPickerModalProps {
  targetPlayerName: string;
  activeRoleIds: string[];
  rolesData: Role[];
  onSelect: (sourceCharId: string, text: string) => void;
  onClose: () => void;
  isLightModeActive: boolean;
}

export default function ReminderPickerModal({
  targetPlayerName,
  activeRoleIds,
  rolesData,
  onSelect,
  onClose,
  isLightModeActive,
}: ReminderPickerModalProps) {
  useScrollLock();
  const [search, setSearch] = useState('');

  const options: ReminderOption[] = useMemo(() => activeRoleIds.flatMap((charId) => {
    const reminders = (remindersData as Record<string, string[]>)[charId] ?? [];
    const role = rolesData.find((r) => r.id === charId);
    if (!role || reminders.length === 0) return [];
    return reminders.map((text) => ({
      sourceCharId: charId,
      sourceCharName: role.name,
      text,
    }));
  }), [activeRoleIds, rolesData]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? options.filter(
          (o) =>
            o.text.toLowerCase().includes(term) ||
            o.sourceCharName.toLowerCase().includes(term)
        )
      : options;
  }, [options, search]);

  return (
    <div
      id="reminder-picker-backdrop"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="reminder-picker-modal"
        className={cn(
          'w-full max-w-sm rounded-lg shadow-2xl flex flex-col max-h-[80vh]',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20 text-gray-800'
            : 'bg-gray-900 border border-gray-800 text-gray-100'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-inherit flex-shrink-0">
          <div>
            <h3 className="font-display font-bold text-sm text-clocktower-blood tracking-wider uppercase">Add Reminder</h3>
            <p className={cn('text-xs mt-0.5', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
              for {targetPlayerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn('text-lg leading-none px-1', isLightModeActive ? 'text-gray-400 hover:text-gray-700' : 'text-gray-500 hover:text-gray-200')}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <input
            id="reminder-search-input"
            type="text"
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full rounded-md px-3 py-1.5 text-xs outline-none border',
              isLightModeActive
                ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                : 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
            )}
          />
        </div>

        {/* Reminder list */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-2 pb-3">
          {filtered.length === 0 ? (
            <p className={cn('text-xs text-center py-6', isLightModeActive ? 'text-gray-400' : 'text-gray-500')}>
              {options.length === 0 ? 'No reminders available for characters in this game.' : 'No matches.'}
            </p>
          ) : (
            filtered.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelect(opt.sourceCharId, opt.text)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors my-0.5',
                  isLightModeActive
                    ? 'hover:bg-gray-100 active:bg-gray-200'
                    : 'hover:bg-gray-800 active:bg-gray-700'
                )}
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-300">
                  <img
                    src={`/icons/${opt.sourceCharId}.svg`}
                    alt={opt.sourceCharName}
                    className="w-full h-full object-contain opacity-80"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight">{opt.text}</div>
                  <div className={cn('text-[10px] leading-tight', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
                    {opt.sourceCharName}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
