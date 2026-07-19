import { useEffect, useRef, useState } from 'react';

/**
 * Buffers a text field locally per entity (e.g. a player id) and only flushes
 * it via onFlush when the entity changes or the component unmounts, instead
 * of writing on every keystroke.
 */
export function useBufferedField(
  entityId: string,
  originalValue: string,
  onFlush: (id: string, value: string) => void
) {
  const [value, setValue] = useState(originalValue);
  const lastEntityId = useRef(entityId);
  const lastValue = useRef(value);
  const lastOriginalValue = useRef(originalValue);
  const onFlushRef = useRef(onFlush);

  useEffect(() => {
    onFlushRef.current = onFlush;
  }, [onFlush]);

  useEffect(() => {
    lastValue.current = value;
  }, [value]);

  useEffect(() => {
    if (entityId !== lastEntityId.current) {
      const prevId = lastEntityId.current;
      const prevValue = lastValue.current;
      // Compare against the outgoing entity's own original value, or switching entities in one render spuriously flushes.
      if (prevValue !== lastOriginalValue.current) {
        onFlushRef.current(prevId, prevValue);
      }
      lastEntityId.current = entityId;
      setValue(originalValue);
    }
    lastOriginalValue.current = originalValue;
  }, [entityId, originalValue]);

  useEffect(() => {
    return () => {
      if (lastValue.current !== lastOriginalValue.current) {
        onFlushRef.current(lastEntityId.current, lastValue.current);
      }
    };
  }, []);

  return [value, setValue] as const;
}
