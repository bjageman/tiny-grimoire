import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameSetupMods from './GameSetupMods';

describe('Setup Modifiers', () => {
  const defaultProps = {
    sentinelOutsiderDelta: 0,
    setSentinelOutsiderDelta: vi.fn(),
    popeEnabled: false,
    setPopeEnabled: vi.fn(),
  };

  it('uses the Setup Modifiers label and exposes the Pope setting', () => {
    render(<GameSetupMods {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /setup modifiers/i }));

    expect(screen.getByText('Pope')).toBeInTheDocument();
    expect(screen.getByText('Allow duplicate Townsfolk and Outsiders')).toBeInTheDocument();
  });

  it('toggles Pope and counts it as an active modifier', () => {
    const setPopeEnabled = vi.fn();
    const { rerender } = render(<GameSetupMods {...defaultProps} setPopeEnabled={setPopeEnabled} />);

    fireEvent.click(screen.getByRole('button', { name: /setup modifiers/i }));
    fireEvent.click(screen.getByLabelText(/Pope/));
    expect(setPopeEnabled).toHaveBeenCalledWith(true);

    rerender(<GameSetupMods {...defaultProps} popeEnabled setPopeEnabled={setPopeEnabled} />);
    fireEvent.click(screen.getByRole('button', { name: /setup modifiers/i }));
    expect(screen.getByText('1 active')).toBeInTheDocument();
  });
});
