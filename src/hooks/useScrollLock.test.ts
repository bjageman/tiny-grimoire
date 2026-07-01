import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollLock } from './useScrollLock';

describe('useScrollLock', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('locks the body at the current scroll offset instead of just hiding overflow', () => {
    Object.defineProperty(window, 'scrollY', { value: 480, configurable: true });

    renderHook(() => useScrollLock());

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-480px');
    expect(document.body.style.width).toBe('100%');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores the prior body styles and scroll position on unmount', () => {
    document.body.style.position = 'static';
    document.body.style.top = '10px';
    document.body.style.width = '50%';
    document.body.style.overflow = 'auto';
    Object.defineProperty(window, 'scrollY', { value: 733, configurable: true });

    const { unmount } = renderHook(() => useScrollLock());

    unmount();

    expect(document.body.style.position).toBe('static');
    expect(document.body.style.top).toBe('10px');
    expect(document.body.style.width).toBe('50%');
    expect(document.body.style.overflow).toBe('auto');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 733);
  });

  it('does nothing when disabled', () => {
    Object.defineProperty(window, 'scrollY', { value: 200, configurable: true });

    renderHook(() => useScrollLock(false));

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.overflow).toBe('');
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('applies and releases the lock when toggled from disabled to enabled and back', () => {
    Object.defineProperty(window, 'scrollY', { value: 150, configurable: true });

    const { rerender } = renderHook(({ enabled }) => useScrollLock(enabled), {
      initialProps: { enabled: false },
    });
    expect(document.body.style.overflow).toBe('');

    rerender({ enabled: true });
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-150px');
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ enabled: false });
    expect(document.body.style.overflow).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 150);
  });
});
