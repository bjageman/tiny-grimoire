import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { DialogChoice } from '../../../hooks/useDialog';
import { useScrollLock } from '../../../hooks/useScrollLock';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { cn } from '../../../utils/cn';
import CloseButton from '../ui/CloseButton';

interface DialogModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  type: 'alert' | 'confirm';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLightModeActive: boolean;
  choices?: DialogChoice[];
}

export default function DialogModal({
  isOpen,
  title,
  message,
  type,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLightModeActive,
  choices,
}: DialogModalProps) {
  useScrollLock(isOpen);

  useEscapeKey(onCancel, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (choices) return;
      if (e.target instanceof Element && e.target.closest('button, input, select, textarea, a, [contenteditable="true"]')) return;
      onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onConfirm, choices]);

  if (!isOpen) return null;

  const confirmAction = { id: 'dialog-confirm-button', label: confirmLabel, onClick: onConfirm, primary: true };
  const cancelAction = { id: 'dialog-cancel-button', label: cancelLabel, onClick: onCancel, primary: false };
  const actions = choices
    ? choices.map((choice, index) => ({ id: `dialog-choice-${index}`, ...choice, primary: choice.destructive ?? false }))
    : type === 'confirm' ? [cancelAction, confirmAction] : [confirmAction];

  return (
    <div
      id="dialog-modal-backdrop"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={type === 'alert' ? onCancel : undefined}
    >
      <div
        id="dialog-modal"
        className={cn(
          'relative w-full max-w-sm rounded-lg p-5 space-y-4 shadow-2xl',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20'
            : 'bg-gray-900 border border-gray-800'
        )}
        onClick={e => e.stopPropagation()}
      >
        {choices && (
          <CloseButton
            onClick={onCancel}
            isLightModeActive={isLightModeActive}
            className="absolute right-2 top-2"
          />
        )}
        {title && (
          <h3 className={cn('font-display font-bold text-base text-clocktower-blood text-center tracking-wider uppercase', choices && 'px-5')}>{title}</h3>
        )}
        <div className={cn('text-sm leading-relaxed text-center', isLightModeActive ? 'text-gray-700' : 'text-gray-300')}>
          {message}
        </div>
        <div id="dialog-modal-actions" className="flex flex-wrap gap-2 justify-center">
          {actions.map(action => (
            <button
              key={action.id}
              id={action.id}
              type="button"
              onClick={action.onClick}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold transition-colors',
                action.primary
                  ? 'bg-clocktower-blood text-white hover:bg-clocktower-blood/85 active:bg-clocktower-blood/70'
                  : cn('border', isLightModeActive ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700')
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
