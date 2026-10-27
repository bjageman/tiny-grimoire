import React, { useState, useMemo } from 'react';
import { Dices, Package } from 'lucide-react';
import { cn } from '../../utils/cn';
import AddPlayerForm from '../shared/ui/AddPlayerForm';
import AssignmentConfirmationModal from '../shared/modals/AssignmentConfirmationModal';
import ToggleSwitch from '../shared/ui/ToggleSwitch';
import type { LoricRole, Player, Role } from '../../types';
import { PLAYABLE_ROLES } from '../../utils/roleData';
import { sortByScriptOrder, withInPlayTravelers } from '../../utils/scriptUtils';
import ScriptCharactersModal from '../shared/modals/ScriptCharactersModal';
import PresetScriptModal from '../shared/modals/PresetScriptModal';
import type { PresetScript } from '../../utils/presetScripts';
import SelectCharactersModal from './SelectCharactersModal';
import ScriptSelectionPanel from '../shared/ui/ScriptSelectionPanel';
import CharacterAssignmentCircle from './CharacterAssignmentCircle';
import GrimoireBalanceVerification from '../shared/grimoire/GrimoireBalanceVerification';
import GameSetupMods from '../shared/grimoire/GameSetupMods';
import type { ValidationSummary } from '../../utils/validationSummary';

interface StandardSetupPhaseProps {
  players: Player[];
  rotationOffset?: number;
  onRotationChange?: (offset: number) => void;
  customScriptRoles: Role[] | null;
  scriptLoricRoles?: LoricRole[];
  scriptName: string;
  scriptAuthor: string;
  selectedCharacterIds: Set<string>;
  setSelectedCharacterIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  villageIdiotCount: number;
  setVillageIdiotCount: (count: number) => void;
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  addPlayer: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleScriptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectPresetScript: (preset: PresetScript) => void;
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
  hoverSide: 'before' | 'after' | null;
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
  sentinelOutsiderDelta: number;
  setSentinelOutsiderDelta: (delta: number) => void;
  popeEnabled: boolean;
  setPopeEnabled: (enabled: boolean) => void;
  torEnabled: boolean;
  setTorEnabled: (enabled: boolean) => void;
  isLightModeActive: boolean;
  isSecondary?: boolean;
}

