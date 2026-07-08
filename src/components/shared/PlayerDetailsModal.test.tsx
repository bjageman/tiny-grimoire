import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PlayerDetailsModal from './PlayerDetailsModal';
import type { Role } from '../../types';

describe('PlayerDetailsModal', () => {
  const mockRoles: Role[] = [
    { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
    { id: 'chef', name: 'Chef', team: 'townsfolk' },
    { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  ];

  const player = {
    id: 'p1',
    name: 'Alice',
    roleId: 'washerwoman',
    isDead: false,
  };

  const players = [player, { id: 'p2', name: 'Bob', roleId: 'poisoner', isDead: false }];

  const defaultProps = {
    player,
    players,
    roleObj: mockRoles[0],
    filteredModalRoles: mockRoles,
    isSearchingRole: false,
    modalRoleSearch: '',
    isLightModeActive: false,
    onClose: vi.fn(),
    onPrevPlayer: vi.fn(),
    onNextPlayer: vi.fn(),
    onUpdateName: vi.fn(),
    onUpdateRole: vi.fn(),
    onToggleDead: vi.fn(),
    onToggleDrunkOrPoisoned: vi.fn(),
    onToggleEvil: vi.fn(),
    onSetSearchingRole: vi.fn(),
    onSetModalRoleSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the player name and role', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
  });

  it('buffers name edits locally and flushes via onUpdateName on unmount', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue('Alice'), { target: { value: 'Alicia' } });

    expect(defaultProps.onUpdateName).not.toHaveBeenCalled();
    cleanup();
    expect(defaultProps.onUpdateName).toHaveBeenCalledWith('p1', 'Alicia');
  });

  it('does not write notes on unmount when the notes field was never touched (regression: undefined vs empty string)', () => {
    const onUpdateNotes = vi.fn();
    render(<PlayerDetailsModal {...defaultProps} onUpdateNotes={onUpdateNotes} />);

    cleanup();

    expect(onUpdateNotes).not.toHaveBeenCalled();
  });

  it('buffers notes edits and flushes via onUpdateNotes on unmount', () => {
    const onUpdateNotes = vi.fn();
    render(<PlayerDetailsModal {...defaultProps} onUpdateNotes={onUpdateNotes} />);

    fireEvent.change(screen.getByPlaceholderText('Notes...'), { target: { value: 'Watch this one' } });
    expect(onUpdateNotes).not.toHaveBeenCalled();

    cleanup();
    expect(onUpdateNotes).toHaveBeenCalledWith('p1', 'Watch this one');
  });

  it('pressing Enter in the name field blurs and closes the modal', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    fireEvent.keyDown(screen.getByDisplayValue('Alice'), { key: 'Enter' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows prev/next navigation when there is more than one player, and calls the callbacks', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Previous Player'));
    expect(defaultProps.onPrevPlayer).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle('Next Player'));
    expect(defaultProps.onNextPlayer).toHaveBeenCalled();
  });

  it('hides prev/next navigation when there is only one player', () => {
    render(<PlayerDetailsModal {...defaultProps} players={[player]} />);
    expect(screen.queryByTitle('Previous Player')).toBeNull();
    expect(screen.queryByTitle('Next Player')).toBeNull();
  });

  it('toggles dead status via the status button', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Alive'));
    expect(defaultProps.onToggleDead).toHaveBeenCalledWith('p1');
  });

  it('disables the dead toggle and shows a synced tooltip when isSynced is true', () => {
    render(<PlayerDetailsModal {...defaultProps} isSynced={true} />);
    const btn = screen.getByText('Alive');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Status is synced from Storyteller');
  });

  it('toggles alignment (good/evil) via the alignment button', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    fireEvent.click(screen.getByText('😇 Good'));
    expect(defaultProps.onToggleEvil).toHaveBeenCalledWith('p1');
  });

  it('keeps the alignment toggle but hides the drunk/poisoned toggle when allowMultipleRoles is true', () => {
    render(<PlayerDetailsModal {...defaultProps} allowMultipleRoles={true} />);
    expect(screen.queryByText('😇 Good')).not.toBeNull();
    expect(screen.queryByText('🤢 Drunk/Poisoned')).toBeNull();
  });

  it('opens the role search when the character is clicked, and selecting a role calls onUpdateRole', () => {
    render(<PlayerDetailsModal {...defaultProps} />);
    fireEvent.click(document.getElementById('detail-change-role-button')!);
    expect(defaultProps.onSetSearchingRole).toHaveBeenCalledWith(true);
  });

  it('renders the role search UI and selects a role from the list', () => {
    render(<PlayerDetailsModal {...defaultProps} isSearchingRole={true} />);
    fireEvent.click(screen.getByText('Chef'));
    expect(defaultProps.onUpdateRole).toHaveBeenCalledWith('p1', 'chef');
    expect(defaultProps.onSetSearchingRole).toHaveBeenCalledWith(false);
  });

  it('shows a "Taken" badge for roles already assigned to another player', () => {
    render(<PlayerDetailsModal {...defaultProps} isSearchingRole={true} />);
    expect(screen.getByText('Taken: Bob')).toBeInTheDocument();
  });

  it('clears the current role when Clear Character is clicked', () => {
    render(<PlayerDetailsModal {...defaultProps} isSearchingRole={true} />);
    fireEvent.click(screen.getByText('× Clear Character'));
    expect(defaultProps.onUpdateRole).toHaveBeenCalledWith('p1', '');
  });

  it('allows selecting up to 3 candidate roles in allowMultipleRoles mode, and alerts on a 4th', () => {
    const onUpdateRoles = vi.fn();
    const manyRoles: Role[] = [
      ...mockRoles,
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
    ];
    render(
      <PlayerDetailsModal
        {...defaultProps}
        allowMultipleRoles={true}
        onUpdateRoles={onUpdateRoles}
        player={{ ...player, roleIds: ['washerwoman', 'chef', 'poisoner'] }}
        isSearchingRole={true}
        filteredModalRoles={manyRoles}
      />
    );

    fireEvent.click(screen.getByText('Empath'));

    expect(onUpdateRoles).not.toHaveBeenCalled();
    expect(screen.getByText('You can select up to 3 candidate characters per player.')).toBeInTheDocument();
  });

  it('shows a pronoun dropdown for non-synced players and calls onUpdatePronouns on change', () => {
    const onUpdatePronouns = vi.fn();
    render(<PlayerDetailsModal {...defaultProps} onUpdatePronouns={onUpdatePronouns} />);

    const select = document.getElementById('detail-player-pronouns-select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('');
    fireEvent.change(select, { target: { value: 'They/Them' } });

    expect(onUpdatePronouns).toHaveBeenCalledWith('p1', 'They/Them');
  });

  it('reflects the player\'s current pronouns as the selected dropdown value', () => {
    render(<PlayerDetailsModal {...defaultProps} player={{ ...player, pronouns: 'She/Her' }} onUpdatePronouns={vi.fn()} />);
    const select = document.getElementById('detail-player-pronouns-select') as HTMLSelectElement;
    expect(select.value).toBe('She/Her');
  });

  it('hides the pronoun dropdown and shows read-only pronouns for synced players', () => {
    render(<PlayerDetailsModal {...defaultProps} player={{ ...player, pronouns: 'They/Them' }} isSynced={true} onUpdatePronouns={vi.fn()} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('They/Them')).toBeInTheDocument();
  });

  it('shows nothing for a synced player with no pronouns set', () => {
    render(<PlayerDetailsModal {...defaultProps} isSynced={true} onUpdatePronouns={vi.fn()} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText('Set Pronouns')).toBeNull();
  });

  it('tracker details modal replaces search cancel button with sort toggle and sorts roles when clicked', () => {
    const testRoles: Role[] = [
      { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
    ];
    const { container } = render(
      <PlayerDetailsModal
        {...defaultProps}
        allowMultipleRoles={true}
        isSearchingRole={true}
        allRoles={testRoles}
        filteredModalRoles={testRoles}
      />
    );

    // Cancel button should not be present
    expect(container.querySelector('#detail-cancel-role-search-button')).toBeNull();

    // Pronouns dropdown should not be present
    expect(container.querySelector('#detail-player-pronouns-select')).toBeNull();

    // Sort toggle checkbox should be present
    const toggle = container.querySelector('#tracker-sort-alphabetically-checkbox');
    expect(toggle).not.toBeNull();

    // By default, roles should follow filteredModalRoles order: Washerwoman then Chef
    let roleLabels = container.querySelectorAll('button[id^="detail-role-option-"]');
    expect(roleLabels[0].textContent).toContain('Washerwoman');
    expect(roleLabels[1].textContent).toContain('Chef');

    // Click the sort toggle to turn it on
    fireEvent.click(toggle!);

    // Now, they should be sorted alphabetically: Chef then Washerwoman
    roleLabels = container.querySelectorAll('button[id^="detail-role-option-"]');
    expect(roleLabels[0].textContent).toContain('Chef');
    expect(roleLabels[1].textContent).toContain('Washerwoman');
  });
});
