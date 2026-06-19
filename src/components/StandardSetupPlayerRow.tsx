import React from 'react';
import { Trash2, ChevronUp, ChevronDown, GripVertical, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player, Role } from '../types';
import rolesData from '../roles.json';

interface StandardSetupPlayerRowProps {
  player: Player;
  index: number;
  players: Player[];
  customScriptRoles: Role[] | null;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  movePlayer: (index: number, direction: 'up' | 'down') => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  setActivePlayerId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  togglePlayerTheDrunk: (id: string) => void;
  togglePlayerTheMarionette: (id: string) => void;
  togglePlayerTheLunatic: (id: string) => void;
}

export default function StandardSetupPlayerRow({
  player: p,
  index,
  players,
  customScriptRoles,
  draggedIndex,
  dragOverIndex,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  movePlayer,
  removePlayer,
  updatePlayerName,
  setActivePlayerId,
  setSearchTerm,
  togglePlayerTheDrunk,
  togglePlayerTheMarionette,
  togglePlayerTheLunatic,
}: StandardSetupPlayerRowProps) {
  const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
  
  const hasDrunkInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'drunk');
  const hasMarionetteInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'marionette');

  const isTownsfolk = roleObj?.team === 'townsfolk';
  const isGood = roleObj?.team === 'townsfolk' || roleObj?.team === 'outsider';

  const N = players.length;
  const leftNeighbor = players[(index - 1 + N) % N];
  const rightNeighbor = players[(index + 1) % N];
  const leftRoleObj = (rolesData as Role[]).find(r => r.id === leftNeighbor?.roleId);
  const rightRoleObj = (rolesData as Role[]).find(r => r.id === rightNeighbor?.roleId);
  const isLeftDemon = leftRoleObj?.team === 'demon' && !leftNeighbor?.isTheLunatic;
  const isRightDemon = rightRoleObj?.team === 'demon' && !rightNeighbor?.isTheLunatic;
  const isNextToDemon = isLeftDemon || isRightDemon;

  const canBeDrunk = p.isTheDrunk || (isTownsfolk && hasDrunkInScript);
  const canBeMarionette = p.isTheMarionette || (isGood && isNextToDemon && hasMarionetteInScript);

  const hasLunaticInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'lunatic');
  const isDemon = roleObj?.team === 'demon';
  const canBeLunatic = p.isTheLunatic || (isDemon && hasLunaticInScript);

  const isDrunkSelectedElsewhere = players.some(pl => pl.id !== p.id && pl.isTheDrunk);
  const isMarionetteSelectedElsewhere = players.some(pl => pl.id !== p.id && pl.isTheMarionette);
  const isLunaticSelectedElsewhere = players.some(pl => pl.id !== p.id && pl.isTheLunatic);

  return (
    <div
      draggable={true}
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      className={cn(
        "bg-gray-900/60 p-3 rounded-lg border border-gray-800/50 space-y-2 transition-all",
        draggedIndex === index && "opacity-40 border-dashed border-clocktower-blood/50 scale-[0.98]",
        dragOverIndex === index && draggedIndex !== index && "border-t-2 border-t-clocktower-blood bg-gray-800/20"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 p-0.5 shrink-0 flex items-center">
          <GripVertical size={14} />
        </div>
        <span className="text-xs text-gray-500 font-mono w-5">#{index + 1}</span>
        <input
          id={`player-name-input-${p.id}`}
          type="text"
          value={p.name}
          onChange={(e) => updatePlayerName(p.id, e.target.value)}
          onFocus={(e) => e.target.select()}
          autoCapitalize="words"
          className="flex-grow min-w-0 font-semibold text-gray-200 bg-transparent border-b border-transparent hover:border-gray-800/80 focus:border-clocktower-blood focus:outline-none px-1.5 py-0.5 rounded transition-all"
        />
        {p.isTheDrunk && (
          <span className="text-[8px] font-black text-black bg-yellow-600 border border-yellow-750 px-1 py-0.5 rounded uppercase leading-none">
            THE DRUNK
          </span>
        )}
        {p.isTheMarionette && (
          <span className="text-[8px] font-black text-white bg-clocktower-minion border border-clocktower-minion/30 px-1 py-0.5 rounded uppercase leading-none">
            THE MARIONETTE
          </span>
        )}
        {p.isTheLunatic && (
          <span className="text-[8px] font-black text-white bg-clocktower-outsider border border-clocktower-outsider/30 px-1 py-0.5 rounded uppercase leading-none">
            THE LUNATIC
          </span>
        )}
        <div className="flex gap-0.5 items-center bg-gray-955/45 px-1 py-0.5 rounded border border-gray-850">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => movePlayer(index, 'up')}
            className="text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:hover:text-gray-500 transition-colors p-0.5"
            title="Move player up"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            disabled={index === players.length - 1}
            onClick={() => movePlayer(index, 'down')}
            className="text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:hover:text-gray-500 transition-colors p-0.5"
            title="Move player down"
          >
            <ChevronDown size={12} />
          </button>
        </div>
        <button id={`remove-player-${p.id}`} onClick={() => removePlayer(p.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {p.roleId ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-gray-955/40 px-3 py-2 rounded border border-gray-855">
            <div className="flex items-center gap-2">
              {roleObj && (
                <img
                  src={`/icons/${roleObj.id}.svg`}
                  alt={roleObj.name}
                  className="w-5 h-5 object-contain shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span className={cn(
                "text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border",
                roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
                roleObj?.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
                roleObj?.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
                roleObj?.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
                roleObj?.team === 'traveler' && "text-clocktower-traveler border-clocktower-traveler/40 bg-clocktower-traveler/5",
              )}>
                {roleObj?.team || 'N/A'}
              </span>
              <span className={cn(
                "font-semibold text-sm",
                roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                roleObj?.team === 'outsider' && "text-clocktower-outsider",
                roleObj?.team === 'minion' && "text-clocktower-minion",
                roleObj?.team === 'demon' && "text-clocktower-demon",
                roleObj?.team === 'traveler' && "text-clocktower-traveler",
              )}>
                {roleObj?.name}
              </span>
            </div>
            <button
              id={`change-role-button-${p.id}`}
              onClick={() => { setActivePlayerId(p.id); setSearchTerm(''); }}
              className="text-gray-550 hover:text-gray-300 text-xs underline font-medium"
            >
              Change
            </button>
          </div>

          {/* Secret Role Draft Toggles */}
          {(canBeDrunk || canBeMarionette || canBeLunatic) && (
            <div className="flex flex-wrap gap-2 justify-end">
              {canBeDrunk && (
                <button
                  id={`toggle-drunk-button-${p.id}`}
                  type="button"
                  disabled={isDrunkSelectedElsewhere}
                  onClick={() => togglePlayerTheDrunk(p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-500",
                    p.isTheDrunk
                      ? "bg-yellow-600 border-yellow-755 text-black font-black"
                      : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                  )}
                >
                  🍺 The Drunk
                </button>
              )}
              {canBeMarionette && (
                <button
                  id={`toggle-marionette-button-${p.id}`}
                  type="button"
                  disabled={isMarionetteSelectedElsewhere}
                  onClick={() => togglePlayerTheMarionette(p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-500",
                    p.isTheMarionette
                      ? "bg-clocktower-minion border-clocktower-minion/40 text-white font-black"
                      : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                  )}
                >
                  🎭 The Marionette
                </button>
              )}
              {canBeLunatic && (
                <button
                  id={`toggle-lunatic-button-${p.id}`}
                  type="button"
                  disabled={isLunaticSelectedElsewhere}
                  onClick={() => togglePlayerTheLunatic(p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-500",
                    p.isTheLunatic
                      ? "bg-clocktower-outsider border-clocktower-outsider/40 text-white font-black"
                      : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                  )}
                >
                  👹 The Lunatic
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          id={`select-role-placeholder-${p.id}`}
          onClick={() => { setActivePlayerId(p.id); setSearchTerm(''); }}
          className="flex items-center bg-gray-800/50 rounded px-3 py-1.5 border border-gray-700/60 cursor-pointer text-sm text-gray-400 hover:border-gray-600 transition-colors"
        >
          <Search size={14} className="mr-2 text-gray-500" />
          Tap to select role...
        </div>
      )}
    </div>
  );
}
