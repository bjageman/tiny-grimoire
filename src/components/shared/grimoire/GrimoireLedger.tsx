import { ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { roleIconFallback } from '../../../utils/roleIcon';
import { seatIsEvil } from '../../../utils/playerSeat';
import { displayRoleIds } from '../../../utils/discordRecap';
import type { Player, Role } from '../../../types';

// Drag-and-drop wiring passed straight through from the container that owns the reorder state.
interface LedgerDnd {
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface GrimoireLedgerProps {
  isLightModeActive: boolean;
  isSynced: boolean;
  players: Player[];
  roles: Role[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectPlayer: (id: string) => void;
  dnd: LedgerDnd;
}

// Compact seating/role reference list beside the grimoire, reorderable by drag when not synced.
export default function GrimoireLedger({ isLightModeActive, isSynced, players, roles, collapsed, onToggleCollapsed, onSelectPlayer, dnd }: GrimoireLedgerProps) {
  return (
    <div id="grimoire-ledger-container" className={cn(
      'rounded-lg border p-3 space-y-1.5 transition-colors duration-300',
      isLightModeActive
        ? 'bg-white/50 border-gray-300 text-clocktower-night'
        : 'bg-gray-900/40 border-gray-800/80'
    )}>
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        className="w-full flex justify-between items-center mb-1 text-left"
      >
        <h4 className={cn(
          'text-xs uppercase font-bold tracking-wider',
          isLightModeActive ? 'text-gray-655' : 'text-gray-500'
        )}>Grimoire Ledger Reference</h4>
        <ChevronDown
          size={14}
          className={cn(
            'md:hidden shrink-0 transition-transform duration-200',
            isLightModeActive ? 'text-gray-655' : 'text-gray-500',
            !collapsed && 'rotate-180'
          )}
        />
      </button>
      <div className={cn(
        'gap-1.5 text-xs grid-cols-1',
        collapsed ? 'hidden md:grid' : 'grid'
      )}>
        {players.map((p, index) => {
          const rObj = roles.find(r => r.id === p.roleId);
          return (
            <div
              id={`ledger-player-${p.id}`}
              key={p.id}
              data-drag-index={index}
              draggable={!isSynced}
              onMouseDown={isSynced ? undefined : dnd.onMouseDown}
              onDragStart={isSynced ? undefined : (e) => dnd.onDragStart(e, index)}
              onDragOver={isSynced ? undefined : (e) => dnd.onDragOver(e, index)}
              onDragLeave={isSynced ? undefined : dnd.onDragLeave}
              onDrop={isSynced ? undefined : (e) => dnd.onDrop(e, index)}
              onDragEnd={isSynced ? undefined : dnd.onDragEnd}
              onClick={() => onSelectPlayer(p.id)}
              className={cn(
                'flex items-center gap-1.5 py-2.5 px-1.5 rounded border transition-all duration-200 min-w-0 hover:ring-1 hover:ring-gray-500/50 select-none cursor-pointer touch-auto',
                p.isDead && 'opacity-45',
                dnd.draggedIndex === index && 'opacity-20 border-2 border-dashed border-clocktower-blood bg-black/40 scale-[0.96]',
                dnd.dragOverIndex === index && dnd.draggedIndex !== index && 'border-t-4 border-t-clocktower-blood bg-clocktower-blood/10 shadow-[0_4px_12px_rgba(139,0,0,0.15)] translate-y-0.5',
                isLightModeActive
                  ? 'bg-white/40 border-gray-200 hover:bg-white/70'
                  : 'bg-gray-955/20 border-gray-900/40 hover:bg-gray-900/60'
              )}
            >
              {!isSynced && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => dnd.onTouchStart(e, index)}
                  onTouchMove={dnd.onTouchMove}
                  onTouchEnd={dnd.onTouchEnd}
                  className="text-gray-555 p-0.5 shrink-0 flex items-center transition-opacity duration-200 drag-handle opacity-60 hover:opacity-100 cursor-move touch-none"
                >
                  <GripVertical size={10} />
                </div>
              )}
              <span className={cn('text-[9px] font-mono w-4 shrink-0', isLightModeActive ? 'text-gray-505' : 'text-gray-600')}>{index + 1}</span>
              <span className={cn(
                'font-medium truncate flex-1 min-w-0 flex items-center gap-1',
                p.isDead && 'line-through text-gray-500',
                isLightModeActive && !p.isDead ? 'text-clocktower-night' : 'text-gray-200'
              )}>
                <span className="truncate">{p.name}</span>
                {(() => {
                  const defaultEvil = rObj ? (rObj.team === 'minion' || rObj.team === 'demon') : false;
                  const isEvil = seatIsEvil(p, rObj);
                  const hasAlignmentShift = (p.isEvil !== undefined && p.isEvil !== defaultEvil)
                    || p.isTheLunatic
                    || p.isTheMarionette;
                  return hasAlignmentShift ? (isEvil ? '👿' : '😇') : null;
                })()}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 max-w-[55%] min-w-0 ml-auto justify-end flex-wrap">
                {(() => {
                  const roleIds = displayRoleIds(p).filter((id): id is string => Boolean(id));
                  if (roleIds.length === 0) {
                    return <span className="text-gray-500 font-semibold text-[10px]">—</span>;
                  }
                  return roleIds.map((roleId) => {
                    const roleObj = roles.find(r => r.id === roleId);
                    if (!roleObj) return null;
                    return (
                      <span
                        key={roleId}
                        className={cn(
                          'font-semibold text-[10px] flex items-center gap-1 shrink-0',
                          roleObj.team === 'townsfolk' && 'text-clocktower-townsfolk',
                          roleObj.team === 'outsider' && 'text-clocktower-outsider',
                          roleObj.team === 'minion' && 'text-clocktower-minion',
                          roleObj.team === 'demon' && 'text-clocktower-demon',
                          roleObj.team === 'traveler' && 'text-clocktower-traveler',
                        )}
                      >
                        <span className="w-5 h-5 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0">
                          <img key={roleObj.id} src={`/icons/${roleObj.id}.svg`} alt={roleObj.name} className="w-3.5 h-3.5 object-contain"
                            onError={roleIconFallback(roleObj, roleObj.team === 'minion' || roleObj.team === 'demon')} />
                        </span>
                        <span className="truncate">{roleObj.name}</span>
                      </span>
                    );
                  });
                })()}
                {p.isTheDrunk && <span className="text-[8px] bg-yellow-600 text-black px-0.5 rounded leading-none shrink-0">DK</span>}
                {p.isTheMarionette && <span className="text-[8px] bg-clocktower-minion text-white px-0.5 rounded leading-none shrink-0">MN</span>}
                {p.isTheLunatic && <span className="text-[8px] bg-clocktower-outsider text-white px-0.5 rounded leading-none shrink-0">LN</span>}
                {p.isTheLilMonsta && <span className="text-[8px] bg-clocktower-demon text-white px-0.5 rounded leading-none shrink-0">LM</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
