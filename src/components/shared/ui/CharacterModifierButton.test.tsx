import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CharacterModifierButton from './CharacterModifierButton';

afterEach(cleanup);

describe('CharacterModifierButton', () => {
  it('reports the current state and leaves changes to the caller', () => {
    const onClick = vi.fn();
    const { rerender } = render(<CharacterModifierButton modifier="drunk" active={false} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Drunk', pressed: false });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    rerender(<CharacterModifierButton modifier="drunk" active onClick={onClick} />);
    expect(screen.getByRole('button', { name: 'Drunk', pressed: true })).toBeInTheDocument();
  });

  it('prevents changes when the modifier is unavailable', () => {
    const onClick = vi.fn();
    render(<CharacterModifierButton modifier="marionette" active={false} disabled onClick={onClick} size="regular" />);
    const button = screen.getByRole('button', { name: 'Marionette' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
