import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WhaleBucketPlayerPreferenceModal from './PlayerPreferenceModal';
import type { Player } from '../../WhaleBucket';

describe('WhaleBucketPlayerPreferenceModal', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Player One',
      preferences: {
        townsfolk: ['washerwoman'],
        outsider: [],
        minion: [],
        demon: [],
        traveler: [],
      },
      isDead: false,
    },
  ];

  const defaultProps = {
    activePlayerId: '1',
    players: mockPlayers,
    setPlayers: vi.fn(),
    allowTravelers: false,
    excludedRoleIds: [],
    updatePlayerName: vi.fn(),
    removePlayer: vi.fn(),
    togglePreference: vi.fn(),
    autoFillPlayerPreferences: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the overview with name input and a row per team', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);

    expect(screen.getByDisplayValue('Player One')).toBeInTheDocument();
    expect(screen.getByText('Townsfolk')).toBeInTheDocument();
    expect(screen.getByText('Outsider')).toBeInTheDocument();
    expect(screen.getByText('Minion')).toBeInTheDocument();
    expect(screen.getByText('Demon')).toBeInTheDocument();
    expect(screen.queryByText('Traveler')).not.toBeInTheDocument();
    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
  });

  it('shows the traveler row when allowTravelers is true', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} allowTravelers={true} />);
    expect(screen.getByText('Traveler')).toBeInTheDocument();
  });

  it('buffers name edits locally and flushes via updatePlayerName when the modal closes', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue('Player One'), { target: { value: 'Renamed' } });

    // Not written immediately — only buffered locally
    expect(defaultProps.updatePlayerName).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Renamed')).toBeInTheDocument();

    // Flushed once the modal unmounts (e.g. on close)
    cleanup();
    expect(defaultProps.updatePlayerName).toHaveBeenCalledWith('1', 'Renamed');
  });

  it('calls removePlayer and onClose when the trash button is clicked', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Remove player'));
    expect(defaultProps.removePlayer).toHaveBeenCalledWith('1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls autoFillPlayerPreferences when the shuffle button is clicked', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Auto-fill remaining preferences'));
    expect(defaultProps.autoFillPlayerPreferences).toHaveBeenCalledWith('1');
  });

  it('opens the team picker, filters by team, and selects a role', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Townsfolk'));

    expect(screen.getByText('Select Townsfolk')).toBeInTheDocument();
    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.queryByText('Poisoner')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Chef'));

    expect(defaultProps.togglePreference).toHaveBeenCalledWith('1', 'townsfolk', 'chef');
    // Returns to the overview after picking
    expect(screen.queryByText('Select Townsfolk')).not.toBeInTheDocument();
  });

  it('filters the picker list by search term', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Townsfolk'));

    fireEvent.change(screen.getByPlaceholderText('Search character name...'), { target: { value: 'chef' } });

    expect(screen.getByText('Chef')).toBeInTheDocument();
    expect(screen.queryByText('Washerwoman')).not.toBeInTheDocument();
  });

  it('returns to the overview when Back is clicked', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Townsfolk'));
    expect(screen.getByText('Select Townsfolk')).toBeInTheDocument();

    fireEvent.click(screen.getByText('← Back'));
    expect(screen.queryByText('Select Townsfolk')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Player One')).toBeInTheDocument();
  });

  it('clears the preference for that team when Clear Selection is clicked', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Townsfolk'));
    fireEvent.click(screen.getByText('Clear Selection'));

    expect(defaultProps.setPlayers).toHaveBeenCalled();
    const updateFn = defaultProps.setPlayers.mock.calls[0][0];
    const updatedPlayers = updateFn(mockPlayers);
    expect(updatedPlayers[0].preferences.townsfolk).toEqual([]);
  });

  it('selects a random role when Select Random is clicked', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Townsfolk'));
    fireEvent.click(screen.getByText('Select Random'));

    expect(defaultProps.setPlayers).toHaveBeenCalled();
    // Returns to the overview after picking
    expect(screen.queryByText('Select Townsfolk')).not.toBeInTheDocument();
  });

  it('calls onClose when Close is clicked', () => {
    render(<WhaleBucketPlayerPreferenceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
