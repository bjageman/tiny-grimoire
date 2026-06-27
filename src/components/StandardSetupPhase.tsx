import React, { useState, useMemo } from 'react';
import { Plus, Shuffle, Upload, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player, Role } from '../types';
import { getScriptStats, expandVillageIdiots } from '../utils/scriptUtils';
import rolesData from '../roles.json';
import ScriptCharactersModal from './ScriptCharactersModal';
import SelectCharactersModal from './SelectCharactersModal';
import { getDistribution } from '../constants';
import StandardSetupPlayerRow from './StandardSetupPlayerRow';
import type { ValidationSummary } from '../utils/whaleBucketValidation';

interface StandardSetupPhaseProps {
  players: Player[];
  customScriptRoles: Role[] | null;
  scriptName: string;
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleScriptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearCustomScript: () => void;
  randomlyAssignRoles: () => void;
  randomlyAssignWithRoles: (roles: Role[]) => void;
  scriptRoles: Role[];
  setActivePlayerId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  togglePlayerTheDrunk: (id: string) => void;
  togglePlayerTheMarionette: (id: string) => void;
  togglePlayerTheLunatic: (id: string) => void;
  togglePlayerTheLilMonsta: (id: string) => void;
  allAssigned: boolean;
  remotePlayerCount?: number;
  grimoireConfirmed?: boolean;
  onGrimoireConfirmed?: () => void;
  setPhase: (phase: 'setup' | 'game') => void;
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
  movePlayer: (index: number, direction: 'up' | 'down') => void;
  validationSummary: ValidationSummary | null;
  isLightModeActive: boolean;
  selectedCharacterIds: Set<string>;
  setSelectedCharacterIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function StandardSetupPhase({
  players,
  customScriptRoles,
  scriptName,
  newPlayerName,
  setNewPlayerName,
  addPlayer,
  removePlayer,
  updatePlayerName,
  fileInputRef,
  handleScriptUpload,
  clearCustomScript,
  randomlyAssignRoles,
  randomlyAssignWithRoles,
  scriptRoles,
  setActivePlayerId,
  setSearchTerm,
  togglePlayerTheDrunk,
  togglePlayerTheMarionette,
  togglePlayerTheLunatic,
  togglePlayerTheLilMonsta,
  allAssigned,
  setPhase,
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
  movePlayer,
  validationSummary,
  isLightModeActive,
  selectedCharacterIds,
  setSelectedCharacterIds,
  remotePlayerCount = 0,
  grimoireConfirmed = false,
  onGrimoireConfirmed,
}: StandardSetupPhaseProps) {
  const [showGrimoireWarning, setShowGrimoireWarning] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isSelectCharactersModalOpen, setIsSelectCharactersModalOpen] = useState(false);
  const [prevScriptRoles, setPrevScriptRoles] = useState<Role[]>(scriptRoles);

  if (prevScriptRoles !== scriptRoles) {
    setPrevScriptRoles(scriptRoles);
    setSelectedCharacterIds(new Set(scriptRoles.map(r => r.id)));
  }

  const selectableRoles = useMemo(() => expandVillageIdiots(scriptRoles), [scriptRoles]);

  const sortedRoles = useMemo(() => {
    const baseRoles = customScriptRoles || (rolesData as Role[]);
    return [...baseRoles].sort((a, b) => a.name.localeCompare(b.name));
  }, [customScriptRoles]);

