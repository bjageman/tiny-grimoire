import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameSocket } from './useGameSocket';

interface MockWebSocket {
  url: string;
  close: () => void;
  send: (data: string) => void;
  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (event: { data: string }) => void;
  onerror?: (error: unknown) => void;
}

describe('useGameSocket', () => {
  let originalWebSocket: typeof WebSocket;
  let originalFetch: typeof fetch;
  let mockWsInstances: MockWebSocket[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    originalWebSocket = globalThis.WebSocket;
    originalFetch = globalThis.fetch;
    mockWsInstances = [];

    // Mock WebSocket
    globalThis.WebSocket = vi.fn().mockImplementation(function (this: MockWebSocket, url: string) {
      this.url = url;
      this.close = vi.fn().mockImplementation(() => {
        if (this.onclose) this.onclose();
      });
      this.send = vi.fn();
      mockWsInstances.push(this);
      return this;
    }) as unknown as typeof WebSocket;

    // Mock fetch
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response)
    );
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should establish websocket connection with correct url', () => {
    renderHook(() => useGameSocket('ABCDE', () => {}));

    expect(globalThis.WebSocket).toHaveBeenCalledTimes(1);
    expect(mockWsInstances[0].url).toBe('wss://ntfy.sh/botc-companion-abcde/ws');
  });

  it('should set isConnected to true on open and false on close', () => {
    const { result } = renderHook(() => useGameSocket('ABCDE', () => {}));

    expect(result.current.isConnected).toBe(false);

    act(() => {
      mockWsInstances[0].onopen?.();
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      mockWsInstances[0].onclose?.();
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('should parse incoming messages and call onMessage callback', () => {
    const onMessageMock = vi.fn();
    renderHook(() => useGameSocket('ABCDE', onMessageMock));

    act(() => {
      mockWsInstances[0].onmessage?.({
        data: JSON.stringify({
          message: JSON.stringify({ type: 'TEST', value: 123 }),
        }),
      });
    });

    expect(onMessageMock).toHaveBeenCalledWith({ type: 'TEST', value: 123 });
  });

  it('should handle unparseable or non-JSON messages gracefully', () => {
    const onMessageMock = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHook(() => useGameSocket('ABCDE', onMessageMock));

    act(() => {
      mockWsInstances[0].onmessage?.({ data: 'invalid json' });
    });

    expect(onMessageMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should reconnect on close after 3 seconds', () => {
    renderHook(() => useGameSocket('ABCDE', () => {}));

    expect(globalThis.WebSocket).toHaveBeenCalledTimes(1);

    act(() => {
      mockWsInstances[0].onclose?.();
    });

    expect(globalThis.WebSocket).toHaveBeenCalledTimes(1);

    // Fast-forward 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
    expect(mockWsInstances[1].url).toBe('wss://ntfy.sh/botc-companion-abcde/ws');
  });

  it('should cleanup connection on unmount', () => {
    const { unmount } = renderHook(() => useGameSocket('ABCDE', () => {}));

    const closeSpy = vi.spyOn(mockWsInstances[0], 'close');
    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should publish message via fetch POST when sendMessage is called', async () => {
    const { result } = renderHook(() => useGameSocket('ABCDE', () => {}));

    await act(async () => {
      await result.current.sendMessage({ action: 'reveal' });
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://ntfy.sh/botc-companion-abcde',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'reveal' }),
      })
    );
  });
});
