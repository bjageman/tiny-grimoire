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
  const sendSyncRef = useRef<((payload: unknown) => Promise<void>) | null>(null);
  const lastAppliedSyncRef = useRef<string | null>(null);

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
    };

    if (payload.type === 'storyteller_sync_request') {
      if (!isSecondary && sendSyncRef.current) {
        sendSyncRef.current({
          type: 'storyteller_state_sync',
          state: localStateRef.current,
        });
      }
    } else if (payload.type === 'storyteller_state_sync' && payload.state) {
      const incomingStr = JSON.stringify(payload.state);
      lastAppliedSyncRef.current = incomingStr;
      onApplySyncRef.current(payload.state);
      setHasReceivedSync(true);
    }
  }, [isSecondary]);

  const { sendMessage: sendSyncMessage } = useGameSocket(syncCode, handleIncomingSyncMessage);

  useEffect(() => {
    sendSyncRef.current = sendSyncMessage;
  }, [sendSyncMessage]);

  useEffect(() => {
    if (isSecondary && sendSyncMessage) {
      const timer = setTimeout(() => {
        sendSyncMessage({ type: 'storyteller_sync_request' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSecondary, sendSyncMessage]);

  const localStateStr = JSON.stringify(localState);

  useEffect(() => {
    if (sendSyncMessage && hasReceivedSync) {
      if (localStateStr === lastAppliedSyncRef.current) {
        return;
      }
      sendSyncMessage({
        type: 'storyteller_state_sync',
        state: localState,
      });
      lastAppliedSyncRef.current = localStateStr;
    }
  }, [localStateStr, sendSyncMessage, hasReceivedSync, localState]);

  return {
    hasReceivedSync,
  };
}
