import { Search } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player, Role } from '../types';

interface StandardRoleSelectionModalProps {
  activePlayerId: string;
  players: Player[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  updatePlayerRole: (playerId: string, roleId: string) => void;
  setActivePlayerId: (id: string | null) => void;
  isLightModeActive: boolean;
  selectionRoles: Role[];
}

export default function StandardRoleSelectionModal({
  activePlayerId,
  players,
  searchTerm,
  setSearchTerm,
  updatePlayerRole,
  setActivePlayerId,
  isLightModeActive,
  selectionRoles,
}: StandardRoleSelectionModalProps) {
  const player = players.find(p => p.id === activePlayerId);
  const filteredRoles = selectionRoles.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-300">
            Select Role for {player?.name}
          </h3>
          <button id="close-role-modal-button" onClick={() => { setActivePlayerId(null); setSearchTerm(''); }} className="text-xs text-gray-500 underline">
            Close
          </button>
        </div>

        <div className="flex items-center bg-gray-955 border border-gray-800 rounded px-3 py-2 text-sm">
          <Search size={14} className="text-gray-500 mr-2" />
          <input
            id="role-search-input"
            type="text"
            autoFocus
            placeholder="Search character name..."
            className="bg-transparent flex-1 outline-none text-xs text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
          {filteredRoles.map(role => {
            const selectedByPlayer = players.find(pl => pl.roleId === role.id && pl.id !== activePlayerId);
            return (
              <button
                id={`role-option-${role.id}`}
                key={role.id}
                onClick={() => {
                  updatePlayerRole(activePlayerId, role.id);
                  setActivePlayerId(null);
                  setSearchTerm('');
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center"
              >
                <div className="flex items-center min-w-0 flex-1 gap-1.5 mr-2">
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
                  )}>
                    {role.name}
                  </span>
                  {selectedByPlayer && (
                    <span className={cn(
                      "text-[8px] px-1 py-0.5 rounded shrink-0 font-medium border",
                      isLightModeActive 
                        ? "bg-gray-100 border-gray-200 text-gray-655" 
                        : "bg-gray-800/40 border-gray-700/30 text-gray-400"
                    )}>
                      Taken: {selectedByPlayer.name}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-mono text-gray-650">{role.team[0]}</span>
              </button>
            );
          })}
          {filteredRoles.length === 0 && (
            <div className="p-3 text-xs text-gray-500 italic text-center">No matching roles found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
