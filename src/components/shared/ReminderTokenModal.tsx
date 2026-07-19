import { useScrollLock } from '../../hooks/useScrollLock';
import { cn } from '../../utils/cn';
import { roleIconFallback } from '../../utils/roleIcon';
import type { PlacedReminder, Role } from '../../types';

interface ReminderTokenModalProps {
  reminder: PlacedReminder;
  rolesData: Role[];
  onRemove: () => void;
  onClose: () => void;
  isLightModeActive: boolean;
}

export default function ReminderTokenModal({
  reminder,
  rolesData,
  onRemove,
  onClose,
  isLightModeActive,
}: ReminderTokenModalProps) {
  useScrollLock();
  const role = rolesData.find((r) => r.id === reminder.sourceCharId);

  return (
    <div
      id="reminder-token-backdrop"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="reminder-token-modal"
        className={cn(
          'w-full max-w-xs rounded-lg p-5 shadow-2xl text-center',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20'
            : 'bg-gray-900 border border-gray-800'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-gray-300 mx-auto mb-3 flex items-center justify-center overflow-hidden">
          <img
            src={`/icons/${reminder.sourceCharId}.svg`}
            alt={role?.name ?? reminder.sourceCharId}
            className="w-16 h-16 object-contain opacity-80"
            onError={roleIconFallback(role)}
          />
        </div>

        {/* Reminder text */}
        <h3 className={cn('font-bold text-base mb-1', isLightModeActive ? 'text-gray-900' : 'text-gray-100')}>
          {reminder.text}
        </h3>
        {role && (
          <p className={cn('text-xs mb-4', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
            {role.name}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-2 justify-center">
          <button
            id="reminder-token-close-button"
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            )}
          >
            Close
          </button>
          <button
            id="reminder-token-remove-button"
            onClick={onRemove}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-clocktower-blood text-white hover:bg-clocktower-blood/85 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
