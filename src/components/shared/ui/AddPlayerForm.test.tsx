import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AddPlayerForm from './AddPlayerForm';

afterEach(cleanup);

describe('AddPlayerForm', () => {
  it('passes name edits to the caller and supports adding with Enter or the button', () => {
    const onChange = vi.fn();
    const onAdd = vi.fn();
    render(<AddPlayerForm value="Alice" onChange={onChange} onAdd={onAdd} playerCount={2} maxPlayers={20} />);
    const input = screen.getByRole('textbox', { name: 'New player name' });
    fireEvent.change(input, { target: { value: 'Bob' } });
    expect(onChange).toHaveBeenCalledWith('Bob');
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Add player' }));
    expect(onAdd).toHaveBeenCalledTimes(2);
  });

  it.each([15, 20])('disables adding at the configured limit of %i players', maxPlayers => {
    const onAdd = vi.fn();
    const { rerender } = render(<AddPlayerForm value="Alice" onChange={vi.fn()} onAdd={onAdd} playerCount={maxPlayers - 1} maxPlayers={maxPlayers} />);
    expect(screen.getByRole('button', { name: 'Add player' })).toBeEnabled();
    rerender(<AddPlayerForm value="Alice" onChange={vi.fn()} onAdd={onAdd} playerCount={maxPlayers} maxPlayers={maxPlayers} />);
    const input = screen.getByRole('textbox', { name: 'New player name' });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', `Maximum players reached (${maxPlayers})`);
    const button = screen.getByRole('button', { name: 'Add player' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not add a player while Enter is committing composed text', () => {
    const onAdd = vi.fn();
    render(<AddPlayerForm value="Alice" onChange={vi.fn()} onAdd={onAdd} playerCount={2} maxPlayers={20} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', isComposing: true });
    expect(onAdd).not.toHaveBeenCalled();
  });
});
