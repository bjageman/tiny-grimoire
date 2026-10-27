import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AssignmentConfirmationModal from './AssignmentConfirmationModal';

afterEach(cleanup);

describe('AssignmentConfirmationModal', () => {
  it.each([1, 3])('shows the joined player count (%i) without sending assignments', remotePlayerCount => {
    const onConfirm = vi.fn();
    render(<AssignmentConfirmationModal remotePlayerCount={remotePlayerCount} isLightModeActive={false} confirmButtonId="confirm-test" onCancel={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByText(remotePlayerCount === 1 ? /1 player has joined/ : /3 players have joined/)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Open Grimoire' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Open Grimoire' })).toHaveAttribute('id', 'confirm-test');
  });

  it('cancels from the button or backdrop but keeps clicks inside the dialog contained', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { container } = render(<AssignmentConfirmationModal remotePlayerCount={2} isLightModeActive confirmButtonId="confirm-test" onCancel={onCancel} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('heading', { name: 'Send character assignments?' }));
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    fireEvent.click(container.firstElementChild!);
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
