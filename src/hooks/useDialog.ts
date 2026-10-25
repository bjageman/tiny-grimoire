import { useState } from 'react';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  secondaryAction?: { label: string; onClick: () => void };
}

const CLOSED: DialogState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'alert',
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
  onConfirm: () => {},
};

export function useDialog() {
  const [state, setState] = useState<DialogState>(CLOSED);

  const close = () => setState(s => ({ ...s, isOpen: false }));

  const showAlert = (message: string, title = '') => {
    setState({ isOpen: true, title, message, type: 'alert', confirmLabel: 'OK', cancelLabel: 'Cancel', onConfirm: close });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = '', confirmLabel = 'Confirm', secondaryAction?: DialogState['secondaryAction']) => {
    setState({
      isOpen: true, title, message, type: 'confirm', confirmLabel, cancelLabel: 'Cancel',
      onConfirm: () => { close(); onConfirm(); },
      secondaryAction: secondaryAction && { label: secondaryAction.label, onClick: () => { close(); secondaryAction.onClick(); } },
    });
  };

  return { dialogProps: { ...state, onCancel: close }, showAlert, showConfirm };
}
