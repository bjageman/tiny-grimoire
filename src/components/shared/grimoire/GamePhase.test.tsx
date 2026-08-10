import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import GamePhase from './GamePhase';
import type { Player } from '../../../types';

describe('GamePhase - Script Modal Integration', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Alice',
      roleId: 'washerwoman',
      isDead: false,
    },
    {
      id: '2',
      name: 'Bob',
      roleId: 'poisoner',
      isDead: false,
    },
  ];

  const defaultProps = {
    players: mockPlayers,
    timeOfDay: 'night' as const,
    dayNumber: 1,
    newTravelerName: '',
    newTravelerRoleId: 'beggar',
    isLightModeActive: false,
    draggedIndex: null,
    dragOverIndex: null,
    handleMouseDown: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    setSelectedPlayerId: vi.fn(),
    toggleTimeOfDay: vi.fn(),
    addTravelerGamePhase: vi.fn(),
    setNewTravelerName: vi.fn(),
    setNewTravelerRoleId: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const openScriptModal = () => {
    fireEvent.click(document.getElementById('game-script-button')!);
    return within(screen.getByPlaceholderText('Search by name or type').closest('.max-w-2xl') as HTMLElement);
  };

  it('hides the in-play filter from players', () => {
    render(<GamePhase {...defaultProps} />);
    openScriptModal();
    fireEvent.click(screen.getByLabelText('View settings'));

    expect(document.getElementById('script-in-play-only-checkbox')).not.toBeInTheDocument();
  });

  it('lets a storyteller narrow the script to the characters in play', () => {
    render(<GamePhase {...defaultProps} isStoryteller />);
    let modal = openScriptModal();

    // The full script lists characters nobody is assigned.
    expect(modal.getByText('Chef')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('View settings'));
    fireEvent.click(document.getElementById('script-in-play-only-checkbox')!);

    modal = within(screen.getByPlaceholderText('Search by name or type').closest('.max-w-2xl') as HTMLElement);
    expect(modal.getByText('Washerwoman')).toBeInTheDocument();
    expect(modal.getByText('Poisoner')).toBeInTheDocument();
    expect(modal.queryByText('Chef')).not.toBeInTheDocument();
  });

  it('counts both the shown role and the token a player carries as in play', () => {
    const drunkTownCrier: Player[] = [
      { id: '1', name: 'Alice', roleId: 'towncrier', isTheDrunk: true, isDead: false },
    ];
    render(<GamePhase {...defaultProps} players={drunkTownCrier} isStoryteller />);
    openScriptModal();

    fireEvent.click(screen.getByLabelText('View settings'));
    fireEvent.click(document.getElementById('script-in-play-only-checkbox')!);

    const modal = within(screen.getByPlaceholderText('Search by name or type').closest('.max-w-2xl') as HTMLElement);
    expect(modal.getByText('Town Crier')).toBeInTheDocument();
    expect(modal.getByText('Drunk')).toBeInTheDocument();
    expect(modal.queryByText('Chef')).not.toBeInTheDocument();
  });

  it('renders active script button with correct counts', () => {
    render(<GamePhase {...defaultProps} />);

    const scriptButton = document.getElementById('game-script-button');
    expect(scriptButton).toBeInTheDocument();
  });

  it('opens modal on script button click and displays active characters sorted by team', () => {
    render(<GamePhase {...defaultProps} />);

    const scriptButton = document.getElementById('game-script-button');
    fireEvent.click(scriptButton!);

    expect(screen.getByRole('heading', { name: /All Roles/i })).toBeInTheDocument();

    const modalContainer = screen.getByPlaceholderText('Search by name or type').closest('.max-w-2xl') as HTMLElement;
    const modal = within(modalContainer);

    expect(modal.getByText(/Townsfolk/i)).toBeInTheDocument();
    expect(modal.getByText('Washerwoman')).toBeInTheDocument();

    expect(modal.getByText(/Minions/i)).toBeInTheDocument();
    expect(modal.getByText('Poisoner')).toBeInTheDocument();

    expect(modal.getByText(/Demons/i)).toBeInTheDocument();
    expect(modal.getByText(/Outsiders/i)).toBeInTheDocument();
  });

  it('opens character details modal when character is clicked', () => {
    render(<GamePhase {...defaultProps} />);

    const scriptButton = document.getElementById('game-script-button');
    fireEvent.click(scriptButton!);

    const modalContainer = screen.getByPlaceholderText('Search by name or type').closest('.max-w-2xl') as HTMLElement;
    const modal = within(modalContainer);

    const washerwomanBtn = modal.getByText('Washerwoman').closest('button');
    expect(washerwomanBtn).toBeInTheDocument();
    fireEvent.click(washerwomanBtn!);

    expect(screen.getByText('townsfolk', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('You start knowing that 1 of 2 players is a particular Townsfolk.')).toBeInTheDocument();

    const closeBtn = screen.getByText('Close Details');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('You start knowing that 1 of 2 players is a particular Townsfolk.')).toBeNull();
    expect(screen.getByRole('heading', { name: /All Roles/i })).toBeInTheDocument();
  });
});

