import { useState } from 'react';

export function usePersistedDisclosure(storageKey?: string, defaultExpanded = false) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const storedValue = storageKey ? localStorage.getItem(storageKey) : null;
    return storedValue === null ? defaultExpanded : storedValue === 'true';
  });

  const toggleExpanded = () => {
    setIsExpanded(current => {
      const next = !current;
      if (storageKey) localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  return { isExpanded, toggleExpanded };
}
