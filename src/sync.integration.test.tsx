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
  vi.unstubAllGlobals();
});

describe('Game sync regressions', () => {
  it('keeps a Whalebucket player in the picker until all four preferences are selected', () => {
    window.location.hash = '#/join?code=PREF';
    sessionStorage.setItem('botc-player-id', 'alice');
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    const view = within(screen.container);
    fireEvent.change(view.getByPlaceholderText('Enter your name...'), { target: { value: 'Alice' } });
    fireEvent.click(view.getByRole('button', { name: 'Join Game Room' }));
    act(() => transport.callbacks.get('PREF')!({ type: 'code_valid', gameType: 'whale-bucket', phase: 'setup', playerId: 'alice' }));
    const sender = transport.senders.get('PREF')!;
    const submit = view.getByRole('button', { name: 'Submit Character Preferences' });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(sender.mock.calls.some(([payload]) => payload.preferences)).toBe(false);

    for (const [team, character] of [['townsfolk', 'Chef'], ['outsider', 'Drunk'], ['minion', 'Poisoner']]) {
      fireEvent.click(view.getByRole('button', { name: `Select ${team} preference` }));
      fireEvent.click(view.getByText(character));
    }
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(sender.mock.calls.some(([payload]) => payload.preferences)).toBe(false);
    expect(view.getByText('Submit Your Preferences')).toBeInTheDocument();

    fireEvent.click(view.getByRole('button', { name: 'Select demon preference' }));
    fireEvent.click(view.getByText('Summoner'));
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(sender).toHaveBeenCalledWith(expect.objectContaining({
      type: 'player_join',
      preferences: { townsfolk: ['chef'], outsider: ['drunk'], minion: ['poisoner'], demon: ['summoner'], traveler: [] },
    }));
    expect(screen.container.querySelector('#waiting-screen')).not.toBeNull();
  });

  it('waits for admission before revealing and hides tokens when resuming an active game', () => {
    sessionStorage.setItem('joined-code', 'REVW');
    sessionStorage.setItem('joined-name', 'Alice');
    sessionStorage.setItem('botc-player-id', 'alice');
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    const receive = (message: unknown) => act(() => transport.callbacks.get('REVW')!(message));
    const update = { type: 'game_update', players: [{ id: 'alice', name: 'Alice', roleId: 'imp' }] };
    receive(update);
    expect(within(screen.container).queryByText('Your Character Token')).toBeNull();
    receive({ type: 'code_valid', gameType: 'standard', phase: 'game', playerId: 'alice' });
    receive(update);
    expect(within(screen.container).getByText('Game in Progress')).toBeInTheDocument();
    expect(within(screen.container).queryByText('Your Character Token')).toBeNull();
    receive({ type: 'game_reset', gameType: 'standard' });
    receive({ type: 'code_valid', gameType: 'standard', phase: 'setup', playerId: 'alice' });
    receive(update);
    expect(within(screen.container).getByText('Your Character Token')).toBeInTheDocument();
  });

  it.each(['standard', 'whale-bucket'])('does not reveal a character when joining an active %s game', gameType => {
    window.location.hash = '#/join?code=REVW';
    sessionStorage.setItem('botc-player-id', 'alice');
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    fireEvent.change(within(screen.container).getByPlaceholderText('Enter your name...'), { target: { value: 'Alice' } });
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Join Game Room' }));
    const receive = (message: unknown) => act(() => transport.callbacks.get('REVW')!(message));
    receive({ type: 'code_valid', gameType, phase: 'game', playerId: 'alice' });
    for (const type of ['game_update', 'game_started', 'game_update']) {
      receive({ type, gameType, players: [{ id: 'alice', name: 'Alice', roleId: 'imp' }] });
      expect(within(screen.container).getByText('Game in Progress')).toBeInTheDocument();
      expect(within(screen.container).queryByText('Imp')).toBeNull();
      expect(within(screen.container).queryByText('Show Token')).toBeNull();
    }
    fireEvent.click(within(screen.container).getByRole('button', { name: 'View Game Notes' }));
    expect(window.location.hash).toBe('#/tracker');
    expect(sessionStorage.getItem('joined-spectator')).toBeNull();
    expect(JSON.parse(localStorage.getItem('player-tracker-botc-game')!).players[0].roleId).toBe('');
  });

  it('keeps a stable sender ID and ignores its echoes without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {});
    const onApplySync = vi.fn();
    const { rerender } = renderHook(({ players }) => useStorytellerSync({
      isSecondary: false, syncCode: 'SYNC', localState: { players }, onApplySync,
    }), { initialProps: { players: [] as string[] } });
    const sender = transport.senders.get('SYNC')!;
    const first = sender.mock.calls.at(-1)![0];
    expect(first.senderId).toEqual(expect.any(String));
    expect(first.senderId.length).toBeGreaterThan(0);
    rerender({ players: ['Alice'] });
    expect(sender.mock.calls.at(-1)![0]).toMatchObject({ senderId: first.senderId, sequence: 2 });
    act(() => transport.callbacks.get('SYNC')!(first));
    expect(onApplySync).not.toHaveBeenCalled();
  });

  it.each(modes)('keeps manually added players when delayed sync echoes arrive in %s', (storageKey, Component) => {
    const syncKey = storageKey === 'standard-botc-game' ? 'standard-botc-sync-code' : 'whale-bucket-sync-code';
    localStorage.setItem(syncKey, 'SYNC');
    const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    const sender = transport.senders.get('SYNC')!;
    const input = screen.container.querySelector<HTMLInputElement>('#new-player-input')!;
    const snapshots: unknown[] = [sender.mock.calls.at(-1)![0]];
    for (const name of ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']) {
      fireEvent.change(input, { target: { value: name } });
      fireEvent.click(input.nextElementSibling!);
      snapshots.push(sender.mock.calls.at(-1)![0]);
    }
    const publishedCount = sender.mock.calls.length;
    for (const index of [4, 2, 3, 5, 3, 0]) {
      act(() => transport.callbacks.get('SYNC')!(snapshots[index]));
      expect(JSON.parse(localStorage.getItem(storageKey)!).players.map((player: { name: string }) => player.name))
        .toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
    }
    expect(sender).toHaveBeenCalledTimes(publishedCount);
  });

  it('ignores duplicate and out-of-order snapshots from a synced storyteller', () => {
    const onApplySync = vi.fn();
    renderHook(() => useStorytellerSync({
      isSecondary: false, syncCode: 'SYNC', localState: { players: [] }, onApplySync,
    }));
    const receive = (senderId: string, sequence: number) => act(() => transport.callbacks.get('SYNC')!({
      type: 'storyteller_state_sync', senderId, sequence, state: { players: [sequence] },
    }));
    receive('phone', 4);
    receive('phone', 2);
    receive('phone', 4);
    receive('phone', 5);
    receive('laptop', 1);
    expect(onApplySync.mock.calls.map(([state]) => state.players)).toEqual([[4], [5], [1]]);
  });

  for (const phase of ['setup', 'game']) {
    it.each(modes)(`claims manual seats and protects synced names during ${phase} in %s`, (storageKey, Component) => {
      const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
      localStorage.setItem(codeKey, 'REVW');
      localStorage.setItem(storageKey, JSON.stringify({
        phase,
        players: [
          { id: 'manual-mary', name: 'Mary', roleId: 'chef', notes: 'private note' },
          { id: 'synced-steve', name: 'Steve', roleId: 'imp' },
        ],
        remotePlayerIds: ['synced-steve'],
      }));
      render(<Component theme="dark" toggleTheme={vi.fn()} />);
      const receive = (message: unknown) => act(() => transport.callbacks.get('REVW')!(message));
      const sender = transport.senders.get('REVW')!;
      sender.mockClear();
      for (const checkOnly of [true, false]) {
        receive({ type: 'spectator_join', id: 'spectator-mary', name: ' MARY ', checkOnly });
        expect(sender).toHaveBeenLastCalledWith({ type: 'duplicate_name', playerId: 'spectator-mary', playerName: ' MARY ' });
      }
      expect(JSON.parse(localStorage.getItem(storageKey)!).players[0].id).toBe('manual-mary');
      expect(JSON.parse(localStorage.getItem(storageKey)!).spectators).toEqual([]);
      sender.mockClear();
      receive({ type: 'player_join', id: 'mary-device', name: ' MARY ' });
      const saved = () => JSON.parse(localStorage.getItem(storageKey)!);
      expect(saved().players).toHaveLength(2);
      expect(saved().players[0]).toMatchObject({ id: 'mary-device', name: 'Mary', roleId: 'chef', notes: 'private note' });
      expect(saved().remotePlayerIds).toEqual(['synced-steve', 'mary-device']);
      expect(sender).toHaveBeenCalledWith(expect.objectContaining({ type: 'code_valid', playerId: 'mary-device' }));
      expect(sender).toHaveBeenCalledWith(expect.objectContaining({ type: 'code_valid', playerId: 'mary-device', phase }));
      if (phase === 'game') {
        const firstGameUpdate = sender.mock.calls.find(([payload]) => payload.type === 'game_update')![0];
        expect(firstGameUpdate.players[0]).toMatchObject({ id: 'mary-device', roleId: 'chef' });
        expect(firstGameUpdate.players[0].notes).toBeUndefined();
      }
      receive({ type: 'player_join', id: 'another-steve', name: ' STEVE ' });
      expect(sender).toHaveBeenLastCalledWith({ type: 'duplicate_name', playerId: 'another-steve', playerName: ' STEVE ' });
      receive({ type: 'player_join', id: 'another-mary', name: 'Mary' });
      expect(sender).toHaveBeenLastCalledWith({ type: 'duplicate_name', playerId: 'another-mary', playerName: 'Mary' });
      receive({ type: 'player_join', id: 'synced-steve', name: 'Steve' });
      expect(sender).toHaveBeenCalledWith(expect.objectContaining({ type: 'code_valid', playerId: 'synced-steve' }));
      expect(saved().players).toHaveLength(2);
      expect(saved().players[1].id).toBe('synced-steve');
    });
  }

  it.each([false, true])('does not accept another player\'s public updates as a same-name join (spectator: %s)', asSpectator => {
    vi.useFakeTimers();
    window.location.hash = '#/join?code=REVW';
    sessionStorage.setItem('botc-player-id', 'another-steve');
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    if (asSpectator) fireEvent.click(within(screen.container).getByRole('switch', { name: 'Join as a Spectator' }));
    fireEvent.change(within(screen.container).getByPlaceholderText('Enter your name...'), { target: { value: 'Steve' } });
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Join Game Room' }));
    const receive = (message: unknown) => act(() => transport.callbacks.get('REVW')!(message));
    const players = [{ id: 'synced-steve', name: 'Steve', roleId: 'imp' }];
    receive({ type: 'setup_update', gameType: 'standard', players });
    expect(within(screen.container).getByText('Connecting to Room REVW')).toBeInTheDocument();
    expect(sessionStorage.getItem('joined-code')).toBeNull();
    receive({ type: 'game_update', gameType: 'standard', players });
    expect(within(screen.container).getByText('Connecting to Room REVW')).toBeInTheDocument();
    receive({ type: 'duplicate_name', playerId: 'another-steve', playerName: 'Steve' });
    expect(within(screen.container).getByText('That name is already in use in this room. Please choose another.')).toBeInTheDocument();
    expect(within(screen.container).getByPlaceholderText('Enter your name...')).toBeInTheDocument();
    receive({ type: 'setup_update', gameType: 'standard', players });
    receive({ type: 'game_update', gameType: 'standard', players });
    expect(sessionStorage.getItem('joined-code')).toBeNull();
    expect(within(screen.container).getByRole('button', { name: 'Join Game Room' })).toBeInTheDocument();
    transport.senders.get('REVW')!.mockClear();
    act(() => vi.advanceTimersByTime(10_000));
    expect(transport.senders.get('REVW')).not.toHaveBeenCalled();
  });

  it('keeps exclusion suggestions open for repeated selections and searches character teams', () => {
    localStorage.setItem('whale-bucket-game', JSON.stringify({ phase: 'setup', players: [], excludedRoleIds: [], excludedRoleDefaultsVersion: 1 }));
    const screen = render(<WhaleBucket theme="dark" toggleTheme={vi.fn()} />);
    const search = within(screen.container).getByRole('combobox', { name: 'Exclude characters' });
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: 'demon' } });
    expect(within(screen.container).getByRole('option', { name: /^Imp demon$/i })).toBeInTheDocument();
    expect(within(screen.container).queryByRole('option', { name: /^Chef / })).toBeNull();
    fireEvent.click(within(screen.container).getByRole('option', { name: /^Imp demon$/i }));
    expect(search).toHaveValue('');
    expect(within(screen.container).getByRole('listbox', { name: 'Exclude characters' })).toBeInTheDocument();
    expect(within(screen.container).queryByRole('option', { name: /^Imp demon$/i })).toBeNull();
    fireEvent.click(within(screen.container).getByRole('option', { name: /^Poisoner minion$/i }));
    expect(JSON.parse(localStorage.getItem('whale-bucket-game')!).excludedRoleIds).toEqual(['imp', 'poisoner']);
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(within(screen.container).queryByRole('listbox')).toBeNull();
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: 'demon' } });
    fireEvent.blur(search);
    expect(within(screen.container).queryByRole('listbox')).toBeNull();
    fireEvent.focus(search);
    expect(within(screen.container).getByRole('option', { name: /^Fang Gu demon$/i })).toBeInTheDocument();
    expect(within(screen.container).queryByRole('option', { name: /^Chef / })).toBeNull();
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Stop excluding Imp' }));
    expect(JSON.parse(localStorage.getItem('whale-bucket-game')!).excludedRoleIds).toEqual(['poisoner']);
  });

  for (const action of ['Ban', 'Kick', 'Make Spectator', 'Close']) {
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
      const playerName = screen.container.querySelector('#dialog-modal strong')!;
      expect(playerName).toHaveTextContent('Alice');
      expect(playerName).toHaveClass('text-base', 'font-bold');
      expect(playerName.parentElement).toHaveTextContent('Remove Alice from the player roster?');
      expect(within(screen.container).getByRole('button', { name: 'Make Spectator' })).toBeInTheDocument();
      expect(within(screen.container).getByRole('button', { name: 'Kick' })).toBeInTheDocument();
      expect(Array.from(screen.container.querySelectorAll('#dialog-modal-actions button')).map(button => button.textContent)).toEqual(['Ban', 'Kick', 'Make Spectator']);
      expect(within(screen.container).queryByRole('button', { name: 'Cancel' })).toBeNull();
      expect(within(screen.container).getByRole('button', { name: 'Ban' })).toHaveClass('bg-clocktower-blood');
      expect(within(screen.container).getByRole('button', { name: 'Kick' })).not.toHaveClass('bg-clocktower-blood');
      fireEvent.keyDown(within(screen.container).getByRole('button', { name: action }), { key: 'Enter' });
      expect(sender).not.toHaveBeenCalled();
      fireEvent.click(within(screen.container).getByRole('button', { name: action }));
      const saved = () => JSON.parse(localStorage.getItem(storageKey)!);
      if (action === 'Close') {
        expect(saved().players).toHaveLength(1);
        expect(saved().remotePlayerIds).toEqual(['alice']);
        expect(sender).not.toHaveBeenCalled();
      } else {
        expect(saved().players).toEqual([]);
        expect(saved().remotePlayerIds).toEqual([]);
        if (action === 'Ban') {
          expect(saved().bannedPlayers).toEqual([{ id: 'alice', name: 'Alice' }]);
          expect(sender).toHaveBeenCalledWith({ type: 'banned', playerId: 'alice' });
          for (const request of [
            { type: 'player_join', id: 'alice', name: 'New Name' },
            { type: 'spectator_join', id: 'alice', name: 'New Name' },
            { type: 'player_join', id: 'new-id', name: ' ALICE ', checkOnly: true },
            { type: 'spectator_join', id: 'new-id', name: ' ALICE ' },
          ]) {
            act(() => transport.callbacks.get('REVW')!(request));
            expect(sender).toHaveBeenLastCalledWith({ type: 'banned', playerId: request.id });
            expect(saved().players).toEqual([]);
            expect(saved().spectators).toEqual([]);
          }
          screen.unmount();
          render(<Component theme="dark" toggleTheme={vi.fn()} />);
          act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'alice', name: 'Alice' }));
          expect(sender).toHaveBeenLastCalledWith({ type: 'banned', playerId: 'alice' });
          expect(saved().players).toEqual([]);
        } else if (action === 'Kick') {
          expect(saved().spectators).toEqual([]);
          expect(sender).toHaveBeenCalledWith({ type: 'booted', playerId: 'alice' });
          expect(saved().bannedPlayers).toEqual([]);
          act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'alice', name: 'Alice' }));
          expect(saved().players[0]).toMatchObject({ id: 'alice', name: 'Alice' });
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

  it.each(modes)('retains bans for a round reset and clears them for a new room in %s', async (storageKey, Component) => {
    const codeKey = storageKey === 'standard-botc-game' ? 'standard-botc-game-code' : 'whale-bucket-game-code';
    localStorage.setItem(codeKey, 'REVW');
    localStorage.setItem(storageKey, JSON.stringify({
      phase: 'game', players: [{ id: 'bob', name: 'Bob', roleId: 'chef' }], remotePlayerIds: ['bob'],
      bannedPlayers: [{ id: 'alice', name: 'Alice' }],
    }));
    const screen = render(<Component theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type: 'spectator_join', id: 'alice', name: 'Alice' }));
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith({ type: 'banned', playerId: 'alice' });
    fireEvent.click(screen.container.querySelector('#header-menu-button')!);
    fireEvent.click(screen.container.querySelector('#reset-game-button')!);
    fireEvent.click(screen.container.querySelector('#reset-keep-players-button')!);
    act(() => transport.callbacks.get('REVW')!({ type: 'player_join', id: 'alice', name: 'Alice' }));
    expect(transport.senders.get('REVW')).toHaveBeenLastCalledWith({ type: 'banned', playerId: 'alice' });
    fireEvent.click(screen.container.querySelector('#header-menu-button')!);
    fireEvent.click(screen.container.querySelector('#reset-game-button')!);
    await act(async () => fireEvent.click(screen.container.querySelector('#reset-disconnect-button')!));
    const newCode = localStorage.getItem(codeKey)!;
    expect(newCode).not.toBe('REVW');
    act(() => transport.callbacks.get(newCode)!({ type: 'player_join', id: 'alice', name: 'Alice' }));
    const saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.bannedPlayers).toEqual([]);
    expect(saved.players[0]).toMatchObject({ id: 'alice', name: 'Alice' });
  });

  it.each(['booted', 'banned'])('shows the removal message and stops join retries for %s', type => {
    vi.useFakeTimers();
    window.location.hash = '#/join?code=REVW';
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    fireEvent.change(within(screen.container).getByPlaceholderText('Enter your name...'), { target: { value: 'Alice' } });
    fireEvent.click(within(screen.container).getByRole('button', { name: 'Join Game Room' }));
    act(() => transport.callbacks.get('REVW')!({ type, playerId: sessionStorage.getItem('botc-player-id') }));
    expect(screen.container.querySelector('#dialog-modal')).toHaveTextContent('You have been removed from the game by the storyteller');
    expect(sessionStorage.getItem('joined-code')).toBeNull();
    expect(within(screen.container).getByRole('button', { name: 'Join Game Room' })).toBeInTheDocument();
    const sender = transport.senders.get('REVW')!;
    sender.mockClear();
    act(() => vi.advanceTimersByTime(10_000));
    expect(sender).not.toHaveBeenCalled();
  });

  it.each(['booted', 'banned'])('disconnects synced Game Notes with the removal message for %s', type => {
    sessionStorage.setItem('joined-code', 'REVW');
    sessionStorage.setItem('joined-name', 'Alice');
    sessionStorage.setItem('botc-player-id', 'alice');
    sessionStorage.setItem('joined-spectator', 'true');
    const screen = render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({ type, playerId: 'alice' }));
    expect(screen.container.querySelector('#dialog-modal')).toHaveTextContent('You have been removed from the game by the storyteller');
    expect(sessionStorage.getItem('joined-code')).toBeNull();
    expect(sessionStorage.getItem('joined-spectator')).toBeNull();
    expect(within(screen.container).queryByText(/Syncing with/)).toBeNull();
  });

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
    fireEvent.focus(within(screen.container).getByRole('combobox', { name: 'Traveler name' }));
    fireEvent.click(within(screen.container).getByRole('option', { name: /Vera/ }));
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
    fireEvent.focus(within(screen.container).getByRole('combobox', { name: 'Traveler name' }));
    fireEvent.click(within(screen.container).getByRole('option', { name: /Vera/ }));
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
    fireEvent.focus(within(secondary.container).getByRole('combobox', { name: 'Traveler name' }));
    fireEvent.click(within(secondary.container).getByRole('option', { name: /Vera/ }));
    fireEvent.click(secondary.container.querySelector('#game-add-traveler-button')!);
    const promoted = transport.senders.get('SYNC')!.mock.lastCall![0];
    act(() => primarySync(promoted));
    fireEvent.focus(within(primary.container).getByRole('textbox', { name: 'Traveler name' }));
    expect(within(primary.container).queryByRole('option', { name: /Vera/ })).toBeNull();
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

  it('reconnects spectator notes, asks about resets, and hides promoted Travelers tokens on a late join', () => {
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
    act(() => transport.callbacks.get('REVW')!({ type: 'code_valid', gameType: 'standard', phase: 'game', playerId: 'viewer' }));
    act(() => transport.callbacks.get('REVW')!({ type: 'game_update', players: [{ id: 'viewer', name: 'Vera', roleId: 'beggar', isDead: false }] }));
    expect(join.container.querySelector('#waiting-screen')).toBeNull();
    expect(within(join.container).getByText('Game in Progress')).toBeInTheDocument();
    expect(within(join.container).queryByText('Your Character Token')).toBeNull();
    expect(within(join.container).queryByRole('img', { name: 'Beggar' })).toBeNull();
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

  it.each([false, true])('shows public Travelers in live Game Notes (spectator: %s)', spectator => {
    sessionStorage.setItem('joined-code', 'REVW');
    if (spectator) sessionStorage.setItem('joined-spectator', 'true');
    localStorage.setItem('player-tracker-botc-game', JSON.stringify({ phase: 'game', players: [] }));
    const screen = render(<PlayerTracker theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({
      type: 'game_update', customScriptRoles: [{ id: 'chef', name: 'Chef', team: 'townsfolk' }],
      players: [
        { id: 'traveler', name: 'Terry', roleId: 'beggar', isDead: false, isEvil: true, notes: 'secret' },
        { id: 'alice', name: 'Alice', roleId: 'imp', isDead: false },
      ],
    }));
    expect(within(screen.container).getAllByText('Beggar').length).toBeGreaterThan(0);
    const saved = JSON.parse(localStorage.getItem('player-tracker-botc-game')!);
    expect(saved.players[0]).toMatchObject({ roleId: 'beggar', roleIds: ['beggar'] });
    expect(saved.players[0].isEvil).toBeUndefined();
    expect(saved.players[0].notes).toBeUndefined();
    expect(saved.players[1].roleId).toBe('');
  });

  it('includes custom Travelers when first opening synced Game Notes', () => {
    sessionStorage.setItem('botc-player-id', 'viewer');
    sessionStorage.setItem('joined-code', 'REVW');
    sessionStorage.setItem('joined-name', 'Vera');
    const screen = render(<JoinPage theme="dark" toggleTheme={vi.fn()} />);
    act(() => transport.callbacks.get('REVW')!({
      type: 'code_valid', gameType: 'standard', playerId: 'viewer', spectator: true,
      customScriptRoles: [{ id: 'wanderer', name: 'Wanderer', team: 'traveler' }],
      players: [{ id: 'traveler', name: 'Terry', roleId: 'wanderer', isDead: false, isEvil: true }],
    }));
    fireEvent.click(within(screen.container).getByRole('button', { name: 'View Game Notes' }));
    const saved = JSON.parse(localStorage.getItem('player-tracker-botc-game')!);
    expect(saved.players[0]).toMatchObject({ roleId: 'wanderer', roleIds: ['wanderer'] });
    expect(saved.players[0].isEvil).toBeUndefined();
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
