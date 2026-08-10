import { useEffect, useRef } from 'react';

// Escape must dismiss one layer at a time, so active callers form a stack and only the newest handles the key.
const handlers: { current: () => void }[] = [];

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  handlers[handlers.length - 1]?.current();
};

/** Calls onEscape when Escape is pressed, but only while this caller is the topmost active one. */
export function useEscapeKey(onEscape: () => void, isActive = true) {
  const handlerRef = useRef(onEscape);

  useEffect(() => {
    handlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive) return;
    const entry = handlerRef;
    handlers.push(entry);
    if (handlers.length === 1) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      const index = handlers.lastIndexOf(entry);
      if (index !== -1) handlers.splice(index, 1);
      if (handlers.length === 0) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isActive]);
}
