import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameSocket } from './useGameSocket';

export function getSyncParams() {
  const hash = window.location.hash;
  const search = window.location.search;
  const queryStr = hash.includes('?') ? hash.split('?')[1] : search;
  const params = new URLSearchParams(queryStr);
  const isSecondary = params.has('syncCode');
  const urlSync = params.get('syncCode');
  const urlGame = params.get('gameCode');
  return { isSecondary, urlSync, urlGame };
}

interface UseStorytellerSyncProps<T> {
  isSecondary: boolean;
  syncCode: string;
  localState: T;
  onApplySync: (incoming: T) => void;
}

export function useStorytellerSync<T>({
  isSecondary,
  syncCode,
  localState,
  onApplySync,
}: UseStorytellerSyncProps<T>) {
  const [prevSyncCode, setPrevSyncCode] = useState(syncCode);
  const [hasReceivedSync, setHasReceivedSync] = useState(!isSecondary);

  if (syncCode !== prevSyncCode) {
    setPrevSyncCode(syncCode);
    setHasReceivedSync(!isSecondary);
  }
  const sendSyncRef = useRef<((payload: unknown) => Promise<boolean>) | null>(null);
  const lastAppliedSyncRef = useRef<string | null>(null);
  const syncRequestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [senderId] = useState(() => crypto.randomUUID());
  const sequenceRef = useRef(0);
  const receivedSequencesRef = useRef(new Map<string, number>());

  const publishState = useCallback((state: T) => {
    sendSyncRef.current?.({
      type: 'storyteller_state_sync',
      state,
      senderId,
      sequence: ++sequenceRef.current,
    });
  }, [senderId]);

  const onApplySyncRef = useRef(onApplySync);
  useEffect(() => {
    onApplySyncRef.current = onApplySync;
  }, [onApplySync]);

  const localStateRef = useRef(localState);
  useEffect(() => {
    localStateRef.current = localState;
  }, [localState]);

  const handleIncomingSyncMessage = useCallback((data: unknown) => {
    const payload = data as {
      type: string;
      state?: T;
      senderId?: string;
      sequence?: number;
    };

    if (payload.type === 'storyteller_sync_request') {
      if (!isSecondary && sendSyncRef.current) {
        publishState(localStateRef.current);
      }
    } else if (payload.type === 'storyteller_state_sync' && payload.state) {
      if (payload.senderId === senderId) return;
      if (typeof payload.senderId === 'string' && typeof payload.sequence === 'number') {
        const key = `${syncCode}:${payload.senderId}`;
        const lastSequence = receivedSequencesRef.current.get(key) ?? -1;
        if (payload.sequence <= lastSequence) return;
        receivedSequencesRef.current.set(key, payload.sequence);
      }
      if (syncRequestIntervalRef.current) clearInterval(syncRequestIntervalRef.current);
      const incomingStr = JSON.stringify(payload.state);
      lastAppliedSyncRef.current = incomingStr;
      onApplySyncRef.current(payload.state);
      setHasReceivedSync(true);
    }
  }, [isSecondary, senderId, syncCode, publishState]);

  const { isConnected, sendMessage: sendSyncMessage } = useGameSocket(syncCode, handleIncomingSyncMessage);

  useEffect(() => {
    sendSyncRef.current = sendSyncMessage;
  }, [sendSyncMessage]);

  useEffect(() => {
    if (!isSecondary || !isConnected) return;
    const requestState = () => sendSyncRef.current?.({ type: 'storyteller_sync_request' });
    requestState();
    const interval = setInterval(requestState, 2000);
    syncRequestIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [isSecondary, isConnected, syncCode]);

  const localStateStr = JSON.stringify(localState);

  useEffect(() => {
    if (hasReceivedSync) {
      if (localStateStr === lastAppliedSyncRef.current) {
        return;
      }
      publishState(localState);
      lastAppliedSyncRef.current = localStateStr;
    }
  }, [localStateStr, sendSyncMessage, hasReceivedSync, localState, publishState]);

  return {
    hasReceivedSync,
  };
}
