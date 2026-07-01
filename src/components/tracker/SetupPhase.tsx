import React, { useState, useMemo } from 'react';
import { Plus, Upload } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player, Role } from '../../types';
import { getScriptStats } from '../../utils/scriptUtils';
import rolesData from '../../roles.json';
import PlayerTrackerCircle from './PlayerCircle';
import ScriptHelpButton from '../shared/ScriptHelpButton';
import ScriptCharactersModal from '../shared/ScriptCharactersModal';

interface PlayerTrackerSetupPhaseProps {
  players: Player[];
  customScriptRoles: Role[] | null;
  scriptName: string;
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  addPlayer: () => void;
  setActiveTrackerPlayerId: (id: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleScriptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearCustomScript: () => void;
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
  isSynced?: boolean;
  isLightModeActive?: boolean;
}

export default function PlayerTrackerSetupPhase({
  players,
  customScriptRoles,
  scriptName,
  newPlayerName,
  setNewPlayerName,
  addPlayer,
  setActiveTrackerPlayerId,
  fileInputRef,
  handleScriptUpload,
  clearCustomScript,
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
  isSynced = false,
  isLightModeActive = false,
}: PlayerTrackerSetupPhaseProps) {
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  const sortedRoles = useMemo(() => {
    const baseRoles = customScriptRoles || (rolesData as Role[]);
    return [...baseRoles].sort((a, b) => a.name.localeCompare(b.name));
  }, [customScriptRoles]);

  return (
    <>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">
      {/* Section A: Script Upload */}
      <div className="md:col-start-2 md:row-start-1 space-y-6 w-full">
        <section className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/80 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleScriptUpload}
            className="hidden"
          />

          {isSynced ? (
            <div className={cn(
              "w-full border py-3.5 px-4 rounded-lg flex flex-col items-center justify-center gap-1 text-center",
              isLightModeActive
                ? "bg-gray-100 border-gray-300 text-gray-800"
                : "bg-gray-955 border-gray-800 text-gray-300"
            )}>
              <span className={cn(
                "flex items-center gap-1.5 text-base font-extrabold",
                isLightModeActive ? "text-gray-900" : "text-white"
              )}>
                {customScriptRoles ? "📜" : "🌐"} {scriptName}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {customScriptRoles ? `${getScriptStats(customScriptRoles)} — Synced from Storyteller` : "Active Script (Synced from Storyteller)"}
              </span>
            </div>
          ) : (
            <>
              <div className="relative">
                <button
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
                    {customScriptRoles ? "📜" : "🌐"} {scriptName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                    <Upload size={12} />
                    {customScriptRoles ? `${getScriptStats(customScriptRoles)} — Click to change` : "Upload Script (.json)"}
                  </span>
                </button>
                <ScriptHelpButton isLightModeActive={isLightModeActive} />
              </div>

              {customScriptRoles && (
                <button
                  type="button"
                  onClick={clearCustomScript}
                  className={cn(
                    "w-full text-center bg-transparent border py-1.5 rounded text-xs font-semibold transition-all",
                    isLightModeActive
                      ? "hover:bg-red-50 border-gray-300 text-red-600 hover:text-red-700"
                      : "hover:bg-gray-800 border-gray-800 text-red-400 hover:text-red-300"
                  )}
                >
                  Clear Script
                </button>
              )}
            </>
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
            View Script
          </button>
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
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 mb-4">
            <h2 className="font-display text-base font-bold tracking-wider uppercase text-gray-300">Setup ({players.length} players)</h2>
            <span className="text-xs text-gray-500 font-medium italic">
              {isSynced 
                ? "The seating order is managed by the Storyteller"
                : "Add yourself then every other player in clockwise order"
              }
            </span>
          </div>

          {!isSynced ? (
            <div className="flex gap-2 mb-4">
              <input
                id="new-player-input"
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                disabled={players.length >= 20}
                placeholder={players.length >= 20 ? "Maximum players reached (20)" : "Enter player name in seating order..."}
                autoCapitalize="words"
                className="flex-1 bg-gray-955 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
      scriptStats={customScriptRoles ? getScriptStats(customScriptRoles) : undefined}
      isLightModeActive={isLightModeActive}
    />
    </>
  );
}
