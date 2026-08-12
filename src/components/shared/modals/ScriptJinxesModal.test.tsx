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

const openJinxes = () => fireEvent.click(screen.getByRole('button', { name: /Jinxes/ }));

describe('ScriptJinxesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('offers a jinx button on the script modal counting the script\'s jinxes', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    expect(screen.getByRole('button', { name: /Jinxes/ })).toHaveTextContent('(2)');
  });

  it('hides the jinx button for a script with no jinxes', () => {
    render(<ScriptCharactersModal {...baseProps} roles={[{ id: 'chef', name: 'Chef', team: 'townsfolk' }]} />);
    expect(screen.queryByRole('button', { name: /Jinxes/ })).toBeNull();
  });

  it('lists only the jinxes whose characters are both on the script', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    openJinxes();
    expect(screen.getByText(/no execution occurs, good wins/)).toBeInTheDocument();
    expect(screen.getByText(/executes the Monk-protected player/)).toBeInTheDocument();
    expect(screen.queryByText(/executes the Soldier/)).toBeNull();
  });

  it('returns to the script modal when closed, leaving it open', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    openJinxes();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Script' }));
    expect(document.getElementById('script-jinxes-modal')).toBeNull();
    expect(baseProps.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Jinxes/ })).toBeInTheDocument();
  });

  it('dismisses only the jinx modal on Escape', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    openJinxes();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.getElementById('script-jinxes-modal')).toBeNull();
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it('hides the in-play filter from players', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    openJinxes();
    expect(screen.queryByText('In Play Only')).toBeNull();
  });

  it('narrows the list to in-play characters for a storyteller who enables the filter', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Alice', roleId: 'leviathan', isDead: false },
      { id: 'p2', name: 'Bob', roleId: 'mayor', isDead: false },
      { id: 'p3', name: 'Cara', roleId: 'chef', isDead: false },
    ];
    render(<ScriptCharactersModal {...baseProps} isStoryteller players={players} />);
    openJinxes();
    fireEvent.click(document.getElementById('jinxes-in-play-only-checkbox')!);
    expect(screen.getByText(/no execution occurs, good wins/)).toBeInTheDocument();
    expect(screen.queryByText(/executes the Monk-protected player/)).toBeNull();
  });
});
