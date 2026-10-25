import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, within } from '@testing-library/react';
import StandardSetup from './StandardSetup';
import WhaleBucket from './WhaleBucket';
import PlayerTracker from './PlayerTracker';
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
