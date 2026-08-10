import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { useEscapeKey } from './useEscapeKey';

const pressEscape = () => fireEvent.keyDown(window, { key: 'Escape' });

describe('useEscapeKey', () => {
  it('calls the handler on Escape', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape));

    pressEscape();
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape));

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('does nothing while inactive', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape, false));

    pressEscape();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('only the most recently activated handler fires, so nested layers close one at a time', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    renderHook(() => useEscapeKey(outer));
    const innerHook = renderHook(() => useEscapeKey(inner));

    pressEscape();
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();

    // Once the inner layer unmounts, the outer one takes over again.
    innerHook.unmount();
    pressEscape();
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('uses the latest handler without re-registering', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useEscapeKey(fn), {
      initialProps: { fn: first },
    });

    rerender({ fn: second });
    pressEscape();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('detaches its listener once every caller is gone', () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(onEscape));
    unmount();

    pressEscape();
    expect(onEscape).not.toHaveBeenCalled();
  });
});
