import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, within } from '@testing-library/react';
import StandardSetup from './StandardSetup';
import WhaleBucket from './WhaleBucket';
import PlayerTracker from './PlayerTracker';
import JoinPage from './JoinPage';
import { useStorytellerSync } from './hooks/useStorytellerSync';

const transport = vi.hoisted(() => ({
  callbacks: new Map<string, (data: unknown) => void>(),
  senders: new Map<string, ReturnType<typeof vi.fn>>(),
  connected: true,
}));

vi.mock('./hooks/useGameSocket', () => ({
  useGameSocket: (code: string, onMessage: (data: unknown) => void) => {
    transport.callbacks.set(code, onMessage);
    if (!transport.senders.has(code)) transport.senders.set(code, vi.fn(async () => true));
    return { isConnected: !!code && transport.connected, sendMessage: transport.senders.get(code)! };
  },
}));

const modes = [
  ['standard-botc-game', StandardSetup],
  ['whale-bucket-game', WhaleBucket],
] as const;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  transport.callbacks.clear();
  transport.senders.clear();
  transport.connected = true;
  window.location.hash = '#/tracker';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Game sync regressions', () => {
  for (const action of ['Make Spectator', 'Kick', 'Cancel']) {
    it.each(modes)(`${action} when removing a connected player in %s`, (storageKey, Component) => {
      const standard = storageKey === 'standard-botc-game';
      localStorage.setItem(standard ? 'standard-botc-game-code' : 'whale-bucket-game-code', 'REVW');
      localStorage.setItem(storageKey, JSON.stringify({
        phase: 'setup', players: [{ id: 'alice', name: 'Alice', pronouns: 'she/her', roleId: 'imp', notes: 'private' }],
        remotePlayerIds: ['alice'],
      }));
      const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
      fireEvent.click(screen.container.querySelector(standard ? '#edit-player-button-alice' : '#edit-preferences-button-alice')!);
      fireEvent.click(screen.container.querySelector(standard ? '#remove-player-button' : '#remove-preference-player-button')!);
      const sender = transport.senders.get('REVW')!;
      sender.mockClear();
      expect(within(screen.container).getByRole('button', { name: 'Make Spectator' })).toBeInTheDocument();
      expect(within(screen.container).getByRole('button', { name: 'Kick' })).toBeInTheDocument();
      expect(Array.from(screen.container.querySelectorAll('#dialog-modal button')).map(button => button.textContent)).toEqual(['Kick', 'Make Spectator', 'Cancel']);
      fireEvent.keyDown(within(screen.container).getByRole('button', { name: action }), { key: 'Enter' });
      expect(sender).not.toHaveBeenCalled();
      fireEvent.click(within(screen.container).getByRole('button', { name: action }));
      const saved = () => JSON.parse(localStorage.getItem(storageKey)!);
      if (action === 'Cancel') {
        expect(saved().players).toHaveLength(1);
        expect(saved().remotePlayerIds).toEqual(['alice']);
        expect(sender).not.toHaveBeenCalled();
      } else {
        expect(saved().players).toEqual([]);
        expect(saved().remotePlayerIds).toEqual([]);
        if (action === 'Kick') {
          expect(saved().spectators).toEqual([]);
          expect(sender).toHaveBeenCalledWith({ type: 'booted', playerId: 'alice' });
        } else {
          expect(saved().spectators).toEqual([{ id: 'alice', name: 'Alice', pronouns: 'she/her' }]);
          expect(sender).toHaveBeenCalledWith(expect.objectContaining({ type: 'code_valid', playerId: 'alice', spectator: true, players: [] }));
          act(() => transport.callbacks.get('REVW')!({ type: 'spectator_join', id: 'alice', name: 'Alice', pronouns: 'she/her' }));
          expect(saved().players).toEqual([]);
          expect(saved().spectators).toHaveLength(1);
        }
      }
    });
  }

  it.each(modes)('allows joining as a spectator before the game starts in %s', (storageKey, Component) => {
    localStorage.setItem(storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code', 'REVW');
    localStorage.setItem(storageKey, JSON.stringify({ phase: 'setup', players: [] }));
    render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'spectator_join', id: 'viewer', name: 'Vera' }));
    const saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.players).toEqual([]);
    expect(saved.spectators).toEqual([{ id: 'viewer', name: 'Vera' }]);
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'code_valid', spectator: true }));
  });

  it('keeps a player moved to spectators connected in Game Notes', () => {
    sessionStorage.setItem('joined-code', 'REVW');
    sessionStorage.setItem('joined-name', 'Alice');
    sessionStorage.setItem('botc-player-id', 'alice');
    const screen = render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'code_valid', playerId: 'other', spectator: true }));
    expect(sessionStorage.getItem('joined-spectator')).toBeNull();
    act(() => transport.callbacks.get('REVW')!({ type: 'code_valid', playerId: 'alice', spectator: true, players: [] }));
    expect(sessionStorage.getItem('joined-spectator')).toBe('true');
    expect(sessionStorage.getItem('joined-code')).toBe('REVW');
    expect(within(screen.container).getByText('You Are Now a Spectator')).toBeInTheDocument();
    fireEvent.click(within(screen.container).getByRole('button', { name: 'OK' }));
    act(() => transport.callbacks.get('REVW')!({ type: 'game_reset', gameType: 'standard' }));
    expect(within(screen.container).getByText('Join the New Session?')).toBeInTheDocument();
  });

  it('sends spectator join requests and retries from the join form', () => {
    vi.useFakeTimers();
    window.location.hash = '#/join?code=REVW';
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    const spectatorSwitch = within(screen.container).getByRole('switch', { name: 'Join as a Spectator' });
    expect(spectatorSwitch).not.toBeChecked();
    fireEvent.click(spectatorSwitch);
    fireEvent.change(within(screen.container).getByPlaceholderText('Enter your name...'), { target: { value: 'Vera' } });
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Join Game Room' }));
    const sender = transport.senders.get('REVW')!;
    expect(sender).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'spectator_join', name: 'Vera' }));
    act(() => vi.advanceTimersByTime(1500));
    expect(sender).toHaveBeenCalledTimes(2);
    expect(sender).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'spectator_join' }));
    act(() => transport.callbacks.get('REVW')!({ type: 'code_valid', playerId: sessionStorage.getItem('botc-player-id'), gameType: 'standard', spectator: true, players: [] }));
    expect(within(screen.container).getByText('Spectator View')).toBeInTheDocument();
  });

  it('moves an already joined player to spectator notes without leaving the room', () => {
    window.location.hash = '#/join?code=REVW';
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    fireEvent.change(within(screen.container).getByPlaceholderText('Enter your name...'), { target: { value: 'Alice' } });
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Join Game Room' }));
    const playerId = sessionStorage.getItem('botc-player-id');
    act(() => transport.callbacks.get('REVW')!({ type: 'code_valid', playerId, gameType: 'standard' }));
    act(() => transport.callbacks.get('REVW')!({ type: 'code_valid', playerId, gameType: 'standard', spectator: true, players: [] }));
    expect(within(screen.container).getByText('Spectator View')).toBeInTheDocument();
    expect(within(screen.container).getByRole('status')).toHaveTextContent('The storyteller made you a spectator. You can keep following the game in Game Notes.');
    expect(within(screen.container).queryByText(/Wait until everyone has joined/)).toBeNull();
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'spectator_join', id: playerId }));
    fireEvent.click(within(screen.container).getByRole('button', { name: 'View Game Notes' }));
    expect(sessionStorage.getItem('joined-spectator')).toBe('true');
    expect(sessionStorage.getItem('joined-code')).toBe('REVW');
    expect(window.location.hash).toBe('#/tracker');
  });

  it.each(modes)('supports the spectator lifecycle in %s', (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    localStorage.setItem(storageKey, JSON.stringify({
      phase: 'game', players: [{ id: 'alice', name: 'Alice', roleId: 'chef', isDead: false }],
      remotePlayerIds: ['alice'], timeOfDay: 'day', dayNumber: 3,
    }));
    const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    const receive = (payload: unknown) => act(() => transport.callbacks.get('REVW')!(payload));
    const saved = () => JSON.parse(localStorage.getItem(storageKey)!);
    receive({ type: 'player_join', id: 'viewer', name: 'Vera', pronouns: 'she/her' });
    expect(saved().players.map((player: { id: string }) => player.id)).toEqual(['alice']);
    expect(saved().spectators).toEqual([{ id: 'viewer', name: 'Vera', pronouns: 'she/her' }]);
    expect(transport.senders.get('REVW')).toHaveBeenCalledWith(expect.objectContaining({
      type: 'code_valid', playerId: 'viewer', spectator: true, timeOfDay: 'day', dayNumber: 3,
    }));
    const syncCode = localStorage.getItem(storageKey === 'standard-botc-game' ? 'standard-botc-sync-code' : 'whale-bucket-sync-code')!;
    expect(transport.senders.get(syncCode)).toHaveBeenLastCalledWith(expect.objectContaining({
      type: 'storyteller_state_sync', state: expect.objectContaining({ spectators: saved().spectators }),
    }));
    receive({ type: 'spectator_join', id: 'viewer', name: 'Vera', pronouns: 'she/her' });
    expect(saved().spectators).toHaveLength(1);
    receive({ type: 'player_join', id: 'impostor', name: ' VERA ' });
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'duplicate_name' }));
    fireEvent.change(within(screen.container).getByLabelText('Connected spectator'), { target: { value: 'viewer' } });
    fireEvent.click(screen.container.querySelector('#game-add-traveler-button')!);
    expect(saved().players[0]).toMatchObject({ id: 'viewer', name: 'Vera', roleId: 'beggar', pronouns: 'she/her' });
    expect(saved().spectators).toEqual([]);
    expect(saved().remotePlayerIds).toEqual(['alice', 'viewer']);
    receive({ type: 'spectator_join', id: 'viewer', name: 'Vera' });
    expect(saved().players).toHaveLength(2);
    expect(saved().spectators).toEqual([]);
  });

  it.each(modes)('keeps %s spectators separate until they opt into a reset game', (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    localStorage.setItem(storageKey, JSON.stringify({ phase: 'game', players: [], spectators: [{ id: 'viewer', name: 'Vera' }] }));
    const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    fireEvent.click(screen.container.querySelector('#header-menu-button')!);
    fireEvent.click(screen.container.querySelector('#reset-game-button')!);
    expect(within(screen.container).getByText(/1 person is connected/)).toBeInTheDocument();
    fireEvent.click(within(screen.container).getByText('Keep Players'));
    act(() => transport.callbacks.get('REVW')!({ type: 'spectator_join', id: 'viewer', name: 'Vera' }));
    let saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.players).toEqual([]);
    expect(saved.spectators).toHaveLength(1);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'viewer', name: 'Vera' }));
    saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.players[0]).toMatchObject({ id: 'viewer', name: 'Vera' });
    expect(saved.spectators).toEqual([]);
  });

  it.each(modes)('accepts spectators at capacity and protects player identities in %s', (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    localStorage.setItem(storageKey, JSON.stringify({
      phase: 'game', players: Array.from({ length: 20 }, (_, index) => ({ id: `p${index}`, name: `Player ${index}`, isDead: false })),
      remotePlayerIds: ['p0'],
    }));
    const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'viewer', name: 'Vera', checkOnly: true }));
    expect(JSON.parse(localStorage.getItem(storageKey)!).spectators).toEqual([]);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'viewer', name: 'Vera' }));
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'code_valid', spectator: true }));
    fireEvent.change(within(screen.container).getByLabelText('Connected spectator'), { target: { value: 'viewer' } });
    expect(screen.container.querySelector('#game-add-traveler-button')).toBeDisabled();
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'impostor', name: 'Player 0' }));
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'duplicate_name' }));
    expect(JSON.parse(localStorage.getItem(storageKey)!).players[0].id).toBe('p0');
  });

  it.each(modes)('promotes a spectator from a co-storyteller device in %s', (storageKey, Component) => {
    const standard = storageKey === 'standard-botc-game';
    localStorage.setItem(standard ? 'standard-botc-game-code' : 'whale-bucket-game-code', 'REVW');
    localStorage.setItem(standard ? 'standard-botc-sync-code' : 'whale-bucket-sync-code', 'SYNC');
    localStorage.setItem(storageKey, JSON.stringify({ phase: 'game', players: [] }));
    const primary = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'viewer', name: 'Vera' }));
    const primarySync = transport.callbacks.get('SYNC')!;
    const initial = transport.senders.get('SYNC')!.mock.lastCall![0];
    window.location.hash = `${standard ? '#/standard' : '#/whale-bucket'}?syncCode=SYNC&gameCode=REVW`;
    const secondary = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('SYNC')!(initial));
    fireEvent.change(within(secondary.container).getByLabelText('Connected spectator'), { target: { value: 'viewer' } });
    fireEvent.click(secondary.container.querySelector('#game-add-traveler-button')!);
    const promoted = transport.senders.get('SYNC')!.mock.lastCall![0];
    act(() => primarySync(promoted));
    expect(within(primary.container).queryByLabelText('Connected spectator')).toBeNull();
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith(expect.objectContaining({
      type: 'game_update', players: [expect.objectContaining({ id: 'viewer', name: 'Vera', roleId: 'beggar' })],
    }));
  });

  it('opens late-join notes with current public state and no hidden character data', () => {
    window.location.hash = '#/join?code=REVW';
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    fireEvent.change(within(screen.container).getByPlaceholderText('Enter your name...'), { target: { value: 'Vera' } });
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Join Game Room' }));
    act(() => transport.callbacks.get('REVW')!({
      type: 'code_valid', playerId: sessionStorage.getItem('botc-player-id'), gameType: 'standard', spectator: true,
      scriptName: 'Trouble Brewing', scriptAuthor: 'The Pandemonium Institute', torEnabled: true,
      players: [{ id: 'alice', name: 'Alice', roleId: 'imp', notes: 'secret', isDead: true, isEvil: true }],
      timeOfDay: 'day', dayNumber: 3,
    }));
    expect(within(screen.container).getByText('Spectator View')).toBeInTheDocument();
    fireEvent.click(within(screen.container).getByRole('button', { name: 'View Game Notes' }));
    expect(window.location.hash).toBe('#/tracker');
    expect(sessionStorage.getItem('joined-spectator')).toBe('true');
    const saved = JSON.parse(localStorage.getItem('player-tracker-botc-game')!);
    expect(saved).toMatchObject({ timeOfDay: 'day', dayNumber: 3, scriptName: 'Trouble Brewing', torEnabled: true });
    expect(saved.players[0]).toMatchObject({ name: 'Alice', roleId: '', isDead: true });
    expect(saved.players[0].notes).toBeUndefined();
    expect(saved.players[0].isEvil).toBeUndefined();
  });

  it('reconnects spectator notes, asks about resets, and routes promoted Travelers to their token', () => {
    sessionStorage.setItem('joined-code', 'REVW');
    sessionStorage.setItem('joined-name', 'Vera');
    sessionStorage.setItem('botc-player-id', 'viewer');
    sessionStorage.setItem('joined-spectator', 'true');
    localStorage.setItem('player-tracker-botc-game', JSON.stringify({ phase: 'game', players: [] }));
    const screen = render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);
    expect(transport.senders.get('REVW')).toHaveBeenCalledWith(expect.objectContaining({ type: 'spectator_join', id: 'viewer' }));
    act(() => transport.callbacks.get('REVW')!({ type: 'game_reset', gameType: 'whale-bucket' }));
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Keep Watching' }));
    expect(sessionStorage.getItem('joined-spectator')).toBe('true');
    expect(window.location.hash).toBe('#/tracker');
    act(() => transport.callbacks.get('REVW')!({ type: 'game_update', players: [{ id: 'viewer', name: 'Vera', roleId: 'beggar', isDead: false }] }));
    expect(sessionStorage.getItem('joined-spectator')).toBeNull();
    expect(window.location.hash).toBe('#/join');
    screen.unmount();
    const join = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'game_update', players: [{ id: 'viewer', name: 'Vera', roleId: 'beggar', isDead: false }] }));
    expect(join.container.querySelector('#waiting-screen')).toBeNull();
    expect(within(join.container).getByText('Your Character Token')).toBeInTheDocument();
    expect(within(join.container).getByRole('img', { name: 'Beggar' })).toBeInTheDocument();
  });

  it.each(['standard', 'whale-bucket'])('lets a spectator join a new %s session explicitly', gameType => {
    sessionStorage.setItem('joined-code', 'REVW');
    sessionStorage.setItem('joined-name', 'Vera');
    sessionStorage.setItem('botc-player-id', 'viewer');
    sessionStorage.setItem('joined-spectator', 'true');
    const tracker = render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'game_reset', gameType }));
    fireEvent.click(within(tracker.container).getByRole('button', { name: 'Join as a Player' }));
    expect(sessionStorage.getItem('joined-spectator')).toBeNull();
    tracker.unmount();
    render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'player_join', id: 'viewer' }));
  });

  it('keeps local per-player notes when a normal game update arrives', () => {
    sessionStorage.setItem('joined-code', 'REVW');
    localStorage.setItem('player-tracker-botc-game', JSON.stringify({
      phase: 'game', players: [{ id: 'alice', name: 'Alice', isDead: false, notes: 'Claimed Chef', roleId: 'chef' }],
    }));
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({
      type: 'game_update', players: [{ id: 'alice', name: 'Alice', isDead: true, roleId: 'imp' }],
    }));
    const saved = JSON.parse(localStorage.getItem('player-tracker-botc-game')!);
    expect(saved.players[0].notes).toBe('Claimed Chef');
    expect(saved.players[0].roleId).toBe('chef');
    expect(saved.players[0].isDead).toBe(true);
  });

  it('keeps a newly synced character hidden in Game Notes', () => {
    sessionStorage.setItem('joined-code', 'REVW');
    render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({
      type: 'game_update', players: [{ id: 'alice', name: 'Alice', isDead: false, roleId: 'imp', isTheMarionette: true }],
    }));
    const saved = JSON.parse(localStorage.getItem('player-tracker-botc-game')!);
    expect(saved.players[0].roleId).toBe('');
    expect(saved.players[0].isTheMarionette).not.toBe(true);
  });

  it.each(modes)('keeps a claimed name protected after the %s storyteller refreshes', (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    window.location.hash = storageKey === 'standard-botc-game' ? '#/standard' : '#/whale-bucket';
    const first = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'original-alice', name: 'Alice' }));
    first.unmount();
    render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'different-alice', name: 'Alice' }));
    const saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.players[0].id).toBe('original-alice');
    expect(transport.senders.get('REVW')).toHaveBeenCalledWith(expect.objectContaining({ type: 'duplicate_name' }));
  });

  it.each(modes)('rejects competing same-name joins before a %s rerender', (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => {
      const onMessage = transport.callbacks.get('REVW')!;
      onMessage({ type: 'player_join', id: 'original-alice', name: 'Alice' });
      onMessage({ type: 'player_join', id: 'different-alice', name: ' ALICE ' });
    });
    const saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.players).toHaveLength(1);
    expect(saved.players[0].id).toBe('original-alice');
    expect(transport.senders.get('REVW')).toHaveBeenCalledWith(expect.objectContaining({
      type: 'duplicate_name', playerId: 'different-alice',
    }));
  });

  it.each(modes)('keeps a %s preflight check read-only and permits an actual join', (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    const player = { id: 'local-alice', name: 'Alice', isDead: false, preferences: { townsfolk: ['chef'], outsider: [], minion: [], demon: [], traveler: [] } };
    localStorage.setItem(storageKey, JSON.stringify({ players: [player], phase: 'setup' }));
    render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({
      type: 'player_join', id: 'preflight-alice', name: 'Alice', checkOnly: true,
    }));
    let saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.players[0].id).toBe('local-alice');
    expect(saved.remotePlayerIds).toEqual([]);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'actual-alice', name: 'Alice' }));
    saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.players[0].id).toBe('actual-alice');
    expect(saved.players[0].preferences.townsfolk).toEqual(['chef']);
    expect(saved.remotePlayerIds).toEqual(['actual-alice']);
  });

  it.each(modes)('cancels pending %s broadcasts on unmount', (storageKey, Component) => {
    vi.useFakeTimers();
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => vi.advanceTimersByTime(500));
    screen.unmount();
    act(() => vi.advanceTimersByTime(2000));
    expect(transport.senders.get('REVW')).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'setup_update' }));
  });

  it.each(modes)('preserves Tor in the immediate %s reset message', (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    localStorage.setItem(storageKey, JSON.stringify({
      players: [{ id: 'alice', name: 'Alice', isDead: false, roleId: 'chef' }],
      phase: 'game', torEnabled: true, remotePlayerIds: ['alice'],
    }));
    const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    fireEvent.click(screen.container.querySelector('#header-menu-button')!);
    fireEvent.click(screen.container.querySelector('#reset-game-button')!);
    fireEvent.click(within(screen.container).getByText('Keep Players'));
    expect(transport.senders.get('REVW')).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setup_update', torEnabled: true,
    }));
  });

  it('requests initial storyteller state when its delayed subscription connects', () => {
    vi.useFakeTimers();
    transport.connected = false;
    const onApplySync = vi.fn();
    const localState = { players: [] };
    const { rerender } = renderHook(() => useStorytellerSync({
      isSecondary: true, syncCode: 'SYNC', localState, onApplySync,
    }));
    act(() => vi.advanceTimersByTime(1000));
    transport.senders.get('SYNC')!.mockClear();
    transport.connected = true;
    rerender();
    act(() => vi.advanceTimersByTime(2000));
    expect(transport.senders.get('SYNC')).toHaveBeenCalledWith({ type: 'storyteller_sync_request' });
  });

  it('retries missed sync replies, stops after receipt, and requests fresh state after reconnect', () => {
    vi.useFakeTimers();
    const localState = { players: [] };
    const onApplySync = vi.fn();
    const { result, rerender } = renderHook(() => useStorytellerSync({
      isSecondary: true, syncCode: 'SYNC', localState, onApplySync,
    }));
    const sendMessage = transport.senders.get('SYNC')!;
    expect(sendMessage).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(sendMessage).toHaveBeenCalledTimes(2);
    act(() => transport.callbacks.get('SYNC')!({ type: 'storyteller_state_sync', state: localState }));
    expect(result.current.hasReceivedSync).toBe(true);
    act(() => vi.advanceTimersByTime(6000));
    expect(sendMessage).toHaveBeenCalledTimes(2);
    transport.connected = false;
    rerender();
    transport.connected = true;
    rerender();
    expect(sendMessage).toHaveBeenCalledTimes(3);
  });
});
