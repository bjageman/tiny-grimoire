import React, { useState } from 'react';
import { Search, Shuffle, Trash2 } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBufferedField } from '../../hooks/useBufferedField';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import rolesData from '../../official_roles.json';

interface WhaleBucketPlayerPreferenceModalProps {
  activePlayerId: string;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  allowTravelers: boolean;
  excludedRoleIds: string[];
  isLightModeActive: boolean;
  updatePlayerName: (id: string, name: string) => void;
  removePlayer: (id: string) => void;
  togglePreference: (playerId: string, team: Role['team'], roleId: string) => void;
  autoFillPlayerPreferences: (playerId: string) => void;
  isSecondary?: boolean;
  onClose: () => void;
}

const TEAM_LABELS: Record<Role['team'], string> = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsider',
  minion: 'Minion',
  demon: 'Demon',
  traveler: 'Traveler',
};

const teamTextClass = (team: Role['team']) => ({
  townsfolk: 'text-clocktower-townsfolk',
  outsider: 'text-clocktower-outsider',
  minion: 'text-clocktower-minion',
  demon: 'text-clocktower-demon',
  traveler: 'text-clocktower-traveler',
}[team]);

export default function WhaleBucketPlayerPreferenceModal({
  activePlayerId,
  players,
  setPlayers,
  allowTravelers,
  excludedRoleIds,
  isLightModeActive,
  updatePlayerName,
  removePlayer,
  togglePreference,
  autoFillPlayerPreferences,
  isSecondary,
  onClose,
}: WhaleBucketPlayerPreferenceModalProps) {
  useScrollLock();
  const isMobile = useIsMobile();

  const [pickingTeam, setPickingTeam] = useState<Role['team'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const player = players.find(p => p.id === activePlayerId);

  const [editedName, setEditedName] = useBufferedField(activePlayerId, player?.name ?? '', updatePlayerName);

  if (!player) return null;

  const visibleTeams: Role['team'][] = allowTravelers
    ? ['townsfolk', 'outsider', 'minion', 'demon', 'traveler']
    : ['townsfolk', 'outsider', 'minion', 'demon'];

  if (pickingTeam) {
    const filteredRoles = (rolesData as Role[])
      .filter(r =>
        r.team === pickingTeam &&
        !excludedRoleIds.includes(r.id) &&
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    const currentRoleId = player.preferences?.[pickingTeam]?.[0];

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div
          className={cn(
            "w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[85vh] flex flex-col shadow-2xl",
            isLightModeActive
              ? "bg-[#fdfaf2] border border-clocktower-blood/30 text-clocktower-night"
              : "bg-gray-900 border border-gray-800"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <div>
              <button onClick={() => setPickingTeam(null)} className="text-xs text-gray-500 hover:underline">&larr; Back</button>
              <h3 className="font-display font-bold text-sm text-white tracking-wider uppercase mt-1">
                Select {TEAM_LABELS[pickingTeam]}
              </h3>
            </div>
            <button onClick={onClose} className="text-xs text-gray-500 underline">Close</button>
          </div>

          <div className="flex items-center bg-white border border-gray-300 rounded px-2.5 py-2 text-sm">
            <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              autoFocus={!isMobile}
              placeholder="Search character name..."
              className="bg-transparent flex-1 outline-none text-gray-900 placeholder-gray-400 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto overscroll-contain flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
            {filteredRoles.map(role => {
              const isSelected = role.id === currentRoleId;
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    togglePreference(player.id, pickingTeam, role.id);
                    setPickingTeam(null);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center",
                    isSelected && "bg-gray-800/30"
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
                      <img
                        src={`/icons/${role.id}.svg`}
                        alt={role.name}
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                      />
                    </span>
                    <span className={cn("font-semibold text-xs truncate", teamTextClass(role.team))}>
                      {role.name}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-550/20 px-1.5 py-0.5 rounded font-black">
                      ✓ ACTIVE
                    </span>
                  ) : (
                    <span className="text-[9px] text-gray-650 font-mono">+ ADD</span>
                  )}
                </button>
              );
            })}
            {filteredRoles.length === 0 && (
              <div className="p-4 text-xs text-gray-500 italic text-center">No characters found.</div>
            )}
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-gray-800">
            <button
              onClick={() => {
                setPlayers(prev => prev.map(x => x.id === player.id ? {
                  ...x,
                  preferences: { ...x.preferences, [pickingTeam]: [] }
                } : x));
                setPickingTeam(null);
              }}
              className="text-xs text-gray-500 hover:text-red-400 hover:underline"
            >
              Clear Selection
            </button>
            <button
              onClick={() => {
                const available = (rolesData as Role[]).filter(r => r.team === pickingTeam && !excludedRoleIds.includes(r.id));
                if (available.length > 0) {
                  const r = available[Math.floor(Math.random() * available.length)];
                  setPlayers(prev => prev.map(x => x.id === player.id ? {
                    ...x,
                    preferences: { ...x.preferences, [pickingTeam]: [r.id] }
                  } : x));
                }
                setPickingTeam(null);
              }}
              className="text-xs text-clocktower-townsfolk hover:underline font-semibold"
            >
              Select Random
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        id="whalebucket-player-preference-modal"
        className={cn(
          "w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[85vh] flex flex-col shadow-2xl",
          isLightModeActive
            ? "bg-[#fdfaf2] border border-clocktower-blood/30 text-clocktower-night"
            : "bg-gray-900 border border-gray-800"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-sm text-gray-200 tracking-wider uppercase">
            Edit Player
          </h3>
          <button id="close-preference-modal-button" onClick={onClose} className="text-xs text-gray-500 underline">
            Close
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(() => {
            const isSecondaryDevice = !!isSecondary;
            return (
              <>
                <button
                  id="remove-preference-player-button"
                  type="button"
                  disabled={isSecondaryDevice}
                  onClick={() => { if (!isSecondaryDevice) { removePlayer(player.id); onClose(); } }}
                  className={cn(
                    "shrink-0 p-2 rounded border border-gray-800 transition-colors",
                    isSecondaryDevice 
                      ? "text-gray-700 border-gray-800/45 cursor-not-allowed opacity-40" 
                      : "text-gray-500 hover:text-red-500 hover:border-red-500/40"
                  )}
                  title={isSecondaryDevice ? "This action is disabled on secondary devices." : "Remove player"}
                >
                  <Trash2 size={16} />
                </button>
                <input
                  id="edit-preference-player-name-input"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); onClose(); } }}
                  autoFocus={!isMobile}
                  autoCapitalize="words"
                  placeholder="Player name"
                  className="flex-1 min-w-0 bg-gray-955 border border-gray-855 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm font-semibold"
                />
              </>
            );
          })()}
          <button
            id="auto-fill-preferences-button"
            type="button"
            onClick={() => autoFillPlayerPreferences(player.id)}
            className="shrink-0 p-2 rounded border border-gray-855 text-gray-500 hover:text-clocktower-townsfolk hover:border-clocktower-townsfolk/40 transition-colors"
            title="Auto-fill remaining preferences"
          >
            <Shuffle size={16} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 space-y-2">
          {visibleTeams.map(team => {
            const roleId = player.preferences?.[team]?.[0];
            const roleObj = roleId ? (rolesData as Role[]).find(r => r.id === roleId) : undefined;
            return (
              <button
                key={team}
                type="button"
                onClick={() => { setPickingTeam(team); setSearchTerm(''); }}
                className="w-full flex items-center justify-between bg-gray-955/40 px-3 py-2 rounded border border-gray-855 hover:bg-gray-900/40 hover:border-gray-800 transition-all"
              >
                <span className={cn("text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border", teamTextClass(team), `border-current/30`)}>
                  {TEAM_LABELS[team]}
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                  {roleObj ? (
                    <>
                      <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
                        <img
                          src={`/icons/${roleObj.id}.svg`}
                          alt={roleObj.name}
                          className="w-3.5 h-3.5 object-contain"
                          onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                        />
                      </span>
                      <span className={cn("text-xs font-semibold truncate", teamTextClass(team))}>{roleObj.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500 italic">No preference</span>
                  )}
                  <span className="text-gray-550 text-[10px] underline ml-1 shrink-0">Change</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
