import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlayerTracker from './PlayerTracker';

let mockOnMessageCallback: (data: unknown) => void = () => {};
let mockShareOnMessageCallback: (data: unknown) => void = () => {};
let mockIncomingShareOnMessageCallback: (data: unknown) => void = () => {};
let useGameSocketCallCount = 0;
const mockShareSendMessage = vi.fn();
const mockIncomingShareSendMessage = vi.fn();

// PlayerTracker calls useGameSocket three times per render, always in the
// same order: the real game socket, the notes-share sender socket, then the
// notes-share receiver socket. Track them by call parity rather than a
// single shared variable, since a later call would otherwise clobber an
// earlier one's callback.
vi.mock('./hooks/useGameSocket', () => {
  return {
    useGameSocket: vi.fn((gameCode, onMessage) => {
      useGameSocketCallCount++;
      switch (useGameSocketCallCount % 3) {
        case 1:
          mockOnMessageCallback = onMessage;
          return { isConnected: !!gameCode, sendMessage: vi.fn() };
        case 2:
          mockShareOnMessageCallback = onMessage;
          return { isConnected: !!gameCode, sendMessage: mockShareSendMessage };
        default:
          mockIncomingShareOnMessageCallback = onMessage;
          return { isConnected: !!gameCode, sendMessage: mockIncomingShareSendMessage };
      }
    })
  };
});

