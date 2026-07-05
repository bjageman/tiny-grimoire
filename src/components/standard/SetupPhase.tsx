import React, { useState, useMemo } from 'react';
import { Plus, Shuffle, Upload, AlertTriangle, Package } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player, Role } from '../../types';
import rolesData from '../../roles.json';
import ScriptCharactersModal from '../shared/ScriptCharactersModal';
import SelectCharactersModal from './SelectCharactersModal';
import ScriptHelpButton from '../shared/ScriptHelpButton';
import CharacterAssignmentCircle from './CharacterAssignmentCircle';
import GrimoireBalanceVerification from '../shared/GrimoireBalanceVerification';
import type { ValidationSummary } from '../../utils/validationSummary';

interface StandardSetupPhaseProps {
  players: Player[];
  customScriptRoles: Role[] | null;
  scriptName: string;
  scriptAuthor: string;
  selectedCharacterIds: Set<string>;
  setSelectedCharacterIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  addPlayer: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleScriptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearCustomScript: () => void;
  randomlyAssignRoles: () => void;
  randomlyAssignWithRoles: (roles: Role[]) => void;
  clearAllRoles: () => void;
  resetGame: () => void;
  scriptRoles: Role[];
  setActivePlayerId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  allAssigned: boolean;
  remotePlayerCount?: number;
  remotePlayerIds?: Set<string>;
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
  validationSummary: ValidationSummary | null;
  isLightModeActive: boolean;
  isSecondary?: boolean;
}

export default function StandardSetupPhase({
  players,
  customScriptRoles,
  scriptName,
  scriptAuthor,
  selectedCharacterIds,
  setSelectedCharacterIds,
  newPlayerName,
  setNewPlayerName,
  addPlayer,
  fileInputRef,
  handleScriptUpload,
  clearCustomScript,
  randomlyAssignRoles,
  randomlyAssignWithRoles,
  clearAllRoles,
  resetGame,
  scriptRoles,
  setActivePlayerId,
  setSearchTerm,
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
  validationSummary,
  isLightModeActive,
  isSecondary,
  remotePlayerCount = 0,
  remotePlayerIds,
  grimoireConfirmed = false,
  onGrimoireConfirmed,
}: StandardSetupPhaseProps) {
  const [showGrimoireWarning, setShowGrimoireWarning] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isSelectCharactersModalOpen, setIsSelectCharactersModalOpen] = useState(false);

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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] xl:grid-cols-[2fr_1fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">
      {/* Section A: Script & Randomization */}
      <div id="standard-setup-controls-container" className="md:col-start-2 md:row-start-1 space-y-6 w-full">
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
          <div className="relative">
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
                "flex items-center gap-1.5 text-base font-extrabold transition-colors text-white group-hover:text-clocktower-blood",
                isLightModeActive && "text-gray-900"
              )}>
                📜 {scriptName}
              </span>
              <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                <Upload size={12} />
                {customScriptRoles ? `${scriptAuthor ? `by ${scriptAuthor}` : 'Custom script'} — Click to change` : "Click to upload .json"}
              </span>
            </button>
            <ScriptHelpButton isLightModeActive={isLightModeActive} />
          </div>
          {customScriptRoles && (
            <button
              type="button"
              onClick={clearCustomScript}
              className={cn(
                "w-full text-center bg-transparent border py-2.5 rounded text-xs font-semibold transition-all",
                isLightModeActive
                  ? "hover:bg-red-50 border-gray-300 text-red-600 hover:text-red-700"
                  : "hover:bg-gray-800 border-gray-800 text-red-400 hover:text-red-300"
              )}
            >
              Clear Script
            </button>
          )}
          <button
            id="game-script-button"
            type="button"
            onClick={() => setIsScriptModalOpen(true)}
            className={cn(
              "w-full text-center bg-transparent border py-2.5 rounded text-xs font-semibold transition-all",
              isLightModeActive
                ? "hover:bg-gray-200/50 border-gray-300 text-gray-600 hover:text-gray-900"
                : "hover:bg-gray-800 border-gray-800 text-gray-500 hover:text-gray-400"
            )}
          >
            View Script
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
                  const selectedRoles = scriptRoles.filter(r => selectedCharacterIds.has(r.id));
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg font-bold tracking-wider uppercase text-gray-300">Setup ({players.length} Players)</h2>
            <div className="flex gap-2">
              {players.length > 0 && (
                <button
                  onClick={clearAllRoles}
                  className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-2 py-1 rounded hover:bg-gray-700 transition-all"
                >
                  Clear All
                </button>
              )}
              <button
                id="setup-reset-button"
                onClick={resetGame}
                disabled={isSecondary}
                className={cn(
                  "text-[10px] bg-clocktower-blood/10 text-red-400 border border-clocktower-blood/30 px-2 py-1 rounded hover:bg-clocktower-blood/25 transition-all",
                  isSecondary && "opacity-40 cursor-not-allowed"
                )}
                title={isSecondary ? "Resetting the game is disabled on secondary devices." : "Reset game"}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              id="new-player-input"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              disabled={players.length >= 20}
              placeholder={
                players.length >= 20 
                  ? "Maximum players reached (20)" 
                  : "Enter player name in seating order..."
              }
              autoCapitalize="words"
              className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
              id="add-player-button"
              onClick={addPlayer} 
              disabled={players.length >= 20}
              className={cn(
                "px-4 py-2 rounded transition-colors text-white",
                players.length >= 20 
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-800" 
                  : "bg-clocktower-blood hover:bg-red-800 border border-clocktower-blood"
              )}
            >
              <Plus size={20} />
            </button>
          </div>

          <CharacterAssignmentCircle
            players={players}
            isLightModeActive={isLightModeActive}
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
            setActivePlayerId={setActivePlayerId}
            setSearchTerm={setSearchTerm}
            remotePlayerIds={remotePlayerIds}
          />
        </section>
      </div>

      {/* Section C: Distribution & Validation & Open Grimoire */}
      <div className="md:col-start-2 md:row-start-2 space-y-6 w-full">
        {/* Validation Summary */}
        {validationSummary && players.length >= 5 && (
          <GrimoireBalanceVerification validationSummary={validationSummary} isLightModeActive={isLightModeActive} />
        )}
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
      scriptAuthor={scriptAuthor || undefined}
      isLightModeActive={isLightModeActive}
    />
    <SelectCharactersModal
      isOpen={isSelectCharactersModalOpen}
      onClose={() => setIsSelectCharactersModalOpen(false)}
      roles={scriptRoles}
      playerCount={players.length}
      isLightModeActive={isLightModeActive}
      onAssign={randomlyAssignWithRoles}
      selectedIds={selectedCharacterIds}
      setSelectedIds={setSelectedCharacterIds}
    />
    </>
  );
}
