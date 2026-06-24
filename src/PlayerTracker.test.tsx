import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlayerTracker from './PlayerTracker';

let mockOnMessageCallback: (data: unknown) => void = () => {};

vi.mock('./hooks/useGameSocket', () => {
  return {
    useGameSocket: vi.fn((gameCode, onMessage) => {
      mockOnMessageCallback = onMessage;
      return { isConnected: !!gameCode, sendMessage: vi.fn() };
    })
  };
});

describe('PlayerTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders setup phase and allows adding players', () => {
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    expect(screen.getByText('Character Tracker')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter player name in seating order...')).toBeInTheDocument();
    expect(screen.getByText('Start Game Tracker').closest('button')).toBeDisabled();

    // Add a player
    const input = screen.getByPlaceholderText('Enter player name in seating order...');
    const addButton = screen.getByRole('button', { name: '' }); // the Plus icon button
    
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addButton);

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByText('Start Game Tracker').closest('button')).not.toBeDisabled();
  });

  it('transitions to game phase and displays players in circle with blank characters', () => {
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    const input = screen.getByPlaceholderText('Enter player name in seating order...');
    const addButton = screen.getByRole('button', { name: '' });

    // Add 5 players
    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    names.forEach(name => {
      fireEvent.change(input, { target: { value: name } });
      fireEvent.click(addButton);
    });

    // Start tracking
    const startButton = screen.getByText('Start Game Tracker');
    fireEvent.click(startButton);

    // Verify we are in game phase
    expect(screen.getByText(/night 1/i)).toBeInTheDocument();
    expect(screen.getAllByText('Alice')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bob')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Charlie')[0]).toBeInTheDocument();
    expect(screen.getAllByText('David')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Eve')[0]).toBeInTheDocument();

    // Verify all players start with blank/question-mark roles in tokens
    // (Since role is unset, only the player names are rendered on the token)
    expect(screen.queryByText('Washerwoman')).toBeNull();
    expect(screen.queryByText('Imp')).toBeNull();
  });

  it('blocks rearrangement and syncs player deaths when synced to a game code', () => {
    // 1. Setup session storage with a code to simulate synced state
    sessionStorage.setItem('joined-code', 'TEST');
    
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    // 2. Verify setup form is hidden and seating sync notice is shown
    expect(screen.queryByPlaceholderText('Enter player name in seating order...')).toBeNull();
    expect(screen.getByText(/seating arrangement and player list are synced/i)).toBeInTheDocument();

    // 3. Simulating storyteller broadcasting the players list
    act(() => {
      mockOnMessageCallback({
        type: 'setup_update',
        players: [
          { id: '1', name: 'Alice', isDead: false },
          { id: '2', name: 'Bob', isDead: false }
        ],
        scriptName: 'Trouble Brewing'
      });
    });

    // Verify players are displayed
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();

    // Verify player names are read-only/disabled
    expect(screen.getByDisplayValue('Alice')).toBeDisabled();
    expect(screen.getByDisplayValue('Bob')).toBeDisabled();

    // Verify drag handle / grip icons are not in the document
    expect(screen.queryByTitle('Drag to seat player')).toBeNull();
    expect(screen.queryByTitle('Move player up')).toBeNull();
    expect(screen.queryByTitle('Move player down')).toBeNull();
    expect(screen.queryByTitle('Remove Player')).toBeNull();

    // 4. Start the tracker game phase
    const startButton = screen.getByText('Start Game Tracker');
    fireEvent.click(startButton);

    // Verify time/dead resets are not passed/rendered
    expect(screen.queryByTitle('Reset back to Night 1')).toBeNull();
    expect(screen.queryByTitle('Mark everyone as alive')).toBeNull();

    // Simulating storyteller updating time of day and killing Bob
    act(() => {
      mockOnMessageCallback({
        type: 'game_update',
        players: [
          { id: '1', name: 'Alice', isDead: false },
          { id: '2', name: 'Bob', isDead: true, hasDeadVote: true }
        ],
        timeOfDay: 'day',
        dayNumber: 2
      });
    });

    // Verify Bob is dead
    expect(screen.getByText(/day 2/i)).toBeInTheDocument();
    
    // Open Bob details and verify dead/alive status and vote toggles are disabled
    const bobRow = document.getElementById('ledger-player-2');
    fireEvent.click(bobRow!);

    const deadToggle = screen.getByRole('button', { name: 'Dead' });
    expect(deadToggle).toBeDisabled();

    const voteToggle = screen.getByRole('button', { name: /vote: active/i });
    expect(voteToggle).toBeDisabled();
  });
});
