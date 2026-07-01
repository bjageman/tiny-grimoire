import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import GamePhase from './GamePhase';
import type { Player } from '../../types';

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
  });

  it('renders active script button with correct counts', () => {
    render(<GamePhase {...defaultProps} />);

    const scriptButton = screen.getByText(/All Roles/i).closest('button');
    expect(scriptButton).toBeInTheDocument();
  });

  it('opens modal on script button click and displays active characters sorted by team', () => {
    render(<GamePhase {...defaultProps} />);

    const scriptButton = screen.getByText(/All Roles/i).closest('button');
    fireEvent.click(scriptButton!);

    expect(screen.getByRole('heading', { name: /All Roles/i })).toBeInTheDocument();

    const modalContainer = screen.getByPlaceholderText('Search character by name or type...').closest('.max-w-2xl') as HTMLElement;
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

    const scriptButton = screen.getByText(/All Roles/i).closest('button');
    fireEvent.click(scriptButton!);

    const modalContainer = screen.getByPlaceholderText('Search character by name or type...').closest('.max-w-2xl') as HTMLElement;
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
