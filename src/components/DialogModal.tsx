import { useEffect } from 'react';
import { cn } from '../utils/cn';

interface DialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLightModeActive: boolean;
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
}: DialogModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="dialog-modal-backdrop"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={type === 'alert' ? onCancel : undefined}
    >
      <div
        id="dialog-modal"
        className={cn(
          'w-full max-w-sm rounded-lg p-5 space-y-4 shadow-2xl',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20'
            : 'bg-gray-900 border border-gray-800'
        )}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h3 className="font-bold text-base text-clocktower-blood text-center">{title}</h3>
        )}
        <p className={cn('text-sm leading-relaxed text-center', isLightModeActive ? 'text-gray-700' : 'text-gray-300')}>
          {message}
        </p>
        <div className="flex gap-2 justify-center">
          {type === 'confirm' && (
            <button
              id="dialog-cancel-button"
              onClick={onCancel}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold transition-colors border',
                isLightModeActive
                  ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              )}
            >
              {cancelLabel}
            </button>
          )}
          <button
            id="dialog-confirm-button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors bg-clocktower-blood text-white hover:bg-clocktower-blood/85 active:bg-clocktower-blood/70"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
