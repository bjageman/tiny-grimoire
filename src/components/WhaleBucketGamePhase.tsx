import React, { useState, useMemo, useEffect } from 'react';
import { GripVertical, X, Search, Scroll } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../WhaleBucket';
import type { Role } from '../types';
import { getScriptStats } from '../utils/scriptUtils';
import rolesData from '../official_roles.json';
import allRolesData from '../roles.json';
import GrimoireBoard from './GrimoireBoard';
import NightOrderWidget from './NightOrderWidget';

interface WhaleBucketGamePhaseProps {
  players: Player[];
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  newTravelerName: string;
  newTravelerRoleId: string;
  isLightModeActive: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  setSelectedPlayerId: (id: string | null) => void;
  toggleTimeOfDay: () => void;
  addTravelerGamePhase: () => void;
  setNewTravelerName: (name: string) => void;
  setNewTravelerRoleId: (roleId: string) => void;
  onResetDead?: () => void;
  onResetTime?: () => void;
}

export default function WhaleBucketGamePhase({
  players,
  timeOfDay,
  dayNumber,
  newTravelerName,
  newTravelerRoleId,
  isLightModeActive,
  draggedIndex,
  dragOverIndex,
  handleMouseDown,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  setSelectedPlayerId,
  toggleTimeOfDay,
  addTravelerGamePhase,
  setNewTravelerName,
  setNewTravelerRoleId,
  onResetDead,
  onResetTime,
}: WhaleBucketGamePhaseProps) {
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedRoleForInfo, setSelectedRoleForInfo] = useState<Role | null>(null);

  const scriptName = "All Roles (Default)";
  const customScriptRoles = null;


  // Listen for Escape key to close the script modal or details modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRoleForInfo) {
          setSelectedRoleForInfo(null);
        } else if (isScriptModalOpen) {
          setIsScriptModalOpen(false);
          setModalSearchTerm('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScriptModalOpen, selectedRoleForInfo]);

  useEffect(() => {
    if (isScriptModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isScriptModalOpen]);

  const sortedRoles = useMemo(() => {
    const roles = [...(rolesData as Role[])];
    // Include travelers that are active in the grimoire
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
  }, [players]);

  const filteredRoles = useMemo(() => {
    if (!modalSearchTerm.trim()) return sortedRoles;
    const term = modalSearchTerm.toLowerCase();
    return sortedRoles.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.team.toLowerCase().includes(term)
    );
  }, [sortedRoles, modalSearchTerm]);

  const townsfolk = useMemo(() => filteredRoles.filter(r => r.team === 'townsfolk'), [filteredRoles]);
  const outsiders = useMemo(() => filteredRoles.filter(r => r.team === 'outsider'), [filteredRoles]);
  const minions = useMemo(() => filteredRoles.filter(r => r.team === 'minion'), [filteredRoles]);
  const demons = useMemo(() => filteredRoles.filter(r => r.team === 'demon'), [filteredRoles]);
  const travelers = useMemo(() => filteredRoles.filter(r => r.team === 'traveler'), [filteredRoles]);

  return (
    <div className="space-y-6 animate-fadeIn md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:space-y-0 md:items-start landscape:grid landscape:grid-cols-[3fr_2fr] landscape:gap-6 landscape:space-y-0 landscape:items-start">
      {/* Column 1: Board Visual & Header & Night Order */}
      <div className="space-y-6">
        <div id="grimoire-board-container" className="space-y-4">
          <GrimoireBoard
            players={players}
            timeOfDay={timeOfDay}
            dayNumber={dayNumber}
            toggleTimeOfDay={toggleTimeOfDay}
            onSelectPlayer={setSelectedPlayerId}
            rolesData={rolesData as Role[]}
            onResetDead={onResetDead}
            onResetTime={onResetTime}
            isLightModeActive={isLightModeActive}
          />
        </div>
        <NightOrderWidget
          players={players}
          timeOfDay={timeOfDay}
          dayNumber={dayNumber}
          isLightModeActive={isLightModeActive}
        />
      </div>

      {/* Column 2: Ledger & Controls */}
      <div className="space-y-6 md:pt-10 landscape:pt-10">
        {/* Active Script Display */}
        <button
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
            {customScriptRoles ? "📜" : "🌐"} {scriptName}
          </span>
          {customScriptRoles && (
            <span className="text-[10px] text-gray-500 font-medium">
              {getScriptStats(customScriptRoles)}
            </span>
          )}
        </button>

        {/* Add Traveler Card (Late Arrival) */}
        <div className={cn(
          "rounded-lg border p-3.5 space-y-3 transition-colors duration-300",
          isLightModeActive
            ? "bg-white/50 border-gray-300 text-clocktower-night"
            : "bg-gray-900/40 border-gray-800/80"
        )}>
          <h4 className={cn(
            "text-[10px] uppercase font-bold tracking-wider",
            isLightModeActive ? "text-gray-600" : "text-gray-500"
          )}>Add Traveler (Late Arrival)</h4>
          
          <div className="flex flex-col gap-2">
            <input
              id="game-traveler-name-input"
              type="text"
              placeholder="Traveler name..."
              value={newTravelerName}
              onChange={(e) => setNewTravelerName(e.target.value)}
              autoCapitalize="words"
              className={cn(
                "w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border transition-colors",
                isLightModeActive
                  ? "bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood"
                  : "bg-gray-955 border-gray-800 text-gray-200 focus:border-clocktower-blood"
              )}
            />
            
            <div className="flex gap-2">
              <select
                id="game-traveler-role-select"
                value={newTravelerRoleId}
                onChange={(e) => setNewTravelerRoleId(e.target.value)}
                className={cn(
                  "flex-1 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors",
                  isLightModeActive
                    ? "bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood"
                    : "bg-gray-955 border-gray-800 text-gray-200 focus:border-clocktower-blood"
                )}
              >
                {(allRolesData as Role[]).filter(r => r.team === 'traveler').map(r => (
                  <option
                    key={r.id}
                    value={r.id}
                    className={isLightModeActive ? "bg-white text-clocktower-night" : "bg-gray-950 text-gray-200"}
                  >
                    {r.name}
                  </option>
                ))}
              </select>
              
              <button
                id="game-add-traveler-button"
                onClick={addTravelerGamePhase}
                disabled={players.length >= 20}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40 text-white shadow-sm",
                  isLightModeActive
                    ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
                    : "bg-clocktower-traveler hover:bg-purple-400 active:bg-purple-600"
                )}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className={cn(
          "rounded-lg border p-3 space-y-1.5 transition-colors duration-300",
          isLightModeActive
            ? "bg-white/50 border-gray-300 text-clocktower-night"
            : "bg-gray-900/40 border-gray-800/80"
        )}>
          <div className="flex justify-between items-center mb-1">
            <h4 className={cn(
              "text-[10px] uppercase font-bold tracking-wider",
              isLightModeActive ? "text-gray-600" : "text-gray-500"
            )}>Grimoire Ledger Reference</h4>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {players.map((p, index) => {
              const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
              return (
                <div
                  key={p.id}
                  data-drag-index={index}
                  draggable={true}
                  onMouseDown={handleMouseDown}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    "flex items-center gap-1.5 py-2.5 px-1.5 rounded border transition-all duration-200 min-w-0 hover:ring-1 hover:ring-gray-500/50 select-none cursor-pointer touch-auto",
                    p.isDead && "opacity-45",
                    draggedIndex === index && "opacity-20 border-2 border-dashed border-clocktower-blood bg-black/40 scale-[0.96]",
                    dragOverIndex === index && draggedIndex !== index && "border-t-4 border-t-clocktower-blood bg-clocktower-blood/10 shadow-[0_4px_12px_rgba(139,0,0,0.15)] translate-y-0.5",
                    isLightModeActive
                      ? "bg-white/40 border-gray-200 hover:bg-white/70"
                      : "bg-gray-955/20 border-gray-900/40 hover:bg-gray-900/60"
                  )}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="text-gray-500 p-0.5 shrink-0 flex items-center transition-opacity duration-200 drag-handle opacity-60 hover:opacity-100 cursor-move touch-none"
                  >
                    <GripVertical size={10} />
                  </div>
                  <span className={cn("text-[9px] font-mono w-4 shrink-0", isLightModeActive ? "text-gray-550" : "text-gray-600")}>{index + 1}</span>
                  <span className={cn(
                    "font-medium truncate flex-1 min-w-0 flex items-center gap-1",
                    p.isDead && "line-through text-gray-500",
                    isLightModeActive && !p.isDead ? "text-clocktower-night" : "text-gray-200"
                  )}>
                    <span className="truncate">{p.name}</span>
                    {(() => {
                      const defaultEvil = rObj ? (rObj.team === 'minion' || rObj.team === 'demon') : false;
                      const isEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;
                      const hasAlignmentShift = p.isEvil !== undefined && p.isEvil !== defaultEvil;
                      return hasAlignmentShift ? (isEvil ? '👿' : '😇') : null;
                    })()}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 max-w-[55%] min-w-0 ml-auto justify-end flex-wrap">
                    {(() => {
                      const displayRoles = p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : []);
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
                              "font-semibold text-[10px] flex items-center gap-1 shrink-0",
                              rObj.team === 'townsfolk' && "text-clocktower-townsfolk",
                              rObj.team === 'outsider' && "text-clocktower-outsider",
                              rObj.team === 'minion' && "text-clocktower-minion",
                              rObj.team === 'demon' && "text-clocktower-demon",
                              rObj.team === 'traveler' && "text-clocktower-traveler",
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

        
      </div>

      {/* Script Characters List Modal */}
      {isScriptModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setIsScriptModalOpen(false);
            setModalSearchTerm('');
          }}
        >
          <div 
            className={cn(
              "w-full max-w-2xl rounded-lg p-5 flex flex-col shadow-2xl transition-all duration-300 max-h-[85vh]",
              isLightModeActive 
                ? "bg-[#fdfaf2] border border-amber-900/10 text-gray-800" 
                : "bg-gray-900 border border-gray-800 text-gray-150"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className={cn(
                  "font-bold text-2xl leading-tight flex items-center gap-2",
                  isLightModeActive ? "text-clocktower-blood" : "text-white"
                )}>
                  <Scroll size={20} className={isLightModeActive ? "text-clocktower-blood" : "text-clocktower-townsfolk"} />
                  {scriptName}
                </h3>
                {customScriptRoles && (
                  <p className="text-xs text-gray-550 font-medium mt-1">
                    {getScriptStats(customScriptRoles)}
                  </p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsScriptModalOpen(false);
                  setModalSearchTerm('');
                }}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isLightModeActive 
                    ? "text-gray-500 hover:bg-gray-250/50 hover:text-gray-800" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center rounded-lg px-3 py-2 text-sm mb-4 border transition-colors bg-white border-gray-300 focus-within:border-clocktower-blood">
              <Search size={16} className="text-gray-500 mr-2 flex-shrink-0" />
              <input
                id="script-search-input"
                type="text"
                placeholder="Search character by name or type..."
                className="bg-transparent flex-1 outline-none text-xs text-gray-900 placeholder-gray-400 w-full"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
              />
              {modalSearchTerm && (
                <button
                  type="button"
                  onClick={() => setModalSearchTerm('')}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Roles List grouped by team */}
            <div className="overflow-y-auto flex-1 space-y-5 pr-1 select-none">
              
              {/* Townsfolk */}
              {townsfolk.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-clocktower-townsfolk border-b border-clocktower-townsfolk/15 pb-1 flex items-center gap-1.5">
                    🔵 Townsfolk <span className="text-[10px] text-gray-500 font-normal font-mono">({townsfolk.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {townsfolk.map(role => (
                      <button 
                        type="button"
                        key={role.id}
                        onClick={() => setSelectedRoleForInfo(role)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.02] cursor-pointer focus:outline-none",
                          isLightModeActive 
                            ? "bg-white/80 border-gray-200/60 hover:bg-white hover:border-clocktower-townsfolk/30 hover:shadow-sm" 
                            : "bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 hover:border-clocktower-townsfolk/30"
                        )}
                      >
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                          <img 
                            src={`/icons/${role.id}.svg`} 
                            alt={role.name} 
                            className="w-4.5 h-4.5 object-contain"
                            onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                          />
                        </span>
                        <span className={cn(
                          "font-bold text-xs truncate",
                          isLightModeActive ? "text-gray-900" : "text-gray-100"
                        )}>
                          {role.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Outsiders */}
              {outsiders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-clocktower-outsider border-b border-clocktower-outsider/15 pb-1 flex items-center gap-1.5">
                    🔵 Outsiders <span className="text-[10px] text-gray-500 font-normal font-mono">({outsiders.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {outsiders.map(role => (
                      <button 
                        type="button"
                        key={role.id}
                        onClick={() => setSelectedRoleForInfo(role)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.02] cursor-pointer focus:outline-none",
                          isLightModeActive 
                            ? "bg-white/80 border-gray-200/60 hover:bg-white hover:border-clocktower-outsider/30 hover:shadow-sm" 
                            : "bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 hover:border-clocktower-outsider/30"
                        )}
                      >
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                          <img 
                            src={`/icons/${role.id}.svg`} 
                            alt={role.name} 
                            className="w-4.5 h-4.5 object-contain"
                            onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                          />
                        </span>
                        <span className={cn(
                          "font-bold text-xs truncate",
                          isLightModeActive ? "text-gray-900" : "text-gray-100"
                        )}>
                          {role.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Minions */}
              {minions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-clocktower-minion border-b border-clocktower-minion/15 pb-1 flex items-center gap-1.5">
                    🔴 Minions <span className="text-[10px] text-gray-500 font-normal font-mono">({minions.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {minions.map(role => (
                      <button 
                        type="button"
                        key={role.id}
                        onClick={() => setSelectedRoleForInfo(role)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.02] cursor-pointer focus:outline-none",
                          isLightModeActive 
                            ? "bg-white/80 border-gray-200/60 hover:bg-white hover:border-clocktower-minion/30 hover:shadow-sm" 
                            : "bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 hover:border-clocktower-minion/30"
                        )}
                      >
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                          <img 
                            src={`/icons/${role.id}.svg`} 
                            alt={role.name} 
                            className="w-4.5 h-4.5 object-contain"
                            onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                          />
                        </span>
                        <span className={cn(
                          "font-bold text-xs truncate",
                          isLightModeActive ? "text-gray-900" : "text-gray-100"
                        )}>
                          {role.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Demons */}
              {demons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-clocktower-demon border-b border-clocktower-demon/15 pb-1 flex items-center gap-1.5">
                    🔴 Demons <span className="text-[10px] text-gray-500 font-normal font-mono">({demons.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {demons.map(role => (
                      <button 
                        type="button"
                        key={role.id}
                        onClick={() => setSelectedRoleForInfo(role)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.02] cursor-pointer focus:outline-none",
                          isLightModeActive 
                            ? "bg-white/80 border-gray-200/60 hover:bg-white hover:border-clocktower-demon/30 hover:shadow-sm" 
                            : "bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 hover:border-clocktower-demon/30"
                        )}
                      >
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                          <img 
                            src={`/icons/${role.id}.svg`} 
                            alt={role.name} 
                            className="w-4.5 h-4.5 object-contain"
                            onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                          />
                        </span>
                        <span className={cn(
                          "font-bold text-xs truncate",
                          isLightModeActive ? "text-gray-900" : "text-gray-100"
                        )}>
                          {role.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Travelers */}
              {travelers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-clocktower-traveler border-b border-clocktower-traveler/15 pb-1 flex items-center gap-1.5">
                    🟣 Travelers <span className="text-[10px] text-gray-500 font-normal font-mono">({travelers.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {travelers.map(role => (
                      <button 
                        type="button"
                        key={role.id}
                        onClick={() => setSelectedRoleForInfo(role)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.02] cursor-pointer focus:outline-none",
                          isLightModeActive 
                            ? "bg-white/80 border-gray-200/60 hover:bg-white hover:border-clocktower-traveler/30 hover:shadow-sm" 
                            : "bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 hover:border-clocktower-traveler/30"
                        )}
                      >
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                          <img 
                            src={`/icons/${role.id}.svg`} 
                            alt={role.name} 
                            className="w-4.5 h-4.5 object-contain"
                            onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                          />
                        </span>
                        <span className={cn(
                          "font-bold text-xs truncate",
                          isLightModeActive ? "text-gray-900" : "text-gray-100"
                        )}>
                          {role.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {townsfolk.length === 0 && outsiders.length === 0 && minions.length === 0 && demons.length === 0 && travelers.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 italic">
                  No matching characters found in this script.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Ability Info Modal */}
      {selectedRoleForInfo && (() => {
        const officialRole = (rolesData as { id: string; ability?: string }[]).find(r => r.id === selectedRoleForInfo.id);
        const abilityText = officialRole?.ability || "Ability description not found.";
        
        return (
          <div 
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
            onClick={() => setSelectedRoleForInfo(null)}
          >
            <div 
              className={cn(
                "w-full max-w-sm rounded-2xl p-6 text-center relative shadow-2xl transition-all duration-300 transform scale-100",
                isLightModeActive 
                  ? "bg-[#fdfaf2] border-2 border-amber-900/15 text-gray-800" 
                  : "bg-gray-900 border border-gray-800 text-gray-150"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setSelectedRoleForInfo(null)}
                className={cn(
                  "absolute top-4 right-4 p-1.5 rounded-full transition-colors",
                  isLightModeActive 
                    ? "text-gray-500 hover:bg-gray-200 hover:text-gray-800" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                aria-label="Close details"
              >
                <X size={18} />
              </button>

              {/* Large Role Token */}
              <div className={cn(
                "w-24 h-24 mx-auto rounded-full bg-white flex items-center justify-center shadow-lg border-4 transition-transform duration-300 hover:rotate-6 mt-2",
                selectedRoleForInfo.team === 'townsfolk' && "border-clocktower-townsfolk shadow-clocktower-townsfolk/20",
                selectedRoleForInfo.team === 'outsider' && "border-clocktower-outsider shadow-clocktower-outsider/20",
                selectedRoleForInfo.team === 'minion' && "border-clocktower-minion shadow-clocktower-minion/20",
                selectedRoleForInfo.team === 'demon' && "border-clocktower-demon shadow-clocktower-demon/20",
                selectedRoleForInfo.team === 'traveler' && "border-clocktower-traveler shadow-clocktower-traveler/20"
              )}>
                <img 
                  src={`/icons/${selectedRoleForInfo.id}.svg`} 
                  alt={selectedRoleForInfo.name} 
                  className="w-16 h-16 object-contain"
                  onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                />
              </div>

              {/* Role Name */}
              <h4 className={cn(
                "text-2xl font-black mt-4 tracking-wide",
                selectedRoleForInfo.team === 'townsfolk' && "text-clocktower-townsfolk",
                selectedRoleForInfo.team === 'outsider' && "text-clocktower-outsider",
                selectedRoleForInfo.team === 'minion' && "text-clocktower-minion",
                selectedRoleForInfo.team === 'demon' && "text-clocktower-demon",
                selectedRoleForInfo.team === 'traveler' && "text-clocktower-traveler"
              )}>
                {selectedRoleForInfo.name}
              </h4>

              {/* Team Pill */}
              <span className={cn(
                "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mt-2",
                selectedRoleForInfo.team === 'townsfolk' && "bg-clocktower-townsfolk/10 text-clocktower-townsfolk border border-clocktower-townsfolk/20",
                selectedRoleForInfo.team === 'outsider' && "bg-clocktower-outsider/10 text-clocktower-outsider border border-clocktower-outsider/20",
                selectedRoleForInfo.team === 'minion' && "bg-clocktower-minion/10 text-clocktower-minion border border-clocktower-minion/20",
                selectedRoleForInfo.team === 'demon' && "bg-clocktower-demon/10 text-clocktower-demon border border-clocktower-demon/20",
                selectedRoleForInfo.team === 'traveler' && "bg-clocktower-traveler/10 text-clocktower-traveler border border-clocktower-traveler/20"
              )}>
                {selectedRoleForInfo.team}
              </span>

              {/* Ability Description */}
              <div className={cn(
                "mt-5 p-4 rounded-xl border leading-relaxed text-sm select-text text-center font-medium",
                isLightModeActive 
                  ? "bg-white border-amber-900/10 text-gray-700 shadow-sm" 
                  : "bg-gray-955/60 border-gray-800 text-gray-300"
              )}>
                {abilityText}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setSelectedRoleForInfo(null)}
                className={cn(
                  "w-full mt-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
                  selectedRoleForInfo.team === 'townsfolk' && "bg-clocktower-townsfolk shadow-clocktower-townsfolk/20",
                  selectedRoleForInfo.team === 'outsider' && "bg-clocktower-outsider shadow-clocktower-outsider/20",
                  selectedRoleForInfo.team === 'minion' && "bg-clocktower-minion shadow-clocktower-minion/20",
                  selectedRoleForInfo.team === 'demon' && "bg-clocktower-demon shadow-clocktower-demon/20",
                  selectedRoleForInfo.team === 'traveler' && "bg-clocktower-traveler shadow-clocktower-traveler/20"
                )}
              >
                Close Details
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
