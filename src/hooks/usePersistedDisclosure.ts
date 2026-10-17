import { useState } from 'react';

export function usePersistedDisclosure(storageKey?: string) {
  const [isExpanded, setIsExpanded] = useState(() => (
    storageKey ? localStorage.getItem(storageKey) === 'true' : false
  ));

  const toggleExpanded = () => {
    setIsExpanded(current => {
      const next = !current;
      if (storageKey) localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  return { isExpanded, toggleExpanded };
}
