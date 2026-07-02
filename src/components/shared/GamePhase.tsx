import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GripVertical, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Player, Role, PlacedReminder } from '../../types';
import rolesData from '../../roles.json';
import officialRoles from '../../official_roles.json';
import { getScriptStats } from '../../utils/scriptUtils';
import GrimoireBoard from './GrimoireBoard';
import NightOrderWidget from './NightOrderWidget';
import ScriptCharactersModal from './ScriptCharactersModal';
import DialogModal from './DialogModal';
import { useDialog } from '../../hooks/useDialog';

interface Props {
  players: Player[];
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  newTravelerName: string;
  newTravelerRoleId: string;
  isLightModeActive: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  setSelectedPlayerId: (id: string | null) => void;
  toggleTimeOfDay: () => void;
  addTravelerGamePhase: () => void;
  setNewTravelerName: (v: string) => void;
  setNewTravelerRoleId: (v: string) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onResetDead?: () => void;
  onResetTime?: () => void;
  // Optional / mode-specific
  selectionRoles?: Role[];
  showNightOrder?: boolean;
  scriptName?: string;
  customScriptRoles?: Role[] | null;
  isSynced?: boolean;
  enableReminders?: boolean;
  travelerCardTitle?: string;
  demonBluffs?: string[];
  onUpdateDemonBluffs?: (bluffs: string[]) => void;
  gameLog?: string[];
  onDownloadLog?: () => void;
  onDeclareWinner?: (team: 'good' | 'evil') => void;
  onLogEvent?: (message: string) => void;
  reminderTokens?: PlacedReminder[];
  onSetReminderTokens?: React.Dispatch<React.SetStateAction<PlacedReminder[]>>;
  checkedItems?: Record<string, boolean>;
  onSetCheckedItems?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  rotationOffset?: number;
  onRotationChange?: (offset: number) => void;
}

