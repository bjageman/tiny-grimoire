import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScriptCharactersModal from './ScriptCharactersModal';
import type { Player, Role } from '../../../types';

const roles: Role[] = [
  { id: 'leviathan', name: 'Leviathan', team: 'demon' },
  { id: 'mayor', name: 'Mayor', team: 'townsfolk' },
  { id: 'monk', name: 'Monk', team: 'townsfolk' },
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
];

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  scriptName: 'Test Script',
  roles,
  isLightModeActive: false,
};

const MAYOR_JINX = /no execution occurs, good wins/;
const MONK_JINX = /executes the Monk-protected player/;

const enableJinxes = () => {
  fireEvent.click(screen.getByLabelText('View settings'));
  fireEvent.click(document.getElementById('script-list-jinxes-checkbox')!);
};

describe('ScriptCharactersModal jinxes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('lists no jinxes until the setting is switched on', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    expect(document.getElementById('script-jinxes-section')).toBeNull();
    enableJinxes();
    expect(document.getElementById('script-jinxes-section')).toBeInTheDocument();
  });

  it('shows only the jinxes whose characters are both on the script', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    enableJinxes();
    expect(screen.getByText(MAYOR_JINX)).toBeInTheDocument();
    expect(screen.getByText(MONK_JINX)).toBeInTheDocument();
    expect(screen.queryByText(/executes the Soldier/)).toBeNull();
  });

  it('leaves the section out for a script with no jinxes', () => {
    render(<ScriptCharactersModal {...baseProps} roles={[{ id: 'chef', name: 'Chef', team: 'townsfolk' }]} />);
    enableJinxes();
    expect(document.getElementById('script-jinxes-section')).toBeNull();
  });

  it('remembers the setting across mounts', () => {
    const { unmount } = render(<ScriptCharactersModal {...baseProps} />);
    enableJinxes();
    unmount();
    render(<ScriptCharactersModal {...baseProps} />);
    expect(document.getElementById('script-jinxes-section')).toBeInTheDocument();
  });

  it('narrows jinxes to those naming a searched character', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    enableJinxes();
    fireEvent.change(screen.getByPlaceholderText('Search by name or type'), { target: { value: 'monk' } });
    expect(screen.getByText(MONK_JINX)).toBeInTheDocument();
    expect(screen.queryByText(MAYOR_JINX)).toBeNull();
  });

  it('honours the storyteller in-play filter', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Alice', roleId: 'leviathan', isDead: false },
      { id: 'p2', name: 'Bob', roleId: 'mayor', isDead: false },
      { id: 'p3', name: 'Cara', roleId: 'chef', isDead: false },
    ];
    render(<ScriptCharactersModal {...baseProps} isStoryteller players={players} />);
    enableJinxes();
    fireEvent.click(document.getElementById('script-in-play-only-checkbox')!);
    expect(screen.getByText(MAYOR_JINX)).toBeInTheDocument();
    expect(screen.queryByText(MONK_JINX)).toBeNull();
  });

  it('ignores a stored in-play preference for players', () => {
    localStorage.setItem('botc-script-list-jinxes', 'true');
    localStorage.setItem('botc-script-in-play-only', 'true');
    render(<ScriptCharactersModal {...baseProps} players={[]} />);
    expect(screen.getByText(MAYOR_JINX)).toBeInTheDocument();
    expect(screen.getByText(MONK_JINX)).toBeInTheDocument();
  });
});