  const openGrimoire = () => {
    setPhase('game');
    setTimeout(() => {
      document.getElementById('grimoire-board-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOpenGrimoire = () => {
    if (remotePlayerCount > 0 && !grimoireConfirmed) {
      setShowGrimoireWarning(true);
    } else {
      openGrimoire();
    }
  };

  const confirmOpenGrimoire = () => {
    setShowGrimoireWarning(false);
    onGrimoireConfirmed?.();
    openGrimoire();
  };

  return (
    <>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">
      {/* Section A: Script & Randomization */}
      <div className="md:col-start-2 md:row-start-1 space-y-6 w-full">
        <section className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/80 space-y-4">
          <div className="flex flex-col gap-2">
            <input
            id="script-upload-input"
            type="file"
            ref={fileInputRef}
            onChange={handleScriptUpload}
            accept=".json"
            className="hidden"
          />
          <button
            id="script-upload-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full border py-3.5 px-4 rounded-lg transition-all flex flex-col items-center justify-center gap-1 group text-center cursor-pointer",
              isLightModeActive
                ? "bg-gray-100/80 border-gray-300 hover:border-clocktower-blood/60 hover:bg-gray-150"
                : "bg-gray-955 border-gray-800 hover:border-clocktower-blood"
            )}
            title="Click to upload script JSON"
          >
            <span className={cn(
              "flex items-center gap-1.5 text-base font-extrabold transition-colors",
              isLightModeActive
                ? "text-gray-900 group-hover:text-clocktower-blood"
                : "text-white group-hover:text-clocktower-blood"
            )}>
              📜 {scriptName}
            </span>
            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
              <Upload size={12} />
              {customScriptRoles ? `${getScriptStats(customScriptRoles)} — Click to change` : "Click to upload .json"}
            </span>
          </button>
          {customScriptRoles && (
            <button
              id="script-reset-button"
              type="button"
              onClick={clearCustomScript}
              className={cn(
                "w-full text-center bg-transparent border py-1.5 rounded text-xs font-semibold transition-all",
                isLightModeActive
                  ? "hover:bg-gray-200/50 border-gray-300 text-gray-600 hover:text-gray-900"
                  : "hover:bg-gray-800 border-gray-800 text-gray-500 hover:text-gray-400"
              )}
            >
              Reset to All Roles
            </button>
          )}
          <button
            id="game-script-button"
            type="button"
            onClick={() => setIsScriptModalOpen(true)}
            className={cn(
              "w-full text-center bg-transparent border py-1.5 rounded text-xs font-semibold transition-all",
              isLightModeActive
                ? "hover:bg-gray-200/50 border-gray-300 text-gray-600 hover:text-gray-900"
                : "hover:bg-gray-800 border-gray-800 text-gray-500 hover:text-gray-400"
            )}
          >
            View Characters
          </button>
          <button
            id="select-characters-button"
            type="button"
            onClick={() => setIsSelectCharactersModalOpen(true)}
            className={cn(
              "w-full py-2.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md",
              isLightModeActive
                ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                : "bg-gray-700 hover:bg-gray-600 text-white"
            )}
          >
            <Package size={14} /> Setup Bag
          </button>

            <div className="border-t border-gray-800/60 my-1" />
            
            <button
              id="random-assign-button"
              type="button"
              onClick={() => {
                if (selectedCharacterIds.size > 0) {
                  const selectedRoles = selectableRoles.filter(r => selectedCharacterIds.has(r.id));
                  randomlyAssignWithRoles(selectedRoles);
                } else {
                  randomlyAssignRoles();
                }
              }}
              className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-2.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={players.length < 5}
              title="Randomly assign roles to all players based on the active script, keeping to standard distribution rules"
            >
              <Shuffle size={14} /> Randomly Assign
            </button>
          </div>
        </section>
      </div>

      {/* Section B: Players & Roles list */}
      <div className="md:col-start-1 md:row-start-1 md:row-span-2 space-y-6 w-full">
        <section>
          <h2 className="font-display text-lg font-bold tracking-wider uppercase text-gray-300 mb-4">Character Assignment ({players.length})</h2>

          <div className="flex gap-2 mb-4">
            <input
              id="new-player-input"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              disabled={players.length >= 15}
              placeholder={players.length >= 15 ? "Maximum players reached (15)" : "Enter player name in seating order..."}
              autoCapitalize="words"
              className="flex-1 bg-gray-955 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              id="add-player-button"
              onClick={addPlayer}
              disabled={players.length >= 15}
              className={cn(
                "px-4 py-2 rounded transition-colors text-white",
                players.length >= 15
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-800"
                  : "bg-clocktower-blood hover:bg-red-800 border border-clocktower-blood"
              )}
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2.5">
            {players.map((p, index) => (
              <StandardSetupPlayerRow
                key={p.id}
                player={p}
                index={index}
                players={players}
                customScriptRoles={customScriptRoles}
                draggedIndex={draggedIndex}
                dragOverIndex={dragOverIndex}
                handleMouseDown={handleMouseDown}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
                movePlayer={movePlayer}
                removePlayer={removePlayer}
                updatePlayerName={updatePlayerName}
                setActivePlayerId={setActivePlayerId}
                setSearchTerm={setSearchTerm}
                togglePlayerTheDrunk={togglePlayerTheDrunk}
                togglePlayerTheMarionette={togglePlayerTheMarionette}
                togglePlayerTheLunatic={togglePlayerTheLunatic}
                togglePlayerTheLilMonsta={togglePlayerTheLilMonsta}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Section C: Distribution & Validation & Open Grimoire */}
      <div className="md:col-start-2 md:row-start-2 space-y-6 w-full">
        {/* Validation Summary */}
        {validationSummary && players.length >= 5 && (
          <div
            id="grimoire-balance-verification"
            className={cn(
              "border rounded-lg p-3 space-y-2.5 transition-colors duration-300 text-left",
              isLightModeActive
                ? "bg-white border-gray-250 text-clocktower-night shadow-sm"
                : "bg-gray-900/90 border-gray-800"
            )}
          >
            <div className="flex items-center gap-1.5">
              {validationSummary.isValid ? (
                <CheckCircle size={16} className="text-clocktower-outsider" />
              ) : (
                <AlertTriangle size={16} className="text-clocktower-minion" />
              )}
              <span className={cn(
                "font-semibold text-xs tracking-wide uppercase",
                isLightModeActive ? "text-gray-700" : "text-gray-300"
              )}>
                Grimoire Balance Verification
              </span>
            </div>

            {validationSummary.modifications.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {validationSummary.modifications.map((m, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "text-[9px] border px-1.5 py-0.5 rounded font-medium transition-colors duration-300",
                      isLightModeActive
                        ? "bg-clocktower-blood/5 border-clocktower-blood/20 text-clocktower-blood"
                        : "bg-clocktower-blood/10 border-clocktower-blood/30 text-clocktower-parchment/80"
                    )}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            <div className={cn(
              "grid text-center text-[10px] font-mono border-t pt-2.5",
              isLightModeActive ? "border-gray-200" : "border-gray-800",
              validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0
                ? "grid-cols-5 gap-1"
                : "grid-cols-4 gap-2"
            )}>
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Tfolk</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isTownsfolkValid ? "text-clocktower-townsfolk" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.townsfolk} / {validationSummary.expectedTownsfolkLabel}
                </div>
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Outsider</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isOutsiderValid ? "text-clocktower-outsider" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.outsider} / {validationSummary.expectedOutsiderLabel}
                </div>
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Minion</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isMinionValid ? "text-clocktower-minion" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.minion} / {validationSummary.expected.minion}
                </div>
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Demon</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isDemonValid ? "text-clocktower-demon" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.demon} / {validationSummary.expected.demon}
                </div>
              </div>
              {(validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0) && (
                <div>
                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Traveler</div>
                  <div className="font-bold text-xs mt-0.5 text-clocktower-traveler">
                    {validationSummary.counts.traveler} / {validationSummary.expected.traveler}
                  </div>
                </div>
              )}
            </div>

            {validationSummary.jinxWarnings.length > 0 && (
              <div className={cn("border-t pt-2 space-y-1", isLightModeActive ? "border-gray-200" : "border-gray-800")}>
                {validationSummary.jinxWarnings.map((w, idx) => (
                  <div key={idx} className={cn("text-[10px] flex items-center gap-1 font-medium", isLightModeActive ? "text-amber-700" : "text-yellow-500")}>
                    <AlertTriangle size={10} /> {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Distribution Card */}
        <section id="standard-base-distribution" className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Standard Base Distribution</h3>
          {players.length >= 5 ? (() => {
            const travelerCountInPlay = players.filter(p => {
              if (!p.roleId) return false;
              const r = (rolesData as Role[]).find(role => role.id === p.roleId);
              return r?.team === 'traveler';
            }).length;
            const baseCount = players.length - travelerCountInPlay;
            const dist = getDistribution(baseCount);
            return (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-townsfolk">
                    TF: {dist.townsfolk}
                  </div>
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-outsider">
                    O: {dist.outsider}
                  </div>
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-minion">
                    M: {dist.minion}
                  </div>
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-demon">
                    D: {dist.demon}
                  </div>
                </div>
                {(dist.traveler > 0 || travelerCountInPlay > 0) && (
                  <div className="text-center text-xs font-semibold p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-traveler">
                    Travelers: {travelerCountInPlay > 0 ? travelerCountInPlay : dist.traveler}
                  </div>
                )}
              </div>
            );
          })() : (
            <p className="text-sm text-gray-500 italic">Add at least 5 players to view distribution.</p>
          )}
        </section>


        <button
          id="open-grimoire-button"
          disabled={!allAssigned}
          onClick={handleOpenGrimoire}
          className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
        >
          Open Grimoire
        </button>
      </div>
    </div>

    {showGrimoireWarning && (
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={() => setShowGrimoireWarning(false)}
      >
        <div
          className={cn(
            'w-full max-w-sm rounded-lg p-6 shadow-2xl space-y-4',
            isLightModeActive
              ? 'bg-white border border-clocktower-blood/20 text-gray-800'
              : 'bg-gray-900 border border-gray-800 text-gray-100'
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base mb-1">Send character assignments?</h3>
              <p className={cn('text-sm leading-relaxed', isLightModeActive ? 'text-gray-600' : 'text-gray-300')}>
                {remotePlayerCount === 1
                  ? '1 player has joined your session.'
                  : `${remotePlayerCount} players have joined your session.`}
                {' '}Opening the grimoire will send everyone their character. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowGrimoireWarning(false)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold border transition-colors',
                isLightModeActive
                  ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              )}
            >
              Cancel
            </button>
            <button
              onClick={confirmOpenGrimoire}
              className="px-4 py-2 rounded-md text-sm font-display font-bold tracking-wider uppercase bg-clocktower-blood text-white hover:bg-red-800 transition-colors"
            >
              Open Grimoire
            </button>
          </div>
        </div>
      </div>
    )}
    <ScriptCharactersModal
      isOpen={isScriptModalOpen}
      onClose={() => setIsScriptModalOpen(false)}
      scriptName={scriptName}
      roles={sortedRoles}
      scriptStats={customScriptRoles ? getScriptStats(customScriptRoles) : undefined}
      isLightModeActive={isLightModeActive}
    />
    <SelectCharactersModal
      isOpen={isSelectCharactersModalOpen}
      onClose={() => setIsSelectCharactersModalOpen(false)}
      roles={selectableRoles}
      playerCount={players.length}
      isLightModeActive={isLightModeActive}
      onAssign={randomlyAssignWithRoles}
      selectedIds={selectedCharacterIds}
      setSelectedIds={setSelectedCharacterIds}
    />
    </>
  );
}