export default function GamePhase({
  players, timeOfDay, dayNumber, newTravelerName, newTravelerRoleId,
  isLightModeActive, draggedIndex, dragOverIndex,
  setSelectedPlayerId, toggleTimeOfDay, addTravelerGamePhase,
  setNewTravelerName, setNewTravelerRoleId,
  handleMouseDown, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleTouchStart, handleTouchMove, handleTouchEnd,
  onResetDead, onResetTime,
  selectionRoles,
  showNightOrder = true,
  scriptName = 'All Roles',
  customScriptRoles = null,
  isSynced = false,
  enableReminders = true,
  travelerCardTitle = 'Add Traveler',
  demonBluffs = [],
  onUpdateDemonBluffs,
  gameLog,
  onDownloadLog,
  onDeclareWinner,
  onLogEvent,
  reminderTokens: propReminderTokens,
  onSetReminderTokens,
  checkedItems,
  onSetCheckedItems,
  rotationOffset,
  onRotationChange,
}: Props) {

  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isBluffOverlayOpen, setIsBluffOverlayOpen] = useState(false);
  const [bluffPickerSlot, setBluffPickerSlot] = useState<number | null>(null);
  const [bluffSearch, setBluffSearch] = useState('');
  const [showAllBluffCandidates, setShowAllBluffCandidates] = useState(false);
  const bluffSearchRef = useRef<HTMLInputElement>(null);
  const [localReminderTokens, setLocalReminderTokens] = useState<PlacedReminder[]>([]);
  const reminderTokens = propReminderTokens !== undefined ? propReminderTokens : localReminderTokens;
  const setReminderTokens = onSetReminderTokens !== undefined ? onSetReminderTokens : setLocalReminderTokens;

  const handleAddReminder = (targetPlayerId: string, sourceCharId: string, text: string) => {
    const id = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    setReminderTokens(prev => [...prev, { id, sourceCharId, text, targetPlayerId }]);
    const targetName = players.find(p => p.id === targetPlayerId)?.name ?? targetPlayerId;
    const charName = (rolesData as Role[]).find(r => r.id === sourceCharId)?.name ?? sourceCharId;
    onLogEvent?.(`Reminder "${text} (${charName})" placed on ${targetName}`);
  };
  const handleRemoveReminder = (reminderId: string) => {
    const token = reminderTokens.find(r => r.id === reminderId);
    if (token) {
      const targetName = players.find(p => p.id === token.targetPlayerId)?.name ?? token.targetPlayerId;
      const charName = (rolesData as Role[]).find(r => r.id === token.sourceCharId)?.name ?? token.sourceCharId;
      onLogEvent?.(`Reminder "${token.text} (${charName})" removed from ${targetName}`);
    }
    setReminderTokens(prev => prev.filter(r => r.id !== reminderId));
  };
  const { dialogProps, showConfirm } = useDialog();

  const handleRemoveAllReminders = () => {
    showConfirm('Remove all reminder tokens?', () => {
      if (reminderTokens.length > 0) onLogEvent?.(`All reminders cleared`);
      setReminderTokens([]);
    }, 'Reset Reminders');
  };

  const sortedRoles = useMemo(() => {
    const baseRoles = customScriptRoles || (rolesData as Role[]);
    const roles = [...baseRoles];
    players.forEach(p => {
      const displayRoles = p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : []);
      displayRoles.forEach(roleId => {
        const rObj = (rolesData as Role[]).find(r => r.id === roleId);
        if (rObj && rObj.team === 'traveler' && !roles.some(r => r.id === rObj.id)) {
          roles.push(rObj);
        }
      });
    });
    return roles.sort((a, b) => a.name.localeCompare(b.name));
  }, [customScriptRoles, players]);

  const grimoireRolesData = selectionRoles ?? (officialRoles as Role[]);

  // Good roles not assigned to any player — candidates for demon bluffs
  const assignedRoleIds = useMemo(() => new Set(
    players.flatMap(p => p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : []))
  ), [players]);

  const bluffCandidates = useMemo(() => {
    const base = customScriptRoles || (rolesData as Role[]);
    const goodRoles = base.filter(r => r.team === 'townsfolk' || r.team === 'outsider');
    if (showAllBluffCandidates) {
      return [...goodRoles].sort((a, b) => a.name.localeCompare(b.name));
    }
    return goodRoles
      .filter(r => !assignedRoleIds.has(r.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customScriptRoles, assignedRoleIds, showAllBluffCandidates]);

  const officialRoleAbility = (id: string) =>
    (officialRoles as (Role & { ability?: string })[]).find(r => r.id === id)?.ability;

  const bluffTeamLabel: Record<Role['team'], string> = {
    townsfolk: 'Townsfolk',
    outsider: 'Outsider',
    minion: 'Minion',
    demon: 'Demon',
    traveler: 'Traveler',
  };

  const bluffTeamTextColor: Record<Role['team'], string> = {
    townsfolk: 'text-blue-400',
    outsider: 'text-emerald-400',
    minion: 'text-red-400',
    demon: 'text-red-600',
    traveler: 'text-purple-400',
  };

  const bluffTeamOverlayColor: Record<Role['team'], { border: string; bg: string; text: string }> = {
    townsfolk: { border: 'border-blue-500/50', bg: 'bg-blue-950/60', text: 'text-blue-300' },
    outsider: { border: 'border-emerald-500/50', bg: 'bg-emerald-950/60', text: 'text-emerald-300' },
    minion: { border: 'border-red-500/50', bg: 'bg-red-950/60', text: 'text-red-300' },
    demon: { border: 'border-red-700/50', bg: 'bg-red-950/80', text: 'text-red-400' },
    traveler: { border: 'border-purple-500/50', bg: 'bg-purple-950/60', text: 'text-purple-300' },
  };

  const filteredBluffCandidates = useMemo(() => {
    if (!bluffSearch.trim()) return bluffCandidates;
    const q = bluffSearch.toLowerCase();
    return bluffCandidates.filter(r =>
      r.name.toLowerCase().includes(q) || officialRoleAbility(r.id)?.toLowerCase().includes(q)
    );
  }, [bluffCandidates, bluffSearch]);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (bluffPickerSlot !== null && !isMobile) {
      setTimeout(() => bluffSearchRef.current?.focus(), 50);
    }
  }, [bluffPickerSlot, isMobile]);

  const setBluff = (slot: number, roleId: string) => {
    if (!onUpdateDemonBluffs) return;
    const next = [...demonBluffs];
    next[slot] = roleId;
    onUpdateDemonBluffs(next);
    setBluffPickerSlot(null);
    setBluffSearch('');
  };

  const clearBluff = (slot: number) => {
    if (!onUpdateDemonBluffs) return;
    const arr = [...demonBluffs];
    arr[slot] = '';
    onUpdateDemonBluffs(arr);
  };

  return (
    <>
    <DialogModal {...dialogProps} isLightModeActive={isLightModeActive} />
    <div className="space-y-6 animate-fadeIn md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:space-y-0 md:items-start landscape:grid landscape:grid-cols-[3fr_2fr] landscape:gap-6 landscape:space-y-0 landscape:items-start">
      {/* Column 1: Board & Night Order */}
      <div className="space-y-6">
        <div id="grimoire-board-container" className="space-y-4">
          <GrimoireBoard
            players={players}
            timeOfDay={timeOfDay}
            dayNumber={dayNumber}
            toggleTimeOfDay={!isSynced ? toggleTimeOfDay : undefined}
            onSelectPlayer={setSelectedPlayerId}
            rolesData={grimoireRolesData}
            onResetDead={onResetDead}
            onResetTime={onResetTime}
            isSynced={isSynced}
            isLightModeActive={isLightModeActive}
            reminderTokens={enableReminders ? reminderTokens : []}
            onAddReminder={enableReminders && !isSynced ? handleAddReminder : undefined}
            onRemoveReminder={enableReminders && !isSynced ? handleRemoveReminder : undefined}
            onRemoveAllReminders={enableReminders && !isSynced ? handleRemoveAllReminders : undefined}
            rotationOffset={rotationOffset}
            onRotationChange={onRotationChange}
          />
        </div>
        {showNightOrder && (
          <NightOrderWidget
            players={players}
            timeOfDay={timeOfDay}
            dayNumber={dayNumber}
            isLightModeActive={isLightModeActive}
            onToggleTimeOfDay={!isSynced ? toggleTimeOfDay : undefined}
            checkedItems={checkedItems}
            onSetCheckedItems={onSetCheckedItems}
          />
        )}
      </div>

      {/* Column 2: Controls */}
      <div id="grimoire-controls-container" className="space-y-6">

        {/* Active Script Display */}
        <button
          id="game-script-button"
          type="button"
          onClick={() => setIsScriptModalOpen(true)}
          className={cn(
            "w-full border py-3.5 px-4 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-colors duration-300 cursor-pointer focus:outline-none hover:opacity-90 active:scale-[0.98]",
            isLightModeActive
              ? "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-800"
              : "bg-gray-955 border-gray-800 hover:bg-gray-900 text-gray-300"
          )}
        >
          <span className={cn(
            "flex items-center gap-1.5 text-base font-extrabold transition-colors",
            isLightModeActive ? "text-gray-900" : "text-white"
          )}>
            📜 {scriptName}
          </span>
          {customScriptRoles && (
            <span className="text-[10px] text-gray-500 font-medium">
              {getScriptStats(customScriptRoles)}
            </span>
          )}
        </button>

        {/* Demon Bluffs — always dark, unaffected by theme */}
        {!isSynced && onUpdateDemonBluffs && (
          <div className="rounded-lg border p-3.5 space-y-2.5 bg-gray-900 border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Demon Bluffs</h4>
              {demonBluffs.some(b => b) && (
                <button
                  type="button"
                  onClick={() => setIsBluffOverlayOpen(true)}
                  className="text-xs font-bold px-2 py-0.5 rounded bg-clocktower-blood text-white hover:opacity-90 transition-opacity"
                >
                  Show Demon
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2].map(slot => {
                const roleId = demonBluffs[slot] || '';
                const role = roleId ? (rolesData as Role[]).find(r => r.id === roleId) : null;
                return (
                  <div key={slot} className="relative">
                    {bluffPickerSlot === slot ? (
                      <div className="rounded border p-2 space-y-1.5 bg-gray-950 border-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Search size={11} className="text-gray-400 shrink-0" />
                          <input
                            ref={bluffSearchRef}
                            type="text"
                            placeholder="Search roles..."
                            value={bluffSearch}
                            onChange={e => setBluffSearch(e.target.value)}
                            className="flex-1 text-xs bg-transparent focus:outline-none text-white placeholder-gray-500"
                          />
                          <button type="button" onClick={() => { setBluffPickerSlot(null); setBluffSearch(''); }}>
                            <X size={12} className="text-gray-400 hover:text-gray-200" />
                          </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-0.5">
                          {filteredBluffCandidates.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setBluff(slot, r.id)}
                              className="w-full text-left text-xs px-2 py-1 rounded transition-colors hover:bg-gray-800 text-gray-200"
                            >
                              <span className="font-medium">{r.name}</span>
                              <span className={cn('ml-1 text-[10px] font-semibold', bluffTeamTextColor[r.team])}>
                                {bluffTeamLabel[r.team]}
                              </span>
                            </button>
                          ))}
                          {filteredBluffCandidates.length === 0 && (
                            <p className="text-xs text-gray-500 px-2 py-1">No matching roles</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBluffPickerSlot(slot)}
                          className={cn(
                            'flex-1 text-left text-xs px-2.5 py-1.5 rounded border transition-colors',
                            role
                              ? 'border-gray-700 bg-gray-800 text-white font-medium'
                              : 'border-dashed border-gray-700 text-gray-500 hover:border-gray-500'
                          )}
                        >
                          {role ? (
                            <span className="flex items-center gap-1.5">
                              <div className="w-5 h-5 shrink-0 rounded-full bg-white flex items-center justify-center p-0.5">
                                <img src={`/icons/${role.id}.svg`} alt={role.name} className="w-full h-full object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                              <span>{role.name}</span>
                              <span className={cn('text-[10px] font-semibold', bluffTeamTextColor[role.team])}>
                                {bluffTeamLabel[role.team]}
                              </span>
                            </span>
                          ) : (
                            `Bluff ${slot + 1}…`
                          )}
                        </button>
                        {role && (
                          <button
                            type="button"
                            onClick={() => clearBluff(slot)}
                            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                            title="Clear"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none pt-0.5">
              <input
                type="checkbox"
                checked={showAllBluffCandidates}
                onChange={e => setShowAllBluffCandidates(e.target.checked)}
                className="accent-clocktower-blood"
              />
              Lunatic Mode
            </label>
          </div>
        )}

        {/* Declare Winner */}
        {!isSynced && onDeclareWinner && (
          <div className={cn(
            'rounded-lg border p-3.5 space-y-2.5 transition-colors duration-300',
            isLightModeActive
              ? 'bg-white/50 border-gray-300'
              : 'bg-gray-900/40 border-gray-800/80'
          )}>
            <h4 className={cn(
              'text-xs uppercase font-bold tracking-wider',
              isLightModeActive ? 'text-gray-600' : 'text-gray-500'
            )}>Declare Winner</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onDeclareWinner('good')}
                className="flex-1 py-2 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                🌟 Good Wins
              </button>
              <button
                type="button"
                onClick={() => onDeclareWinner('evil')}
                className="flex-1 py-2 rounded text-xs font-bold text-white bg-red-800 hover:bg-red-700 transition-colors"
              >
                😈 Evil Wins
              </button>
            </div>
          </div>
        )}

        {/* Add Traveler */}
        {!isSynced && (
          <div className={cn(
            'rounded-lg border p-3.5 space-y-3 transition-colors duration-300',
            isLightModeActive
              ? 'bg-white/50 border-gray-300 text-clocktower-night'
              : 'bg-gray-900/40 border-gray-800/80'
          )}>
            <h4 className={cn(
              'text-xs uppercase font-bold tracking-wider',
              isLightModeActive ? 'text-gray-600' : 'text-gray-500'
            )}>{travelerCardTitle}</h4>
            <div className="flex flex-col gap-2">
              <input
                id="game-traveler-name-input"
                type="text"
                placeholder="Traveler name..."
                value={newTravelerName}
                onChange={(e) => setNewTravelerName(e.target.value)}
                autoCapitalize="words"
                className={cn(
                  'w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border transition-colors',
                  isLightModeActive
                    ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
                    : 'bg-gray-955 border-gray-800 text-gray-200 focus:border-clocktower-blood'
                )}
              />
              <div className="flex gap-2">
                <select
                  id="game-traveler-role-select"
                  value={newTravelerRoleId}
                  onChange={(e) => setNewTravelerRoleId(e.target.value)}
                  className={cn(
                    'flex-1 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors',
                    isLightModeActive
                      ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
                      : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood'
                  )}
                >
                  {(rolesData as Role[]).filter(r => r.team === 'traveler').map(r => (
                    <option key={r.id} value={r.id} className={isLightModeActive ? 'bg-white text-clocktower-night' : 'bg-gray-955 text-gray-200'}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  id="game-add-traveler-button"
                  onClick={addTravelerGamePhase}
                  disabled={players.length >= 20}
                  className={cn(
                    'px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40 text-white shadow-sm',
                    isLightModeActive
                      ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                      : 'bg-clocktower-traveler hover:bg-purple-400 active:bg-purple-600'
                  )}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ledger */}
        <div id="grimoire-ledger-container" className={cn(
          'rounded-lg border p-3 space-y-1.5 transition-colors duration-300',
          isLightModeActive
            ? 'bg-white/50 border-gray-300 text-clocktower-night'
            : 'bg-gray-900/40 border-gray-800/80'
        )}>
          <div className="flex justify-between items-center mb-1">
            <h4 className={cn(
              'text-xs uppercase font-bold tracking-wider',
              isLightModeActive ? 'text-gray-655' : 'text-gray-500'
            )}>Grimoire Ledger Reference</h4>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {players.map((p, index) => {
              const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
              return (
                <div
                  id={`ledger-player-${p.id}`}
                  key={p.id}
                  data-drag-index={index}
                  draggable={!isSynced}
                  onMouseDown={isSynced ? undefined : handleMouseDown}
                  onDragStart={isSynced ? undefined : (e) => handleDragStart(e, index)}
                  onDragOver={isSynced ? undefined : (e) => handleDragOver(e, index)}
                  onDragLeave={isSynced ? undefined : handleDragLeave}
                  onDrop={isSynced ? undefined : (e) => handleDrop(e, index)}
                  onDragEnd={isSynced ? undefined : handleDragEnd}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 py-2.5 px-1.5 rounded border transition-all duration-200 min-w-0 hover:ring-1 hover:ring-gray-500/50 select-none cursor-pointer touch-auto',
                    p.isDead && 'opacity-45',
                    draggedIndex === index && 'opacity-20 border-2 border-dashed border-clocktower-blood bg-black/40 scale-[0.96]',
                    dragOverIndex === index && draggedIndex !== index && 'border-t-4 border-t-clocktower-blood bg-clocktower-blood/10 shadow-[0_4px_12px_rgba(139,0,0,0.15)] translate-y-0.5',
                    isLightModeActive
                      ? 'bg-white/40 border-gray-200 hover:bg-white/70'
                      : 'bg-gray-955/20 border-gray-900/40 hover:bg-gray-900/60'
                  )}
                >
                  {!isSynced && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
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
                      const isEvil = p.isEvil !== undefined
                        ? p.isEvil
                        : p.isTheLunatic
                        ? false
                        : p.isTheMarionette
                        ? true
                        : defaultEvil;
                      const hasAlignmentShift = (p.isEvil !== undefined && p.isEvil !== defaultEvil)
                        || p.isTheLunatic
                        || p.isTheMarionette;
                      return hasAlignmentShift ? (isEvil ? '👿' : '😇') : null;
                    })()}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 max-w-[55%] min-w-0 ml-auto justify-end flex-wrap">
                    {(() => {
                      const displayRoles = p.roleIds && p.roleIds.length > 0
                        ? p.roleIds
                        : (p.roleId
                            ? [p.roleId]
                            : p.isTheDrunk
                              ? ['drunk']
                              : p.isTheMarionette
                                ? ['marionette']
                                : p.isTheLunatic
                                  ? ['lunatic']
                                  : []);
                      if (displayRoles.length === 0) {
                        return <span className="text-gray-500 font-semibold text-[10px]">—</span>;
                      }
                      return displayRoles.map((roleId) => {
                        const rObj = (rolesData as Role[]).find(r => r.id === roleId);
                        if (!rObj) return null;
                        return (
                          <span
                            key={roleId}
                            className={cn(
                              'font-semibold text-[10px] flex items-center gap-1 shrink-0',
                              rObj.team === 'townsfolk' && 'text-clocktower-townsfolk',
                              rObj.team === 'outsider' && 'text-clocktower-outsider',
                              rObj.team === 'minion' && 'text-clocktower-minion',
                              rObj.team === 'demon' && 'text-clocktower-demon',
                              rObj.team === 'traveler' && 'text-clocktower-traveler',
                            )}
                          >
                            <span className="w-4.5 h-4.5 bg-white rounded-full flex items-center justify-center shrink-0">
                              <img src={`/icons/${rObj.id}.svg`} alt={rObj.name} className="w-3.5 h-3.5 object-contain"
                                onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                            </span>
                            <span className="truncate">{rObj.name}</span>
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

        {/* Game Log */}
        {!isSynced && onDownloadLog && (
          <div className={cn(
            'rounded-lg border p-3.5 space-y-2.5 transition-colors duration-300',
            isLightModeActive
              ? 'bg-white/50 border-gray-300'
              : 'bg-gray-900/40 border-gray-800/80'
          )}>
            <div className="flex items-center justify-between">
              <h4 className={cn(
                'text-xs uppercase font-bold tracking-wider',
                isLightModeActive ? 'text-gray-600' : 'text-gray-500'
              )}>Game Log</h4>
              {gameLog && gameLog.length > 0 && (
                <button
                  type="button"
                  onClick={onDownloadLog}
                  className="text-xs font-bold px-2 py-0.5 rounded bg-clocktower-blood text-white hover:opacity-90 transition-opacity"
                >
                  Download
                </button>
              )}
            </div>
            <div className={cn(
              'max-h-48 overflow-y-auto space-y-1 text-[10px] font-mono',
              isLightModeActive ? 'text-gray-700' : 'text-gray-400'
            )}>
              {gameLog && gameLog.length > 0
                ? gameLog.map((entry, i) => (
                    <p key={i} className="leading-relaxed whitespace-pre-wrap">{entry}</p>
                  ))
                : <p className={cn('italic', isLightModeActive ? 'text-gray-400' : 'text-gray-600')}>No entries yet.</p>
              }
            </div>
          </div>
        )}
      </div>

      <ScriptCharactersModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        scriptName={scriptName}
        roles={sortedRoles}
        scriptStats={customScriptRoles ? getScriptStats(customScriptRoles) : undefined}
        isLightModeActive={isLightModeActive}
      />

      {/* Demon Bluffs full-screen overlay — always dark */}
      {isBluffOverlayOpen && (
        <div
          id="demon-bluffs-overlay"
          className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center gap-8 p-8 cursor-pointer"
          onClick={() => setIsBluffOverlayOpen(false)}
        >
          <p className="text-gray-400 text-xs uppercase tracking-widest font-bold select-none">Demon Bluffs — tap to close</p>
          <div className="flex flex-col gap-5 w-full max-w-sm">
            {[0, 1, 2].map(slot => {
              const roleId = demonBluffs[slot] || '';
              const role = roleId ? (rolesData as Role[]).find(r => r.id === roleId) : null;
              const overlayColor = role ? bluffTeamOverlayColor[role.team] : null;
              return (
                <div
                  key={slot}
                  className={cn(
                    'rounded-xl border-2 px-5 py-4 flex items-center gap-4',
                    overlayColor ? `${overlayColor.border} ${overlayColor.bg}` : 'border-gray-800 bg-gray-900/50'
                  )}
                >
                  {role ? (
                    <>
                      <div className="w-16 h-16 shrink-0 rounded-full bg-white flex items-center justify-center p-1">
                        <img
                          src={`/icons/${role.id}.svg`}
                          alt={role.name}
                          className="w-full h-full object-contain"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-2xl font-extrabold',
                          overlayColor?.text
                        )}>{role.name}</p>
                        {officialRoleAbility(role.id) && (
                          <p className="text-sm text-gray-300 mt-1 leading-snug">{officialRoleAbility(role.id)}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600 text-lg">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
