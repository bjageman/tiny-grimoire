import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddTravelerCard from './AddTravelerCard';

function Card({ onAdd, spectators = [{ id: 'viewer', name: 'Vera' }] }: { onAdd: (id?: string) => void; spectators?: { id: string; name: string }[] }) {
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('beggar');
  return <AddTravelerCard isLightModeActive={false} title="Add Traveler" name={name} onNameChange={setName} roleId={roleId} onRoleIdChange={setRoleId} disabled={false} spectators={spectators} onAdd={onAdd} />;
}

describe('AddTravelerCard search suggestions', () => {
  it('searches connected spectators and uses a simple Traveler character dropdown', () => {
    const onAdd = vi.fn();
    const { container } = render(<Card onAdd={onAdd} />);
    expect(container.querySelectorAll('select')).toHaveLength(1);
    const name = screen.getByRole('combobox', { name: 'Traveler name' });
    fireEvent.focus(name);
    fireEvent.change(name, { target: { value: 'ver' } });
    fireEvent.click(screen.getByRole('option', { name: /Vera/ }));
    expect(name).toHaveValue('Vera');
    const character = screen.getByRole('combobox', { name: 'Traveler character' });
    fireEvent.change(character, { target: { value: 'gunslinger' } });
    expect(character).toHaveValue('gunslinger');
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

  it('dismisses spectator suggestions with Escape and when focus leaves', () => {
    render(<Card onAdd={vi.fn()} />);
    const name = screen.getByRole('combobox', { name: 'Traveler name' });
    fireEvent.focus(name);
    fireEvent.change(name, { target: { value: 'Unknown' } });
    expect(screen.getByText('No matching spectators')).toBeInTheDocument();
    fireEvent.keyDown(name, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(name).toHaveValue('Unknown');
    fireEvent.focus(name);
    expect(screen.getByRole('option', { name: /Vera/ })).toBeInTheDocument();
    fireEvent.blur(name);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keeps the name field plain when no spectators are connected', () => {
    const onAdd = vi.fn();
    render(<Card onAdd={onAdd} spectators={[]} />);
    const name = screen.getByRole('textbox', { name: 'Traveler name' });
    fireEvent.focus(name);
    fireEvent.change(name, { target: { value: 'New Traveler' } });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.queryByText('No connected spectators')).toBeNull();
    expect(screen.queryByText('No matching spectators')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledWith(undefined);
  });
});
