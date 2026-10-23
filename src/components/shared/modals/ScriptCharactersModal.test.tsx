import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ScriptCharactersModal from './ScriptCharactersModal';
import { ALL_ROLES } from '../../../utils/roleData';
import { parseScriptJson } from '../../../utils/scriptUtils';
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

describe('ScriptCharactersModal role ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('flows each team down the left column before the right column', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    const townsfolkColumns = screen.getAllByTestId('script-role-layout')[0];

    expect(townsfolkColumns).toHaveClass('columns-2');
    expect(townsfolkColumns).toHaveTextContent('MayorMonkChef');
    expect(screen.getByText('Mayor').closest('button')).toHaveClass('break-inside-avoid');
  });

  it('uses the same column flow when characters are not grouped by type', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    fireEvent.click(screen.getByLabelText('View settings'));
    fireEvent.click(document.getElementById('script-group-by-type-checkbox')!);
    const columns = screen.getByTestId('script-role-layout');

    expect(columns).toHaveClass('columns-2');
    expect(columns).toHaveTextContent('LeviathanMayorMonkChef');
  });

  it('keeps the grid layout when two columns is switched off', () => {
    render(<ScriptCharactersModal {...baseProps} />);
    fireEvent.click(screen.getByLabelText('View settings'));
    fireEvent.click(document.getElementById('script-double-column-checkbox')!);
    const townsfolkGrid = screen.getAllByTestId('script-role-layout')[0];

    expect(townsfolkGrid).toHaveClass('grid', 'sm:grid-cols-1');
    expect(townsfolkGrid).not.toHaveClass('sm:columns-2');
    expect(screen.getByText('Mayor').closest('button')).not.toHaveClass('break-inside-avoid');
  });
});

describe('ScriptCharactersModal Fabled and Lorics', () => {
  const loreRoles = parseScriptJson(['chef', 'angel', 'bigwig', 'bootlegger'], 'Test').loreRoles;
  const loreProps = { ...baseProps, scriptLoricRoles: loreRoles };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const enableLore = () => {
    fireEvent.click(screen.getByLabelText('View settings'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Fabled/Lorics' }));
  };

  it('shows only script lore when enabled and remembers the setting', () => {
    const { unmount } = render(<ScriptCharactersModal {...loreProps} />);
    expect(screen.queryByText('Angel')).not.toBeInTheDocument();
    expect(screen.queryByText('Bootlegger')).not.toBeInTheDocument();
    enableLore();
    for (const role of loreRoles) {
      expect(screen.getByText(role.name).closest('button')).toBeInTheDocument();
    }
    expect(screen.queryByText('Buddhist')).not.toBeInTheDocument();
    expect(screen.queryByText('Gardener')).not.toBeInTheDocument();
    expect(localStorage.getItem('botc-script-show-fabled-lorics')).toBe('true');
    unmount();
    render(<ScriptCharactersModal {...loreProps} />);
    expect(screen.getByText('Angel')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('View settings'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Fabled/Lorics' }));
    expect(screen.queryByText('Angel')).not.toBeInTheDocument();
    expect(screen.queryByText('Bootlegger')).not.toBeInTheDocument();
    expect(localStorage.getItem('botc-script-show-fabled-lorics')).toBe('false');
  });

  it('shows no lore for a script without Fabled or Lorics even when enabled', () => {
    localStorage.setItem('botc-script-show-fabled-lorics', 'true');
    render(<ScriptCharactersModal {...baseProps} />);
    expect(document.getElementById('script-fabled-section')).not.toBeInTheDocument();
    expect(document.getElementById('script-loric-section')).not.toBeInTheDocument();
  });

  it('displays the script author’s Bootlegger rules in the list and details', () => {
    const customRules = 'Players may nominate twice per day.';
    const script = parseScriptJson([{ id: '_meta', name: 'Rules', bootlegger: [customRules] }, 'chef', 'bootlegger'], 'Rules');
    localStorage.setItem('botc-script-show-fabled-lorics', 'true');
    localStorage.setItem('botc-script-show-detail', 'true');
    render(<ScriptCharactersModal {...baseProps} roles={script.roles} scriptLoricRoles={script.loreRoles} />);
    expect(document.getElementById('script-loric-section')).toHaveTextContent(customRules);
    fireEvent.click(screen.getByText('Bootlegger'));
    expect(within(document.getElementById('script-character-details-modal')!).getByText(customRules)).toBeInTheDocument();
  });

  it.each([true, false])('places Fabled and Lorics between Travelers and Jinxes (grouped: %s)', (grouped) => {
    localStorage.setItem('botc-script-group-by-type', String(grouped));
    localStorage.setItem('botc-script-list-jinxes', 'true');
    localStorage.setItem('botc-script-show-fabled-lorics', 'true');
    render(<ScriptCharactersModal {...loreProps} roles={[...roles, { id: 'beggar', name: 'Beggar', team: 'traveler' }]} />);
    const traveler = screen.getByText('Beggar');
    const fabled = document.getElementById('script-fabled-section')!;
    const lorics = document.getElementById('script-loric-section')!;
    const jinxes = document.getElementById('script-jinxes-section')!;
    expect(traveler.compareDocumentPosition(fabled) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(fabled.compareDocumentPosition(lorics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lorics.compareDocumentPosition(jinxes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('searches lore by name and type without incorrectly showing the empty state', () => {
    render(<ScriptCharactersModal {...loreProps} />);
    enableLore();
    const search = screen.getByPlaceholderText('Search by name or type');
    fireEvent.change(search, { target: { value: 'angel' } });
    expect(screen.getByText('Angel')).toBeInTheDocument();
    expect(screen.queryByText('Bootlegger')).not.toBeInTheDocument();
    expect(screen.queryByText('No matching characters found.')).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'loric' } });
    expect(screen.getByText('Bootlegger')).toBeInTheDocument();
    expect(document.getElementById('script-fabled-section')).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'no such character' } });
    expect(screen.getByText('No matching characters found.')).toBeInTheDocument();
  });

  it('sorts lore alphabetically and keeps it visible with the in-play filter', () => {
    localStorage.setItem('botc-script-show-fabled-lorics', 'true');
    localStorage.setItem('botc-sort-alphabetically', 'true');
    localStorage.setItem('botc-script-in-play-only', 'true');
    render(<ScriptCharactersModal {...loreProps} isStoryteller players={[]} />);
    const lorics = within(document.getElementById('script-loric-section')!);
    const names = lorics.getAllByRole('button').map(button => within(button).getByText(/.+/).textContent!);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(lorics.getByText('Bootlegger')).toBeInTheDocument();
    expect(screen.queryByText('No matching characters found.')).not.toBeInTheDocument();
  });

  it.each(['Angel', 'Bootlegger'])('opens ability details for %s', (name) => {
    render(<ScriptCharactersModal {...loreProps} />);
    enableLore();
    fireEvent.click(screen.getByText(name));
    const details = within(document.getElementById('script-character-details-modal')!);
    const role = ALL_ROLES.find(role => role.name === name)!;
    expect(details.getByText(role.ability!)).toBeInTheDocument();
    expect(details.getByText(role.team, { selector: 'span' })).toBeInTheDocument();
  });
});
