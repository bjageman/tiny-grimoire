import { useState } from 'react';
import type { ReactNode } from 'react';

export interface DialogChoice {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  type: 'alert' | 'confirm';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  choices?: DialogChoice[];
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

  const showConfirm = (message: string, onConfirm: () => void, title = '', confirmLabel = 'Confirm') => {
    setState({
      isOpen: true, title, message, type: 'confirm', confirmLabel, cancelLabel: 'Cancel',
      onConfirm: () => { close(); onConfirm(); },
    });
  };

  const showChoice = (message: ReactNode, choices: DialogChoice[], title = '') => {
    setState({
      ...CLOSED, isOpen: true, title, message, type: 'confirm', onConfirm: close,
      choices: choices.map(choice => ({ ...choice, onClick: () => { close(); choice.onClick(); } })),
    });
  };

  return { dialogProps: { ...state, onCancel: close }, showAlert, showConfirm, showChoice };
}
