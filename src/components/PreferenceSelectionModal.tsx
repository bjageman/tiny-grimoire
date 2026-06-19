import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../WhaleBucket';
import type { Role } from '../types';
import rolesData from '../roles.json';

interface PreferenceSelectionModalProps {
  activePrefModal: { playerId: string; team: Role['team'] };
  players: Player[];
  prefSearchTerm: string;
  setPrefSearchTerm: (term: string) => void;
  togglePreference: (playerId: string, team: Role['team'], roleId: string) => void;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setActivePrefModal: (val: { playerId: string; team: Role['team'] } | null) => void;
}

export default function PreferenceSelectionModal({
  activePrefModal,
  players,
  prefSearchTerm,
  setPrefSearchTerm,
  togglePreference,
  setPlayers,
  setActivePrefModal,
}: PreferenceSelectionModalProps) {
  const filteredPrefRoles = (rolesData as Role[]).filter(r => 
    r.team === activePrefModal.team &&
    r.name.toLowerCase().includes(prefSearchTerm.toLowerCase())
  );

  const currentPlayer = players.find(p => p.id === activePrefModal.playerId);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-lg p-4 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-white">
              Select {activePrefModal.team === 'townsfolk' ? 'Townsfolk' : activePrefModal.team === 'outsider' ? 'Outsiders' : activePrefModal.team === 'minion' ? 'Minions' : activePrefModal.team === 'demon' ? 'Demons' : 'Travelers'}
            </h3>
            <p className="text-xs text-gray-550">
              For {currentPlayer?.name} (select 1)
            </p>
          </div>
          <button onClick={() => setActivePrefModal(null)} className="text-xs text-clocktower-townsfolk hover:underline font-bold">
            Done
          </button>
        </div>

        <div className="flex items-center bg-gray-955 border border-gray-800 rounded px-2.5 py-1.5 text-sm">
          <Search size={14} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder={`Search character name...`}
            className="bg-transparent flex-1 outline-none text-white text-xs placeholder-gray-600"
            value={prefSearchTerm}
            onChange={(e) => setPrefSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
          {filteredPrefRoles.map(role => {
            const isSelected = currentPlayer?.preferences[activePrefModal.team]?.includes(role.id);
            
            return (
              <button
                key={role.id}
                onClick={() => {
                  togglePreference(activePrefModal.playerId, activePrefModal.team, role.id);
                  setActivePrefModal(null);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center",
                  isSelected && "bg-gray-800/30"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <img
                    src={`/icons/${role.id}.svg`}
                    alt={role.name}
                    className="w-5 h-5 object-contain shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className={cn(
                    "font-semibold text-xs truncate",
                    role.team === 'townsfolk' && "text-clocktower-townsfolk",
                    role.team === 'outsider' && "text-clocktower-outsider",
                    role.team === 'minion' && "text-clocktower-minion",
                    role.team === 'demon' && "text-clocktower-demon",
                    role.team === 'traveler' && "text-clocktower-traveler",
                  )}>
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
          {filteredPrefRoles.length === 0 && (
            <div className="p-4 text-xs text-gray-500 italic text-center">No characters found.</div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-2.5 border-t border-gray-800">
          <button
            onClick={() => {
              if (currentPlayer) {
                setPlayers(prev => prev.map(x => x.id === currentPlayer.id ? {
                  ...x,
                  preferences: { ...x.preferences, [activePrefModal.team]: [] }
                } : x));
              }
            }}
            className="text-xs text-gray-500 hover:text-red-400 hover:underline"
          >
            Clear Selection
          </button>
          <button
            onClick={() => {
              if (currentPlayer) {
                const available = (rolesData as Role[]).filter(r => r.team === activePrefModal.team);
                if (available.length > 0) {
                  const randIdx = Math.floor(Math.random() * available.length);
                  const r = available[randIdx];
                  setPlayers(prev => prev.map(x => x.id === currentPlayer.id ? {
                    ...x,
                    preferences: { ...x.preferences, [activePrefModal.team]: [r.id] }
                  } : x));
                }
              }
              setActivePrefModal(null);
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
