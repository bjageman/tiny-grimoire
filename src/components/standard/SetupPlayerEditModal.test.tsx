import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SetupPlayerEditModal from './SetupPlayerEditModal';
import type { Player, Role } from '../../types';

describe('SetupPlayerEditModal', () => {
  const scriptRoles: Role[] = [
    { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
    { id: 'chef', name: 'Chef', team: 'townsfolk' },
    { id: 'imp', name: 'Imp', team: 'demon' },
    { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  ];

  const alice: Player = { id: 'p1', name: 'Alice', roleId: 'washerwoman', isDead: false };
  const bob: Player = { id: 'p2', name: 'Bob', roleId: 'imp', isDead: false };
  const charlie: Player = { id: 'p3', name: 'Charlie', roleId: 'chef', isDead: false };
  const dave: Player = { id: 'p4', name: 'Dave', roleId: 'empath', isDead: false };

  const defaultProps = {
    activePlayerId: 'p1',
    players: [alice, bob, charlie, dave],
    customScriptRoles: null,
    selectionRoles: scriptRoles,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    isLightModeActive: false,
    updatePlayerName: vi.fn(),
    updatePlayerRole: vi.fn(),
    removePlayer: vi.fn(),
    togglePlayerTheDrunk: vi.fn(),
    togglePlayerTheMarionette: vi.fn(),
    togglePlayerTheLunatic: vi.fn(),
    togglePlayerTheLilMonsta: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the name input and role search', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search character name...')).toBeInTheDocument();
  });

  it('buffers name edits locally and flushes via updatePlayerName on unmount', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue('Alice'), { target: { value: 'Alicia' } });

    expect(defaultProps.updatePlayerName).not.toHaveBeenCalled();
    cleanup();
    expect(defaultProps.updatePlayerName).toHaveBeenCalledWith('p1', 'Alicia');
  });

  it('pressing Enter in the name field blurs and closes the modal', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    fireEvent.keyDown(screen.getByDisplayValue('Alice'), { key: 'Enter' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls removePlayer and onClose when the trash button is clicked', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Remove player'));
    expect(defaultProps.removePlayer).toHaveBeenCalledWith('p1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when Close is clicked', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('selecting a role calls updatePlayerRole with the active player id and closes the modal', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Chef'));
    expect(defaultProps.updatePlayerRole).toHaveBeenCalledWith('p1', 'chef');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('clicking the role the player already has deselects it', () => {
    const { container } = render(<SetupPlayerEditModal {...defaultProps} />);
    fireEvent.click(container.querySelector('#role-option-washerwoman')!);
    expect(defaultProps.updatePlayerRole).toHaveBeenCalledWith('p1', '');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('badges a role taken by another player with just that player name', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows The Drunk toggle for a Townsfolk player and calls togglePlayerTheDrunk', () => {
    render(<SetupPlayerEditModal {...defaultProps} />);
    const drunkBtn = screen.getByText('The Drunk');
    expect(drunkBtn).toBeInTheDocument();
    fireEvent.click(drunkBtn);
    expect(defaultProps.togglePlayerTheDrunk).toHaveBeenCalledWith('p1');
  });

  it('hides The Drunk toggle for a non-Townsfolk player', () => {
    render(<SetupPlayerEditModal {...defaultProps} activePlayerId="p2" />);
    expect(screen.queryByText('The Drunk')).toBeNull();
  });

  it('disables The Drunk toggle when another player is already the Drunk', () => {
    render(
      <SetupPlayerEditModal
        {...defaultProps}
        players={[alice, bob, { ...charlie, isTheDrunk: true }]}
      />
    );
    expect(screen.getByText('The Drunk')).toBeDisabled();
  });

  it('shows The Lunatic toggle only for a Demon player', () => {
    render(<SetupPlayerEditModal {...defaultProps} activePlayerId="p2" />);
    expect(screen.getByText('The Lunatic')).toBeInTheDocument();
    fireEvent.click(screen.getByText('The Lunatic'));
    expect(defaultProps.togglePlayerTheLunatic).toHaveBeenCalledWith('p2');
  });

  it('shows The Marionette toggle for a good player seated next to the Demon', () => {
    // Seating order is Alice, Bob(demon), Charlie, Dave — Alice sits on Bob's other side.
    render(<SetupPlayerEditModal {...defaultProps} activePlayerId="p1" />);
    expect(screen.getByText('The Marionette')).toBeInTheDocument();
  });

  it('hides The Marionette toggle for a good player not seated next to the Demon', () => {
    render(<SetupPlayerEditModal {...defaultProps} activePlayerId="p4" />);
    expect(screen.queryByText('The Marionette')).toBeNull();
  });

  it('filters the role list by search term', () => {
    render(<SetupPlayerEditModal {...defaultProps} searchTerm="chef" />);
    expect(screen.getByText(/Chef/)).toBeInTheDocument();
    expect(screen.queryByText(/Washerwoman/)).toBeNull();
  });

  it('renders nothing when the active player cannot be found', () => {
    const { container } = render(<SetupPlayerEditModal {...defaultProps} activePlayerId="missing" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('never renders a solid-dark background class while in light mode', () => {
    const { container } = render(<SetupPlayerEditModal {...defaultProps} isLightModeActive={true} />);
    const modal = container.querySelector('#setup-player-edit-modal')!;
    expect(modal.className).not.toContain('bg-gray-900');
    expect(modal.className).toContain('bg-[#fdfaf2]');
  });

  it('uses the dark background class when light mode is off', () => {
    const { container } = render(<SetupPlayerEditModal {...defaultProps} isLightModeActive={false} />);
    const modal = container.querySelector('#setup-player-edit-modal')!;
    expect(modal.className).toContain('bg-gray-900');
  });

  it('enables inputs, toggles, and role buttons on secondary devices, and disables delete entirely', () => {
    const { container } = render(
      <SetupPlayerEditModal
        {...defaultProps}
        isSecondary={true}
      />
    );

    // Delete button is disabled
    expect(container.querySelector('#remove-player-button')).toBeDisabled();

    // Inputs, toggles, role buttons are enabled
    expect(screen.getByDisplayValue('Alice')).not.toBeDisabled();
    expect(container.querySelector('#toggle-drunk-button-p1')).not.toBeDisabled();
    
    const roleOptions = container.querySelectorAll('button[id^="role-option-"]');
    expect(roleOptions.length).toBeGreaterThan(0);
    roleOptions.forEach(btn => {
      expect(btn).not.toBeDisabled();
    });
  });

  describe('"Bag only" filter', () => {
    const bagProps = {
      ...defaultProps,
      selectedCharacterIds: new Set(['chef', 'imp']),
      setBagOnly: vi.fn(),
    };

    it('is hidden when no characters have been selected for the bag', () => {
      const { container } = render(
        <SetupPlayerEditModal {...bagProps} selectedCharacterIds={new Set()} />
      );
      expect(container.querySelector('#bag-only-filter')).not.toBeInTheDocument();
    });

    it('shows every role when the filter is off', () => {
      const { container } = render(<SetupPlayerEditModal {...bagProps} bagOnly={false} />);
      expect(container.querySelector('#bag-only-filter-checkbox')).not.toBeChecked();
      expect(container.querySelector('#role-option-poisoner')).toBeInTheDocument();
      expect(container.querySelector('#role-option-chef')).toBeInTheDocument();
    });

    it('shows only characters in the bag when the filter is on', () => {
      const { container } = render(<SetupPlayerEditModal {...bagProps} bagOnly={true} />);
      expect(container.querySelector('#bag-only-filter-checkbox')).toBeChecked();
      expect(container.querySelector('#role-option-chef')).toBeInTheDocument();
      expect(container.querySelector('#role-option-imp')).toBeInTheDocument();
      expect(container.querySelector('#role-option-poisoner')).not.toBeInTheDocument();
    });

    it("keeps the player's current role visible even when it is not in the bag", () => {
      const { container } = render(<SetupPlayerEditModal {...bagProps} bagOnly={true} />);
      expect(container.querySelector('#role-option-washerwoman')).toBeInTheDocument();
    });

    it('reports toggling back to the parent', () => {
      const { container } = render(<SetupPlayerEditModal {...bagProps} bagOnly={false} />);
      fireEvent.click(container.querySelector('#bag-only-filter-checkbox')!);
      expect(bagProps.setBagOnly).toHaveBeenCalledWith(true);
    });
  });
});
