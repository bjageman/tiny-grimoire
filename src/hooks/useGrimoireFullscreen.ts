import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useEscapeKey } from './useEscapeKey';
import { useScrollLock } from './useScrollLock';

export function useGrimoireFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const wantsFullscreenRef = useRef(false);
  const ownsBrowserFullscreenRef = useRef(false);
  const enterFullscreen = async () => {
    wantsFullscreenRef.current = true;
    setIsFullscreen(true);
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    ownsBrowserFullscreenRef.current = true;
    try {
      // Fullscreen the document so portalled player details and reminder dialogs stay visible.
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      if (!wantsFullscreenRef.current && document.fullscreenElement === document.documentElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Keep the expanded board usable when browser fullscreen is unavailable or denied.
      ownsBrowserFullscreenRef.current = false;
    }
  };
  const exitFullscreen = () => {
    wantsFullscreenRef.current = false;
    setIsFullscreen(false);
    fullscreenButtonRef.current?.focus({ preventScroll: true });
    if (ownsBrowserFullscreenRef.current && document.fullscreenElement === document.documentElement) {
      void document.exitFullscreen().catch(() => {});
    }
  };
  useScrollLock(isFullscreen);
  useEscapeKey(exitFullscreen, isFullscreen);

  useEffect(() => {
    if (isFullscreen) fullscreenButtonRef.current?.focus({ preventScroll: true });
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (ownsBrowserFullscreenRef.current && !document.fullscreenElement) {
        ownsBrowserFullscreenRef.current = false;
        wantsFullscreenRef.current = false;
        setIsFullscreen(false);
        fullscreenButtonRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      wantsFullscreenRef.current = false;
      if (ownsBrowserFullscreenRef.current && document.fullscreenElement === document.documentElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (isFullscreen) exitFullscreen();
    else void enterFullscreen();
  };

  const handleFullscreenKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isFullscreen || event.key !== 'Tab') return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
      .filter(button => button.getClientRects().length > 0);
    const target = event.shiftKey ? buttons[buttons.length - 1] : buttons[0];
    if (event.target === (event.shiftKey ? buttons[0] : buttons[buttons.length - 1])) {
      event.preventDefault();
      target?.focus();
    }
  };

  return { isFullscreen, fullscreenButtonRef, toggleFullscreen, handleFullscreenKeyDown };
}
