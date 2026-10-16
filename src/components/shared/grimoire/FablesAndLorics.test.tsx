import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FablesAndLorics from './FablesAndLorics';

describe('Setup Modifiers', () => {
  const defaultProps = {
    sentinelOutsiderDelta: 0,
    setSentinelOutsiderDelta: vi.fn(),
    popeEnabled: false,
    setPopeEnabled: vi.fn(),
  };

  it('uses the Setup Modifiers label and exposes the Pope setting', () => {
    render(<FablesAndLorics {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /setup modifiers/i }));

    expect(screen.getByText('Pope')).toBeInTheDocument();
    expect(screen.getByText('Allow duplicate Townsfolk and Outsiders')).toBeInTheDocument();
  });

  it('toggles Pope and counts it as an active modifier', () => {
    const setPopeEnabled = vi.fn();
    const { rerender } = render(<FablesAndLorics {...defaultProps} setPopeEnabled={setPopeEnabled} />);

    fireEvent.click(screen.getByRole('button', { name: /setup modifiers/i }));
    fireEvent.click(screen.getByLabelText(/Pope/));
    expect(setPopeEnabled).toHaveBeenCalledWith(true);

    rerender(<FablesAndLorics {...defaultProps} popeEnabled setPopeEnabled={setPopeEnabled} />);
    fireEvent.click(screen.getByRole('button', { name: /setup modifiers/i }));
    expect(screen.getByText('1 active')).toBeInTheDocument();
  });
});