export default function StandardSetupPhase({
  players,
  rotationOffset,
  onRotationChange,
  customScriptRoles,
  scriptLoricRoles,
  scriptName,
  scriptAuthor,
  selectedCharacterIds,
  setSelectedCharacterIds,
  villageIdiotCount,
  setVillageIdiotCount,
  newPlayerName,
  setNewPlayerName,
  addPlayer,
  fileInputRef,
  handleScriptUpload,
  selectPresetScript,
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
  hoverSide,
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
  sentinelOutsiderDelta,
  setSentinelOutsiderDelta,
  popeEnabled,
  setPopeEnabled,
  torEnabled,
  setTorEnabled,
  isLightModeActive,
  isSecondary,
  remotePlayerCount = 0,
  remotePlayerIds,
  grimoireConfirmed = false,
  onGrimoireConfirmed,
}: StandardSetupPhaseProps) {
  const [showGrimoireWarning, setShowGrimoireWarning] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isSelectCharactersModalOpen, setIsSelectCharactersModalOpen] = useState(false);
  const [overrideFailures, setOverrideFailures] = useState(false);

  const sortedRoles = useMemo(() => {
    const baseRoles = customScriptRoles || PLAYABLE_ROLES;
    return sortByScriptOrder(withInPlayTravelers(baseRoles, players), baseRoles);
  }, [customScriptRoles, players]);

  const basePlayerCount = useMemo(() => {
    return players.filter(p => {
      if (!p.roleId) return true;
      const r = scriptRoles.find(role => role.id === p.roleId) || PLAYABLE_ROLES.find(role => role.id === p.roleId);
      return r?.team !== 'traveler';
    }).length;
  }, [players, scriptRoles]);

  const bagPlayerCount = Math.min(15, basePlayerCount);

  const openGrimoire = () => {
    setPhase('game');
    setTimeout(() => {
      if (typeof document === 'undefined') return;
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
            <ScriptSelectionPanel
            scriptName={scriptName}
            scriptAuthor={scriptAuthor}
            hasCustomScript={!!customScriptRoles}
            isLightModeActive={isLightModeActive}
            fileInputRef={fileInputRef}
            onUpload={handleScriptUpload}
            onClear={clearCustomScript}
            onSelectPreset={() => setIsPresetModalOpen(true)}
            onViewScript={() => setIsScriptModalOpen(true)}
            uploadInputId="script-upload-input"
            uploadButtonId="script-upload-button"
          />
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
              <Dices size={14} /> Randomly Assign
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

          <AddPlayerForm
            value={newPlayerName}
            onChange={setNewPlayerName}
            onAdd={addPlayer}
            playerCount={players.length}
            maxPlayers={20}
            addButtonId="add-player-button"
          />

          <CharacterAssignmentCircle
            players={players}
            rotationOffset={rotationOffset}
            onRotationChange={onRotationChange}
            isLightModeActive={isLightModeActive}
            draggedIndex={draggedIndex}
            dragOverIndex={dragOverIndex}
            hoverSide={hoverSide}
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
            selectionRoles={sortedRoles}
          />
        </section>
      </div>

      {/* Section C: Distribution & Validation & Open Grimoire */}
      <div className="md:col-start-2 md:row-start-2 space-y-6 w-full">
        {/* Validation Summary */}
        {validationSummary && players.length >= 5 && (
          <GrimoireBalanceVerification
            validationSummary={validationSummary}
            isLightModeActive={isLightModeActive}
            persistenceKey="standard-balance-verification-expanded"
          />
        )}
        <GameSetupMods
          sentinelOutsiderDelta={sentinelOutsiderDelta}
          setSentinelOutsiderDelta={setSentinelOutsiderDelta}
          popeEnabled={popeEnabled}
          setPopeEnabled={setPopeEnabled}
          torEnabled={torEnabled}
          setTorEnabled={setTorEnabled}
          isLightModeActive={isLightModeActive}
          persistenceKey="standard-setup-modifiers-expanded"
        />
        <button
          id="open-grimoire-button"
          disabled={!allAssigned || (!!validationSummary?.failures?.length && !overrideFailures)}
          onClick={handleOpenGrimoire}
          className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
        >
          Open Grimoire
        </button>
        {validationSummary && validationSummary.failures && validationSummary.failures.length > 0 && (
          <label className={cn(
            "flex items-center justify-center gap-2 text-xs font-semibold select-none cursor-pointer transition-colors mt-2",
            isLightModeActive ? "text-gray-600 hover:text-gray-800" : "text-gray-400 hover:text-gray-200"
          )}>
            <ToggleSwitch
              id="override-failures-checkbox"
              checked={overrideFailures}
              onChange={setOverrideFailures}
              isLightModeActive={isLightModeActive}
            />
            <span>Override failures</span>
          </label>
        )}
      </div>
    </div>

    {showGrimoireWarning && (
      <AssignmentConfirmationModal
        remotePlayerCount={remotePlayerCount}
        isLightModeActive={isLightModeActive}
        confirmButtonId="confirm-open-grimoire-button"
        onCancel={() => setShowGrimoireWarning(false)}
        onConfirm={confirmOpenGrimoire}
      />
    )}
    <ScriptCharactersModal
      isOpen={isScriptModalOpen}
      onClose={() => setIsScriptModalOpen(false)}
      scriptName={scriptName}
      roles={sortedRoles}
      scriptLoricRoles={scriptLoricRoles}
      scriptAuthor={scriptAuthor || undefined}
      isLightModeActive={isLightModeActive}
      isStoryteller
      players={players}
    />
    {isPresetModalOpen && (
      <PresetScriptModal
        onSelect={(preset) => { selectPresetScript(preset); setIsPresetModalOpen(false); }}
        onCancel={() => setIsPresetModalOpen(false)}
        isLightModeActive={isLightModeActive}
      />
    )}
    <SelectCharactersModal
      isOpen={isSelectCharactersModalOpen}
      onClose={() => setIsSelectCharactersModalOpen(false)}
      roles={scriptRoles}
      playerCount={bagPlayerCount}
      isLightModeActive={isLightModeActive}
      selectedIds={selectedCharacterIds}
      setSelectedIds={setSelectedCharacterIds}
      villageIdiotCount={villageIdiotCount}
      setVillageIdiotCount={setVillageIdiotCount}
    />
    </>
  );
}
