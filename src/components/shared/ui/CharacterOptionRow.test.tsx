import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CharacterOptionRow from './CharacterOptionRow';

afterEach(cleanup);
const role = { id: 'chef', name: 'Chef', team: 'townsfolk' as const };

describe('CharacterOptionRow', () => {
  it('leaves selection changes to the parent and exposes current selection', () => {
    const onClick = vi.fn();
    const { rerender } = render(<CharacterOptionRow role={role} selected={false} isLightModeActive={false} onClick={onClick} />);
    const button = screen.getByRole('button', { pressed: false });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    rerender(<CharacterOptionRow role={role} selected isLightModeActive={false} onClick={onClick} />);
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Chef ✓')).toBeInTheDocument();
  });

  it('supports preference actions and badges without assignment checkmarks', () => {
    const onClick = vi.fn();
    render(
      <CharacterOptionRow role={role} selected variant="preference" isLightModeActive trailing={<span>ACTIVE</span>} onClick={onClick}>
        <span>Taken: Alice</span>
      </CharacterOptionRow>
    );
    expect(screen.getByText('Chef')).toBeInTheDocument();
    expect(screen.queryByText('Chef ✓')).toBeNull();
    expect(screen.getByText('Taken: Alice')).toBeInTheDocument();
    fireEvent.click(screen.getByText('ACTIVE'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('preserves native disabled behavior', () => {
    const onClick = vi.fn();
    render(<CharacterOptionRow role={role} selected={false} isLightModeActive={false} disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