describe('GamePhase - Demon Bluffs candidate list', () => {
  const mockPlayers: Player[] = [
    { id: '1', name: 'Alice', roleId: 'washerwoman', isDead: false }, // assigned Townsfolk
    { id: '2', name: 'Bob', roleId: 'poisoner', isDead: false }, // assigned Minion
  ];

  const defaultProps = {
    players: mockPlayers,
    timeOfDay: 'night' as const,
    dayNumber: 1,
    newTravelerName: '',
    newTravelerRoleId: 'beggar',
    isLightModeActive: false,
    draggedIndex: null,
    dragOverIndex: null,
    handleMouseDown: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    setSelectedPlayerId: vi.fn(),
    toggleTimeOfDay: vi.fn(),
    addTravelerGamePhase: vi.fn(),
    setNewTravelerName: vi.fn(),
    setNewTravelerRoleId: vi.fn(),
    onUpdateDemonBluffs: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('by default, offers unassigned good roles but never evil roles already assigned to a player', () => {
    render(<GamePhase {...defaultProps} />);

    fireEvent.click(screen.getByText('Bluff 1…'));
    const picker = within(screen.getByPlaceholderText('Search roles...').parentElement!.parentElement!);

    // Washerwoman is Townsfolk but already assigned to Alice, so it's excluded by default.
    expect(picker.queryByText('Washerwoman')).toBeNull();
    // Drunk is an unassigned Outsider, so it's offered.
    expect(picker.getByText('Drunk')).toBeInTheDocument();
    // Poisoner is Minion/evil, so it's never offered, even though Bob is assigned to it.
    expect(picker.queryByText('Poisoner')).toBeNull();
  });

  it('checking "Lunatic Mode" offers assigned good roles too, but still excludes evil roles', () => {
    render(<GamePhase {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Lunatic Mode'));
    fireEvent.click(screen.getByText('Bluff 1…'));
    const picker = within(screen.getByPlaceholderText('Search roles...').parentElement!.parentElement!);

    // Now that the "already assigned" restriction is lifted, Washerwoman appears.
    expect(picker.getByText('Washerwoman')).toBeInTheDocument();
    // Evil roles are still never offered as bluffs.
    expect(picker.queryByText('Poisoner')).toBeNull();
  });
});

describe('GamePhase - Reset Reminders confirmation', () => {
  const mockPlayers: Player[] = [
    { id: '1', name: 'Alice', roleId: 'washerwoman', isDead: false },
  ];

  const defaultProps = {
    players: mockPlayers,
    timeOfDay: 'night' as const,
    dayNumber: 1,
    newTravelerName: '',
    newTravelerRoleId: 'beggar',
    isLightModeActive: false,
    draggedIndex: null,
    dragOverIndex: null,
    handleMouseDown: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    setSelectedPlayerId: vi.fn(),
    toggleTimeOfDay: vi.fn(),
    addTravelerGamePhase: vi.fn(),
    setNewTravelerName: vi.fn(),
    setNewTravelerRoleId: vi.fn(),
    isSynced: false,
    reminderTokens: [{ id: 'r1', sourceCharId: 'washerwoman', text: 'Townsfolk', targetPlayerId: '1' }],
    onSetReminderTokens: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for confirmation before clearing reminders, and only clears them once confirmed', () => {
    render(<GamePhase {...defaultProps} />);

    fireEvent.click(screen.getByText('Reminders'));

    // Not cleared yet — waiting on confirmation
    expect(defaultProps.onSetReminderTokens).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Reset Reminders' })).toBeInTheDocument();
    expect(screen.getByText('Remove all reminder tokens?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm'));

    expect(defaultProps.onSetReminderTokens).toHaveBeenCalledWith([]);
  });

  it('does not clear reminders when the confirmation is cancelled', () => {
    render(<GamePhase {...defaultProps} />);

    fireEvent.click(screen.getByText('Reminders'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onSetReminderTokens).not.toHaveBeenCalled();
  });

  it('greys out and disables declare winner buttons when isSecondary is true', () => {
    const onDeclareWinner = vi.fn();
    render(
      <GamePhase
        {...defaultProps}
        onDeclareWinner={onDeclareWinner}
        isSecondary={true}
      />
    );

    const goodWinsBtn = screen.getByRole('button', { name: /Good Wins/i });
    const evilWinsBtn = screen.getByRole('button', { name: /Evil Wins/i });

    expect(goodWinsBtn).toBeDisabled();
    expect(evilWinsBtn).toBeDisabled();
    expect(goodWinsBtn.className).toContain('opacity-50');
    expect(evilWinsBtn.className).toContain('opacity-50');
  });

  it('defaults the Grimoire Ledger Reference to collapsed, and expands/re-collapses on click', () => {
    render(<GamePhase {...defaultProps} />);

    const toggle = screen.getByRole('button', { name: /Grimoire Ledger Reference/i });
    const ledgerList = document.getElementById('ledger-player-1')!.parentElement!;

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(ledgerList.className).toContain('hidden');
    expect(ledgerList.className).toContain('md:grid');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(ledgerList.className).not.toContain('hidden');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(ledgerList.className).toContain('hidden');
  });

  describe('all reminders', () => {
    // Alice and Bob are in play; the Butler is on the script but assigned to nobody.
    const inPlay: Player[] = [
      { id: '1', name: 'Alice', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Bob', roleId: 'poisoner', isDead: false },
    ];

    const reminderProps = {
      ...defaultProps,
      players: inPlay,
      reminderTokens: [],
      onSetReminderTokens: vi.fn(),
    };

    const openPicker = () => {
      fireEvent.click(screen.getByTitle('Add reminder to Alice'));
      return within(document.getElementById('reminder-picker-modal')!);
    };

    it('offers only in-play characters by default', () => {
      render(<GamePhase {...reminderProps} />);
      const picker = openPicker();

      // The Washerwoman contributes two reminders, so its name appears once per option.
      expect(picker.getAllByText('Washerwoman').length).toBeGreaterThan(0);
      expect(picker.getByText('Poisoner')).toBeInTheDocument();
      expect(picker.queryByText('Butler')).toBeNull();
    });

    it('offers every character on the script when enabled', () => {
      render(<GamePhase {...reminderProps} includeAllScriptReminders />);
      const picker = openPicker();

      // Still lists the in-play ones, plus characters nobody is assigned.
      expect(picker.getByText('Poisoner')).toBeInTheDocument();
      expect(picker.getByText('Butler')).toBeInTheDocument();
      expect(picker.getByText('Monk')).toBeInTheDocument();
    });
  });

  describe('player labels', () => {
    const labelled: Player[] = [
      { id: '1', name: 'Alice', roleId: 'washerwoman', isDead: false, notes: 'Confirmed good' },
      { id: '2', name: 'Bob', roleId: 'poisoner', isDead: false },
    ];

    const labelEl = () => screen.getByText('Confirmed good');

    it('renders in a layer stacked above every seat', () => {
      render(<GamePhase {...defaultProps} players={labelled} alwaysShowNotes />);

      // Seats set their own inline z-index, so the label layer must sit outside them to stay on top.
      const layer = labelEl().closest('[style*="z-index"]') as HTMLElement;
      const layerZ = Number(layer.style.zIndex);
      const seatZs = Array.from(document.querySelectorAll<HTMLElement>('#grimoire-player-1, #grimoire-player-2'))
        .map(seat => Number(seat.closest<HTMLElement>('[style*="z-index"]')!.style.zIndex));

      expect(seatZs.length).toBe(2);
      seatZs.forEach(z => expect(layerZ).toBeGreaterThan(z));
    });

    it('is visible when alwaysShowNotes is on and hidden when off', () => {
      const { unmount } = render(<GamePhase {...defaultProps} players={labelled} alwaysShowNotes />);
      expect(labelEl().className).toContain('visible');
      expect(labelEl().className).not.toContain('invisible');
      unmount();

      render(<GamePhase {...defaultProps} players={labelled} />);
      expect(labelEl().className).toContain('invisible');
    });

    it('caps the rendered label length', () => {
      const long = 'x'.repeat(80);
      render(<GamePhase {...defaultProps} players={[{ ...labelled[0], notes: long }]} alwaysShowNotes />);

      expect(screen.getByText('x'.repeat(40))).toBeInTheDocument();
      expect(screen.queryByText(long)).toBeNull();
    });
  });
});
