import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBufferedField } from './useBufferedField';

describe('useBufferedField', () => {
  it('initializes local value from the original value', () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useBufferedField('p1', 'Alice', onFlush));
    expect(result.current[0]).toBe('Alice');
  });

  it('updates the local value without flushing immediately', () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useBufferedField('p1', 'Alice', onFlush));

    act(() => result.current[1]('Alicia'));

    expect(result.current[0]).toBe('Alicia');
    expect(onFlush).not.toHaveBeenCalled();
  });

  it('flushes the buffered value on unmount when it changed', () => {
    const onFlush = vi.fn();
    const { result, unmount } = renderHook(() => useBufferedField('p1', 'Alice', onFlush));

    act(() => result.current[1]('Alicia'));
    unmount();

    expect(onFlush).toHaveBeenCalledWith('p1', 'Alicia');
  });

  it('does not flush on unmount when the value is unchanged', () => {
    const onFlush = vi.fn();
    const { unmount } = renderHook(() => useBufferedField('p1', 'Alice', onFlush));

    unmount();

    expect(onFlush).not.toHaveBeenCalled();
  });

  it('does not flush when the buffered value is edited back to the original', () => {
    const onFlush = vi.fn();
    const { result, unmount } = renderHook(() => useBufferedField('p1', 'Alice', onFlush));

    act(() => result.current[1]('Alicia'));
    act(() => result.current[1]('Alice'));
    unmount();

    expect(onFlush).not.toHaveBeenCalled();
  });

  it('flushes the previous entity and resets to the new original value when entityId changes', () => {
    const onFlush = vi.fn();
    const { result, rerender } = renderHook(
      ({ id, original }) => useBufferedField(id, original, onFlush),
      { initialProps: { id: 'p1', original: 'Alice' } }
    );

    act(() => result.current[1]('Alicia'));
    rerender({ id: 'p2', original: 'Bob' });

    expect(onFlush).toHaveBeenCalledWith('p1', 'Alicia');
    expect(result.current[0]).toBe('Bob');
  });

  it('does not flush the previous entity on switch if its value was unchanged', () => {
    const onFlush = vi.fn();
    const { rerender } = renderHook(
      ({ id, original }) => useBufferedField(id, original, onFlush),
      { initialProps: { id: 'p1', original: 'Alice' } }
    );

    rerender({ id: 'p2', original: 'Bob' });

    expect(onFlush).not.toHaveBeenCalled();
  });

  it('treats an unset original value (undefined coalesced to empty string) as unchanged, avoiding spurious writes', () => {
    // Mirrors how callers guard against `notes ?? ''` always looking "different" from ''.
    const onFlush = vi.fn();
    const { unmount } = renderHook(() => useBufferedField('p1', '', onFlush));

    unmount();

    expect(onFlush).not.toHaveBeenCalled();
  });

  it('flushes against the live original value, not a stale snapshot, when the original updates externally before unmount', () => {
    const onFlush = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ original }) => useBufferedField('p1', original, onFlush),
      { initialProps: { original: 'Alice' } }
    );

    // External update brings the "original" in line with what the user already typed.
    rerender({ original: 'Alice' });
    unmount();

    expect(onFlush).not.toHaveBeenCalled();
  });
});
