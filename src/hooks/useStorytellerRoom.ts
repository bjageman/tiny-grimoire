import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Player, PlayerPreferences } from '../types';
import { readPersistedField } from './usePersistedField';
import { useGameSocket } from './useGameSocket';

export interface PlayerJoin {
  type: 'player_join' | 'spectator_join';
  id: string;
  name: string;
  pronouns?: string;
  preferences?: PlayerPreferences;
  checkOnly?: boolean;
}

export type Spectator = Pick<Player, 'id' | 'name' | 'pronouns'>;

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
  const [spectators, setSpectators] = useState<Spectator[]>(() => readPersistedField(storageKey, 'spectators', []));
  const [bannedPlayers, setBannedPlayers] = useState<Pick<Player, 'id' | 'name'>[]>(() => readPersistedField(storageKey, 'bannedPlayers', []));
  const bannedPlayersRef = useRef(bannedPlayers);
  const spectatorsRef = useRef(spectators);
  const playersRef = useRef(players);
  const remotePlayerIdsRef = useRef(remotePlayerIds);
  const sendMessageRef = useRef<((payload: unknown) => Promise<boolean>) | null>(null);
  const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { remotePlayerIdsRef.current = remotePlayerIds; }, [remotePlayerIds]);
  useEffect(() => { spectatorsRef.current = spectators; }, [spectators]);
  useEffect(() => { bannedPlayersRef.current = bannedPlayers; }, [bannedPlayers]);

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
    if (payload.type !== 'player_join' && payload.type !== 'spectator_join') return;
    if (typeof payload.id !== 'string' || typeof payload.name !== 'string' || !payload.id || !payload.name.trim()) return;

    const roster = playersRef.current;
    const claimedIds = remotePlayerIdsRef.current;
    const normalizedName = payload.name.trim().toLowerCase();
    if (bannedPlayersRef.current.some(player => player.id === payload.id || player.name.trim().toLowerCase() === normalizedName)) {
      sendMessageRef.current?.({ type: 'banned', playerId: payload.id });
      return;
    }
    const sameName = (player: Pick<Player, 'name'>) => player.name.trim().toLowerCase() === normalizedName;
    if (roster.some(player => sameName(player) && player.id !== payload.id && claimedIds.has(player.id))
      || spectatorsRef.current.some(spectator => sameName(spectator) && spectator.id !== payload.id)) {
      sendMessageRef.current?.({ type: 'duplicate_name', playerId: payload.id, playerName: payload.name });
      return;
    }

    const wasSpectator = spectatorsRef.current.some(spectator => spectator.id === payload.id);
    const matches = (player: P) => player.id === payload.id || (!wasSpectator && payload.type === 'player_join' && sameName(player));
    const isExistingPlayer = roster.some(matches);
    const isSpectator = !isExistingPlayer && (payload.type === 'spectator_join' || phase === 'game');
    if (isSpectator) {
      if (!payload.checkOnly) {
        const spectator = { id: payload.id, name: payload.name.trim(), pronouns: payload.pronouns };
        spectatorsRef.current = [...spectatorsRef.current.filter(candidate => candidate.id !== payload.id), spectator];
        setSpectators(spectatorsRef.current);
      }
      sendMessageRef.current?.({
        type: 'code_valid', gameType, ...setupDetails, ...gameState,
        playerId: payload.id, playerName: payload.name, spectator: true,
      });
      return;
    }
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
      if (wasSpectator) {
        spectatorsRef.current = spectatorsRef.current.filter(spectator => spectator.id !== payload.id);
        setSpectators(spectatorsRef.current);
      }
      playersRef.current = updatedPlayers;
      remotePlayerIdsRef.current = new Set([...claimedIds, payload.id]);
      setRemotePlayerIds(remotePlayerIdsRef.current);
      setPlayers(updatedPlayers);
    }
    if (phase !== 'game') broadcastSetupUpdate(updatedPlayers);
    if (phase === 'game') sendMessageRef.current?.({ type: 'game_update', ...gameState });
  };

  const promoteSpectator = (id: string, roleId: string) => {
    const spectator = spectatorsRef.current.find(candidate => candidate.id === id);
    if (!spectator || playersRef.current.length >= 20 || playersRef.current.some(player => player.id === id)) return false;
    const player = { ...createPlayer({ type: 'player_join', ...spectator }), roleId };
    playersRef.current = [player, ...playersRef.current];
    setPlayers(playersRef.current);
    spectatorsRef.current = spectatorsRef.current.filter(candidate => candidate.id !== id);
    setSpectators(spectatorsRef.current);
    remotePlayerIdsRef.current = new Set([...remotePlayerIdsRef.current, id]);
    setRemotePlayerIds(remotePlayerIdsRef.current);
    return true;
  };

  const removeSyncedPlayer = (id: string, action: 'ban' | 'kick' | 'spectator') => {
    const player = playersRef.current.find(candidate => candidate.id === id);
    if (!player || !remotePlayerIdsRef.current.has(id)) return;
    if (action === 'ban') {
      bannedPlayersRef.current = [...bannedPlayersRef.current.filter(candidate => candidate.id !== id), { id, name: player.name }];
      setBannedPlayers(bannedPlayersRef.current);
    }
    if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
    playersRef.current = playersRef.current.filter(candidate => candidate.id !== id);
    setPlayers(playersRef.current);
    remotePlayerIdsRef.current = new Set([...remotePlayerIdsRef.current].filter(candidate => candidate !== id));
    setRemotePlayerIds(remotePlayerIdsRef.current);
    if (action === 'spectator') {
      const spectator = { id: player.id, name: player.name, pronouns: player.pronouns };
      spectatorsRef.current = [...spectatorsRef.current.filter(candidate => candidate.id !== id), spectator];
      setSpectators(spectatorsRef.current);
      sendMessageRef.current?.({
        type: 'code_valid', gameType, ...setupDetails, ...gameState,
        players: playersRef.current.map(({ notes, ...rest }) => rest),
        playerId: id, playerName: player.name, spectator: true,
      });
    } else {
      sendMessageRef.current?.({ type: action === 'ban' ? 'banned' : 'booted', playerId: id });
    }
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

  return { sendMessageRef, remotePlayerIds, setRemotePlayerIds, spectators, setSpectators, bannedPlayers, setBannedPlayers, promoteSpectator, removeSyncedPlayer, broadcastReset };
}
