import React from 'react';
import { Plus, Upload } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player, Role } from '../types';
import PlayerTrackerSetupPlayerRow from './PlayerTrackerSetupPlayerRow';

interface PlayerTrackerSetupPhaseProps {
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
  isSynced?: boolean;
}

export default function PlayerTrackerSetupPhase({
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
  isSynced = false,
}: PlayerTrackerSetupPhaseProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">
      {/* Section A: Script Upload */}
      <div className="md:col-start-2 md:row-start-1 space-y-6 w-full">
        <section className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/80 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-555 uppercase tracking-wider">Active Script Filter</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1",
                customScriptRoles 
                  ? "bg-clocktower-blood/10 border-clocktower-blood/40 text-clocktower-blood" 
                  : "bg-gray-955 border-gray-800 text-gray-400"
              )}>
                {customScriptRoles ? "📜" : "🌐"} {scriptName}
              </span>
              {customScriptRoles && (
                <span className="text-[10px] text-gray-500 font-medium">
                  ({customScriptRoles.length} roles loaded)
                </span>
              )}
            </div>
          </div>

          {!isSynced && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-gray-955 border border-gray-800 hover:border-clocktower-blood text-gray-300 hover:text-white px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Upload size={14} /> Upload Custom Script JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleScriptUpload}
                className="hidden"
              />
              {customScriptRoles && (
                <button
                  onClick={clearCustomScript}
                  className="bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-900 text-red-300 px-3 py-2 rounded text-xs font-semibold transition-all"
                >
                  Clear Script
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] text-gray-550 leading-relaxed">
            {isSynced 
              ? "The active script is automatically synchronized in real-time from the Storyteller."
              : "Upload a custom script JSON file (e.g., from the Official Script Tool) to restrict character selections in the Player details modal to only those on this script."
            }
          </p>
        </section>
      </div>

      {/* Section B: Players list */}
      <div className="md:col-start-1 md:row-start-1 md:row-span-2 space-y-6 w-full">
        <section>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 mb-4">
            <h2 className="text-lg font-semibold text-gray-300">Players List ({players.length})</h2>
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

          <div className="space-y-2.5">
            {players.map((p, index) => (
              <PlayerTrackerSetupPlayerRow
                key={p.id}
                player={p}
                index={index}
                players={players}
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
                isSynced={isSynced}
              />
            ))}
            {players.length === 0 && (
              <div className="p-8 border border-dashed border-gray-800 rounded-lg text-center text-gray-500 text-sm italic">
                Add players to get started.
              </div>
            )}
          </div>
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
          className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
        >
          Start Game Tracker
        </button>
      </div>
    </div>
  );
}
