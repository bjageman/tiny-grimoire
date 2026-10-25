import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddTravelerCard from './AddTravelerCard';

function Card({ onAdd }: { onAdd: (id?: string) => void }) {
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('beggar');
  return <AddTravelerCard isLightModeActive={false} title="Add Traveler" name={name} onNameChange={setName} roleId={roleId} onRoleIdChange={setRoleId} disabled={false} spectators={[{ id: 'viewer', name: 'Vera' }]} onAdd={onAdd} />;
}

describe('AddTravelerCard search suggestions', () => {
  it('selects a connected spectator and searches Traveler characters without native selects', () => {
    const onAdd = vi.fn();
    const { container } = render(<Card onAdd={onAdd} />);
    expect(container.querySelector('select')).toBeNull();
    const name = screen.getByRole('combobox', { name: 'Traveler name' });
    fireEvent.focus(name);
    fireEvent.change(name, { target: { value: 'ver' } });
    fireEvent.click(screen.getByRole('option', { name: /Vera/ }));
    expect(name).toHaveValue('Vera');
    const character = screen.getByRole('combobox', { name: 'Traveler character' });
    fireEvent.focus(character);
    fireEvent.change(character, { target: { value: 'guns' } });
    fireEvent.keyDown(character, { key: 'Enter' });
    expect(character).toHaveValue('Gunslinger');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledWith('viewer');
  });

  it('uses a new identity when the selected spectator name is edited', () => {
    const onAdd = vi.fn();
    render(<Card onAdd={onAdd} />);
    const name = screen.getByRole('combobox', { name: 'Traveler name' });
    fireEvent.focus(name);
    fireEvent.click(screen.getByRole('option', { name: /Vera/ }));
    fireEvent.change(name, { target: { value: 'New Traveler' } });
    expect(screen.getByText('No matching spectators')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledWith(undefined);
  });

  it('dismisses an unselected character search and keeps the selected character', () => {
    render(<Card onAdd={vi.fn()} />);
    const character = screen.getByRole('combobox', { name: 'Traveler character' });
    fireEvent.focus(character);
    fireEvent.change(character, { target: { value: 'no such traveler' } });
    expect(screen.getByText('No matching Travelers')).toBeInTheDocument();
    fireEvent.keyDown(character, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(character).toHaveValue('Beggar');
    fireEvent.focus(character);
    expect(screen.getByRole('option', { name: /Gunslinger/ })).toBeInTheDocument();
    fireEvent.blur(character);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
