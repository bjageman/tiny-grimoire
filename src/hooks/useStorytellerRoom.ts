import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Player, PlayerPreferences } from '../types';
import { readPersistedField } from './usePersistedField';
import { useGameSocket } from './useGameSocket';

export interface PlayerJoin {
  type: 'player_join';
  id: string;
  name: string;
  pronouns?: string;
  preferences?: PlayerPreferences;
  checkOnly?: boolean;
}

interface StorytellerRoomOptions<P extends Player> {
  storageKey: string;
  gameCode: string;
  gameType: 'standard' | 'whale-bucket';
  isSecondary: boolean;
  phase: 'setup' | 'draft' | 'game';
  players: P[];
  setPlayers: Dispatch<SetStateAction<P[]>>;
  maxPlayers: number;
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  setupDetails: Record<string, unknown>;
  gameDetails: Record<string, unknown>;
  createPlayer: (payload: PlayerJoin) => P;
  updatePlayer: (player: P, payload: PlayerJoin) => P;
}

export function useStorytellerRoom<P extends Player>({
  storageKey, gameCode, gameType, isSecondary, phase, players, setPlayers, maxPlayers,
  timeOfDay, dayNumber, setupDetails, gameDetails, createPlayer, updatePlayer,
}: StorytellerRoomOptions<P>) {
  const [remotePlayerIds, setRemotePlayerIds] = useState(() => new Set(
    readPersistedField<string[]>(storageKey, 'remotePlayerIds', [])
  ));
  const playersRef = useRef(players);
  const remotePlayerIdsRef = useRef(remotePlayerIds);
  const sendMessageRef = useRef<((payload: unknown) => Promise<boolean>) | null>(null);
  const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { remotePlayerIdsRef.current = remotePlayerIds; }, [remotePlayerIds]);

  const gameState = useMemo(() => ({
    ...gameDetails,
    players: players.map(({ notes, ...rest }) => rest),
    timeOfDay,
    dayNumber,
  }), [gameDetails, players, timeOfDay, dayNumber]);

  const broadcastSetupUpdate = useCallback((list: P[]) => {
    if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
    broadcastTimeoutRef.current = setTimeout(() => {
      sendMessageRef.current?.({
        type: 'setup_update', gameType, ...setupDetails,
        players: list.map(({ notes, ...rest }) => rest),
      });
    }, 1000);
  }, [gameType, setupDetails]);

  const broadcastReset = useCallback((list: P[]) => {
    sendMessageRef.current?.({ type: 'game_reset', gameType });
    sendMessageRef.current?.({
      type: 'setup_update', gameType, ...setupDetails,
      players: list.map(({ notes, ...rest }) => rest),
    });
  }, [gameType, setupDetails]);

  const handleIncomingMessage = (data: unknown) => {
    if (!data || typeof data !== 'object') return;
    const payload = data as PlayerJoin;
    if (payload.type !== 'player_join') return;
    if (typeof payload.id !== 'string' || typeof payload.name !== 'string' || !payload.id || !payload.name.trim()) return;

    const roster = playersRef.current;
    const claimedIds = remotePlayerIdsRef.current;
    const normalizedName = payload.name.trim().toLowerCase();
    const sameName = (player: P) => player.name.trim().toLowerCase() === normalizedName;
    if (roster.some(player => sameName(player) && player.id !== payload.id && claimedIds.has(player.id))) {
      sendMessageRef.current?.({ type: 'duplicate_name', playerId: payload.id, playerName: payload.name });
      return;
    }

    const matches = (player: P) => player.id === payload.id || sameName(player);
    const isExistingPlayer = roster.some(matches);
    if (phase === 'game' && !isExistingPlayer) return;
    if (!isExistingPlayer && roster.length >= maxPlayers) {
      sendMessageRef.current?.({ type: 'room_full', playerId: payload.id, playerName: payload.name });
      return;
    }

    sendMessageRef.current?.({
      type: 'code_valid', gameType, ...setupDetails, playerId: payload.id, playerName: payload.name,
    });

    const updatedPlayers = payload.checkOnly ? roster : isExistingPlayer
      ? roster.map(player => matches(player) ? updatePlayer(player, payload) : player)
      : [...roster, createPlayer(payload)];

    if (!payload.checkOnly) {
      playersRef.current = updatedPlayers;
      remotePlayerIdsRef.current = new Set([...claimedIds, payload.id]);
      setRemotePlayerIds(remotePlayerIdsRef.current);
      setPlayers(updatedPlayers);
    }
    if (phase !== 'game') broadcastSetupUpdate(updatedPlayers);
    if (phase === 'game') sendMessageRef.current?.({ type: 'game_update', ...gameState });
  };

  const { sendMessage } = useGameSocket(isSecondary ? '' : gameCode, handleIncomingMessage);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    if (!isSecondary && phase === 'game') sendMessage({ type: 'game_update', ...gameState });
  }, [isSecondary, phase, sendMessage, gameState]);

  useEffect(() => {
    if (!isSecondary && phase !== 'game') {
      const timer = setTimeout(() => broadcastSetupUpdate(players), 500);
      return () => clearTimeout(timer);
    }
  }, [isSecondary, phase, players, broadcastSetupUpdate]);

  useEffect(() => () => {
    if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
  }, [phase, isSecondary]);

  return { sendMessageRef, remotePlayerIds, setRemotePlayerIds, broadcastReset };
}
