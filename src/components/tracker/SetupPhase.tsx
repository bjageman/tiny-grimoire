import React, { useState, useMemo } from 'react';
import AddPlayerForm from '../shared/ui/AddPlayerForm';
import type { LoricRole, Player, Role } from '../../types';
import { PLAYABLE_ROLES } from '../../utils/roleData';
import { sortByScriptOrder, withInPlayTravelers } from '../../utils/scriptUtils';
import PlayerTrackerCircle from './PlayerCircle';
import ScriptSelectionPanel from '../shared/ui/ScriptSelectionPanel';
import ScriptCharactersModal from '../shared/modals/ScriptCharactersModal';
import PresetScriptModal from '../shared/modals/PresetScriptModal';
import type { PresetScript } from '../../utils/presetScripts';

interface PlayerTrackerSetupPhaseProps {
  players: Player[];
  customScriptRoles: Role[] | null;
  scriptLoricRoles?: LoricRole[];
  scriptName: string;
  scriptAuthor: string;
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  addPlayer: () => void;
  setActiveTrackerPlayerId: (id: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleScriptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectPresetScript: (preset: PresetScript) => void;
  clearCustomScript: () => void;
  setPhase: (phase: 'setup' | 'game') => void;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  hoverSide: 'before' | 'after' | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number, side: 'before' | 'after') => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  isSynced?: boolean;
  isLightModeActive?: boolean;
  resetGame: () => void;
}

export default function PlayerTrackerSetupPhase({
  players,
  customScriptRoles,
  scriptLoricRoles,
  scriptName,
  scriptAuthor,
  newPlayerName,
  setNewPlayerName,
  addPlayer,
  setActiveTrackerPlayerId,
  fileInputRef,
  handleScriptUpload,
  selectPresetScript,
  clearCustomScript,
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
  isSynced = false,
  isLightModeActive = false,
  resetGame,
}: PlayerTrackerSetupPhaseProps) {
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  const sortedRoles = useMemo(() => {
    const baseRoles = customScriptRoles || PLAYABLE_ROLES;
    return sortByScriptOrder(withInPlayTravelers(baseRoles, players), baseRoles);
  }, [customScriptRoles, players]);

  return (
    <>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">
      {/* Section A: Script Upload */}
      <div className="md:col-start-2 md:row-start-1 space-y-6 w-full">
        <section className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/80 space-y-4">
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
            isSynced={isSynced}
            emptyScriptIcon="🌐"
            uploadHint="Upload Script (.json)"
          />
          <p className="text-[11px] text-gray-550 leading-relaxed">
            {isSynced 
              ? "The active script is automatically synchronized in real-time from the Storyteller."
              : "Upload a script JSON file (e.g., from the Official Script Tool) to restrict character selections in the Player details modal to only those on this script."
            }
          </p>
        </section>
      </div>

      {/* Section B: Players list */}
      <div className="md:col-start-1 md:row-start-1 md:row-span-2 space-y-6 w-full">
        <section>
          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
              <h2 className="font-display text-base font-bold tracking-wider uppercase text-gray-300">Setup ({players.length} players)</h2>
              {isSynced && (
                <span className="text-xs text-gray-500 font-medium italic">
                  The seating order is managed by the Storyteller
                </span>
              )}
            </div>
            <button
              id="setup-reset-button"
              onClick={resetGame}
              className="text-[10px] bg-clocktower-blood/10 text-red-400 border border-clocktower-blood/30 px-2 py-1 rounded hover:bg-clocktower-blood/25 transition-all shrink-0"
              title="Reset game"
            >
              Reset
            </button>
          </div>

          {!isSynced ? (
            <AddPlayerForm
              value={newPlayerName}
              onChange={setNewPlayerName}
              onAdd={addPlayer}
              playerCount={players.length}
              maxPlayers={20}
              addButtonId="add-player-button"
              inputClassName="bg-gray-955"
            />
          ) : (
            <div className="p-3 bg-clocktower-blood/10 border border-clocktower-blood/20 rounded-lg text-xs font-semibold text-clocktower-blood mb-4">
              Seating arrangement and player list are synced with the Storyteller.
            </div>
          )}

          {players.length === 0 ? (
            <div className="p-8 border border-dashed border-gray-800 rounded-lg text-center text-gray-500 text-sm italic">
              Add players to get started.
            </div>
          ) : (
            <PlayerTrackerCircle
              players={players}
              isLightModeActive={isLightModeActive}
              isSynced={isSynced}
              setActiveTrackerPlayerId={setActiveTrackerPlayerId}
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
            />
          )}
        </section>
      </div>

      {/* Section C: Start Button */}
      <div className="md:col-start-2 md:row-start-2 space-y-6 w-full">
        <button
          id="open-grimoire-button"
          disabled={players.length < 1}
          onClick={() => {
            setPhase('game');
            setTimeout(() => {
              if (typeof document === 'undefined') return;
              const grimoireElement = document.getElementById('grimoire-board-container');
              grimoireElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
        >
          Start Game
        </button>
      </div>
    </div>
    <ScriptCharactersModal
      isOpen={isScriptModalOpen}
      onClose={() => setIsScriptModalOpen(false)}
      scriptName={scriptName}
      roles={sortedRoles}
      scriptLoricRoles={scriptLoricRoles}
      scriptAuthor={scriptAuthor || undefined}
      isLightModeActive={isLightModeActive}
    />
    {isPresetModalOpen && (
      <PresetScriptModal
        onSelect={(preset) => { selectPresetScript(preset); setIsPresetModalOpen(false); }}
        onCancel={() => setIsPresetModalOpen(false)}
        isLightModeActive={isLightModeActive}
      />
    )}
    </>
  );
}