describe('PlayerTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    useGameSocketCallCount = 0;
  });

  it('renders setup phase and allows adding players', () => {
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    expect(screen.getByText('Game Notes')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter player name in seating order...')).toBeInTheDocument();
    expect(screen.getByText('Start Game').closest('button')).toBeDisabled();

    // Add a player
    const input = screen.getByPlaceholderText('Enter player name in seating order...');
    const addButton = screen.getByRole('button', { name: '' }); // the Plus icon button
    
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addButton);

    expect(screen.getAllByText('Alice')[0]).toBeInTheDocument();
    expect(screen.getByText('Start Game').closest('button')).not.toBeDisabled();
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
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);

    // Verify we are in game phase (badge appears in both mobile row and desktop grimoire)
    expect(screen.getAllByText(/night 1/i)[0]).toBeInTheDocument();
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
    expect(screen.getAllByText('Alice')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bob')[0]).toBeInTheDocument();

    // Verify player tokens are read-only: not draggable and clicking doesn't open the edit modal
    expect(document.querySelector('[data-drag-index="0"]')).toHaveAttribute('draggable', 'false');
    fireEvent.click(screen.getByTitle('Alice'));
    expect(screen.queryByText('Edit Player')).toBeNull();

    // Verify drag handle / grip icons are not in the document
    expect(screen.queryByTitle('Drag to seat player')).toBeNull();
    expect(screen.queryByTitle('Move player up')).toBeNull();
    expect(screen.queryByTitle('Move player down')).toBeNull();
    expect(screen.queryByTitle('Remove Player')).toBeNull();

    // 4. Start the tracker game phase
    const startButton = screen.getByText('Start Game');
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
    expect(screen.getAllByText(/day 2/i)[0]).toBeInTheDocument();
    
    // Open Bob details and verify dead/alive status and vote toggles are disabled
    const bobRow = document.getElementById('ledger-player-2');
    fireEvent.click(bobRow!);

    const deadToggle = screen.getByRole('button', { name: 'Dead' });
    expect(deadToggle).toBeDisabled();

    const voteToggle = screen.getByRole('button', { name: /vote: active/i });
    expect(voteToggle).toBeDisabled();
  });

  it('reverts to local tracker when storyteller_quit message is received', () => {
    sessionStorage.setItem('joined-code', 'TEST');

    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    expect(screen.getByText(/seating arrangement and player list are synced/i)).toBeInTheDocument();

    act(() => {
      mockOnMessageCallback({ type: 'storyteller_quit' });
    });

    // Dialog modal should show the message
    expect(screen.getByText('The Storyteller has quit the session. Reverting to local tracker.')).toBeInTheDocument();

    // Synced notice should disappear and input field should show again
    expect(screen.getByPlaceholderText('Enter player name in seating order...')).toBeInTheDocument();
    expect(screen.queryByText(/seating arrangement and player list are synced/i)).toBeNull();
  });

  it('shows a "Syncing with {code}" badge when synced, and disconnects (keeping local data) on confirm', () => {
    sessionStorage.setItem('joined-code', 'TEST');
    sessionStorage.setItem('joined-name', 'Alice');

    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    expect(screen.getAllByText(/Syncing with/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText('TEST')[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByTitle("Click to disconnect from the Storyteller's live game")[0]);

    expect(screen.getByText(/Disconnect from this synced session/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    // No longer synced — badge is gone, but local tracker (with its data) remains usable
    expect(screen.queryByText(/Syncing with/i)).toBeNull();
    expect(sessionStorage.getItem('joined-code')).toBeNull();
    expect(screen.getByPlaceholderText('Enter player name in seating order...')).toBeInTheDocument();
  });

  it('resets the tracker and returns to setup when clicking the reset button', () => {
    window.location.hash = '#/tracker';

    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    const resetButton = document.getElementById('reset-game-button');
    fireEvent.click(resetButton!);

    // Confirm modal should appear
    expect(screen.getByText('Are you sure you want to reset the tracker? This clears all players and settings.')).toBeInTheDocument();

    // Click Confirm
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(window.location.hash).toBe('#/tracker');
  });

  it('automatically rotates the grimoire so the joined player is at the bottom', () => {
    sessionStorage.setItem('joined-name', 'Charlie');

    const { container } = render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    // Add players and transition to game phase
    const input = screen.getByPlaceholderText('Enter player name in seating order...');
    const addButton = screen.getByRole('button', { name: '' });

    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    names.forEach(name => {
      fireEvent.change(input, { target: { value: name } });
      fireEvent.click(addButton);
    });

    // Start Game
    const startGameButton = screen.getByText('Start Game');
    fireEvent.click(startGameButton);

    // Simulate WebSocket sync message
    act(() => {
      mockOnMessageCallback({
        type: 'game_update',
        players: [
          { id: 'p-1', name: 'Alice', isDead: false, isDeadVoteUsed: false },
          { id: 'p-2', name: 'Bob', isDead: false, isDeadVoteUsed: false },
          { id: 'p-3', name: 'Charlie', isDead: false, isDeadVoteUsed: false },
          { id: 'p-4', name: 'David', isDead: false, isDeadVoteUsed: false },
          { id: 'p-5', name: 'Eve', isDead: false, isDeadVoteUsed: false },
        ],
        timeOfDay: 'day',
        dayNumber: 2,
      });
    });

    // Charlie (p-3) is the joined player, so he is seated at the bottom of the circle.
    // Players keep their order in the DOM, so the seat is read off the position.
    const seatOf = (id: string) => {
      const token = container.querySelector(`#grimoire-player-${id}`)!.closest('[style*="left"]') as HTMLElement;
      return { left: parseFloat(token.style.left), top: parseFloat(token.style.top) };
    };
    const ids = ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'];
    const charlie = seatOf('p-3');

    expect(charlie.left).toBeCloseTo(50, 1);
    ids.filter(id => id !== 'p-3').forEach(id => {
      expect(seatOf(id).top).toBeLessThan(charlie.top);
    });
  });

  it('allows toggling reminder tokens on and off via checkbox below notes', () => {
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    const input = screen.getByPlaceholderText('Enter player name in seating order...');
    const addButton = screen.getByRole('button', { name: '' });

    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    names.forEach(name => {
      fireEvent.change(input, { target: { value: name } });
      fireEvent.click(addButton);
    });

    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);

    // Verify checkbox is rendered and defaults to unchecked
    const checkbox = screen.getAllByLabelText('Turn on Reminder Tokens')[0] as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);

    // Toggle it on
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    // Verify "+" add-reminder button is now visible on player circles
    const firstPlayerAddBtn = screen.getByTitle('Add reminder to Alice');
    expect(firstPlayerAddBtn).toBeInTheDocument();

    // Toggle it off
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
    expect(screen.queryByTitle('Add reminder to Alice')).toBeNull();
  });

  it('shares initial setup (names + script) but no characters, status, or notes', () => {
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    const input = screen.getByPlaceholderText('Enter player name in seating order...');
    const addButton = screen.getByRole('button', { name: '' });

    ['Alice', 'Bob'].forEach(name => {
      fireEvent.change(input, { target: { value: name } });
      fireEvent.click(addButton);
    });

    fireEvent.click(screen.getByText('Start Game'));

    // Mark Bob dead and give him a private note — neither should leak to a recipient
    const bobRow = Array.from(document.querySelectorAll('[id^="ledger-player-"]'))
      .find(el => el.textContent?.includes('Bob'));
    fireEvent.click(bobRow!);
    fireEvent.click(screen.getByRole('button', { name: 'Alive' }));
    fireEvent.change(screen.getByPlaceholderText('Notes...'), { target: { value: 'Secretly the Imp' } });

    // Someone opening the share link requests the initial setup once
    act(() => {
      mockShareOnMessageCallback({ type: 'notes_share_sync_request' });
    });

    expect(mockShareSendMessage).toHaveBeenCalled();
    const lastCall = mockShareSendMessage.mock.calls.at(-1)![0] as {
      type: string;
      players: Array<Record<string, unknown>>;
      scriptName: string;
    };
    expect(lastCall.type).toBe('notes_share_state');
    expect(lastCall.scriptName).toBe('All Roles');
    expect(lastCall.players).toHaveLength(2);
    for (const p of lastCall.players) {
      expect(Object.keys(p).sort()).toEqual(['id', 'name']);
    }
    expect(lastCall.players.map(p => p.name).sort()).toEqual(['Alice', 'Bob']);
  });

  it('imports a shared setup from a share link into its own independent, editable tracker', () => {
    const hash = window.location.hash;
    window.location.hash = '#/tracker?shareCode=ABCD';

    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    // Simulate the sharer responding with their initial setup
    act(() => {
      mockIncomingShareOnMessageCallback({
        type: 'notes_share_state',
        players: [
          { id: 'p-1', name: 'Alice' },
          { id: 'p-2', name: 'Bob' },
        ],
        scriptName: 'Trouble Brewing',
        scriptAuthor: 'The Pandemonium Institute',
        customScriptRoles: null,
      });
    });

    // The imported players appear, and the tracker behaves like a normal,
    // independently-editable setup (not synced to anything).
    expect(screen.getAllByText('Alice')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bob')[0]).toBeInTheDocument();
    expect(screen.queryByText(/seating arrangement and player list are synced/i)).toBeNull();

    window.location.hash = hash;
  });

  it('picks up a share link opened in a tab where the tracker is already mounted', () => {
    const hash = window.location.hash;
    window.location.hash = '#/tracker';

    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);

    // No share code yet — nothing should be pending
    expect(screen.queryByTestId('loading-screen')).toBeNull();

    // The user opens a share link in this same, already-mounted tab (e.g.
    // from a message app) — a plain hash navigation, not a fresh page load
    act(() => {
      window.location.hash = '#/tracker?shareCode=WXYZ';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();

    window.location.hash = hash;
  });
});
