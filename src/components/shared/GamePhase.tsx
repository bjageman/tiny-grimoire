import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { sortByScriptOrder, withInPlayTravelers } from '../../utils/scriptUtils';
import { useIsMobile } from '../../hooks/useIsMobile';
import { getDistribution } from '../../constants';
import type { Player, Role, PlacedReminder } from '../../types';
import rolesData from '../../roles.json';
import officialRoles from '../../official_roles.json';
import GrimoireBoard from './GrimoireBoard';
import NightOrderWidget from './NightOrderWidget';
import ScriptCharactersModal from './ScriptCharactersModal';
import AddTravelerCard from './AddTravelerCard';
import GameLogCard from './GameLogCard';
import GrimoireLedger from './GrimoireLedger';
import DemonBluffs from './DemonBluffs';
import BaseDistributionCard from './BaseDistributionCard';
import AutoResizeTextarea from './AutoResizeTextarea';
import DialogModal from './DialogModal';
import ToggleSwitch from './ToggleSwitch';
import RecapImageExport from './RecapImageExport';
import { buildDiscordPost } from '../../utils/discordRecap';
import { copyText } from '../../utils/clipboard';
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
  remotePlayerIds?: Set<string>;
  // Optional / mode-specific
  selectionRoles?: Role[];
  showNightOrder?: boolean;
  scriptName?: string;
  scriptAuthor?: string;
  customScriptRoles?: Role[] | null;
  isSynced?: boolean;
  isSecondary?: boolean;
  enableReminders?: boolean;
  includeAllScriptReminders?: boolean;
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
  notes?: string;
  onNotesChange?: (notes: string) => void;
  showReminderToggle?: boolean;
  onToggleReminders?: (enabled: boolean) => void;
  /** Storyteller-only features in the script modal (Notes prompts, in-play filter). */
  isStoryteller?: boolean;
}

export default function GamePhase({
  players, timeOfDay, dayNumber, newTravelerName, newTravelerRoleId,
  isLightModeActive, draggedIndex, dragOverIndex,
  setSelectedPlayerId, toggleTimeOfDay, addTravelerGamePhase,
  setNewTravelerName, setNewTravelerRoleId,
  handleMouseDown, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleTouchStart, handleTouchMove, handleTouchEnd,
  onResetDead, onResetTime,
  remotePlayerIds,
  selectionRoles,
  showNightOrder = true,
  scriptName = 'All Roles',
  scriptAuthor = '',
  customScriptRoles = null,
  isSynced = false,
  isSecondary = false,
  enableReminders = true,
  includeAllScriptReminders = false,
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
  notes,
  onNotesChange,
  showReminderToggle = false,
  onToggleReminders,
  isStoryteller = false,
}: Props) {

  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [postCopied, setPostCopied] = useState(false);
  const [isLedgerCollapsed, setIsLedgerCollapsed] = useState(true);
  const [localReminderTokens, setLocalReminderTokens] = useState<PlacedReminder[]>([]);
  const reminderTokens = propReminderTokens !== undefined ? propReminderTokens : localReminderTokens;
  const setReminderTokens = onSetReminderTokens !== undefined ? onSetReminderTokens : setLocalReminderTokens;

  const handleAddReminder = (targetPlayerId: string, sourceCharId: string, text: string) => {
    const id = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    setReminderTokens(prev => [...prev, { id, sourceCharId, text, targetPlayerId }]);
    const targetName = players.find(p => p.id === targetPlayerId)?.name ?? targetPlayerId;
    const charName = (customScriptRoles || (rolesData as Role[])).find(r => r.id === sourceCharId)?.name ?? sourceCharId;
    onLogEvent?.(`Reminder "${text} (${charName})" placed on ${targetName}`);
  };
  const handleRemoveReminder = (reminderId: string) => {
    const token = reminderTokens.find(r => r.id === reminderId);
    if (token) {
      const targetName = players.find(p => p.id === token.targetPlayerId)?.name ?? token.targetPlayerId;
      const charName = (customScriptRoles || (rolesData as Role[])).find(r => r.id === token.sourceCharId)?.name ?? token.sourceCharId;
      onLogEvent?.(`Reminder "${token.text} (${charName})" removed from ${targetName}`);
    }
    setReminderTokens(prev => prev.filter(r => r.id !== reminderId));
  };
  const { dialogProps, showConfirm, showAlert } = useDialog();

  const handleRemoveAllReminders = () => {
    showConfirm('Remove all reminder tokens?', () => {
      if (reminderTokens.length > 0) onLogEvent?.(`All reminders cleared`);
      setReminderTokens([]);
    }, 'Reset Reminders');
  };

  const sortedRoles = useMemo(() => {
    const baseRoles = customScriptRoles || (rolesData as Role[]);
    return sortByScriptOrder(withInPlayTravelers(baseRoles, players), baseRoles);
  }, [customScriptRoles, players]);

  const grimoireRolesData = selectionRoles ?? (officialRoles as Role[]);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!postCopied) return;
    const t = setTimeout(() => setPostCopied(false), 1800);
    return () => clearTimeout(t);
  }, [postCopied]);

  const handleCopyPost = async () => {
    const { text } = buildDiscordPost({
      players,
      rolesData: grimoireRolesData,
      gameLog: gameLog ?? [],
      scriptName,
      dayNumber,
      timeOfDay,
    });
    if (await copyText(text)) {
      setPostCopied(true);
    } else {
      showAlert(
        'Your browser would not let the page write to the clipboard. Select the log text and copy it by hand, or open the app over https (or on localhost) where copying is permitted.',
        'Copy failed'
      );
    }
  };

  const renderScriptButton = (id: string, visibilityClassName: string) => (
    <button
      id={id}
      type="button"
      onClick={() => setIsScriptModalOpen(true)}
      className={cn(
        visibilityClassName,
        "flex-col w-full border py-3.5 px-4 rounded-lg items-center justify-center gap-1 text-center transition-colors duration-300 cursor-pointer focus:outline-none hover:opacity-90 active:scale-[0.98]",
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
      {scriptAuthor && (
        <span className="text-[10px] text-gray-500 font-medium">
          by {scriptAuthor}
        </span>
      )}
    </button>
  );

  return (
    <>
    <DialogModal {...dialogProps} isLightModeActive={isLightModeActive} />
    <div className="space-y-6 animate-fadeIn md:grid md:grid-cols-[3fr_2fr] xl:grid-cols-[2fr_1fr] md:gap-8 md:space-y-0 md:items-start">
      {/* Column 1: Board & Night Order */}
      <div className="space-y-6">
        <div id="grimoire-board-container" className="space-y-4">
          <GrimoireBoard
            players={players}
            timeOfDay={timeOfDay}
            dayNumber={dayNumber}
            toggleTimeOfDay={!isSynced && !showNightOrder ? toggleTimeOfDay : undefined}
            onSelectPlayer={setSelectedPlayerId}
            rolesData={grimoireRolesData}
            onResetDead={onResetDead}
            onResetTime={onResetTime}
            isSynced={isSynced}
            isLightModeActive={isLightModeActive}
            remotePlayerIds={remotePlayerIds}
            includeAllScriptReminders={includeAllScriptReminders}
            reminderTokens={enableReminders ? reminderTokens : []}
            onAddReminder={enableReminders ? handleAddReminder : undefined}
            onRemoveReminder={enableReminders ? handleRemoveReminder : undefined}
            onRemoveAllReminders={enableReminders ? handleRemoveAllReminders : undefined}
            rotationOffset={rotationOffset}
            onRotationChange={onRotationChange}
          />
        </div>
        {renderScriptButton('game-script-button-mobile', 'flex md:hidden')}
        {showNightOrder && (
          <NightOrderWidget
            players={players}
            timeOfDay={timeOfDay}
            dayNumber={dayNumber}
            isLightModeActive={isLightModeActive}
            onToggleTimeOfDay={!isSynced ? toggleTimeOfDay : undefined}
            checkedItems={checkedItems}
            onSetCheckedItems={onSetCheckedItems}
            scriptRoles={customScriptRoles ?? undefined}
          />
        )}
        {onNotesChange && (
          <div className="hidden md:block space-y-1.5">
            <p className={cn('text-[10px] uppercase font-bold tracking-wider', isLightModeActive ? 'text-gray-400' : 'text-gray-500')}>Notes</p>
            <AutoResizeTextarea
              value={notes ?? ''}
              onChange={onNotesChange}
              placeholder="Write anything here. Deductions, suspicions, reminders..."
              isLightModeActive={isLightModeActive}
            />
            {showReminderToggle && onToggleReminders && (
              <label className={cn(
                "flex items-center gap-2 text-xs font-semibold select-none cursor-pointer transition-colors pt-2",
                isLightModeActive ? "text-gray-600 hover:text-gray-800" : "text-gray-400 hover:text-gray-200"
              )}>
                <ToggleSwitch
                  id="toggle-reminders-checkbox-desktop"
                  checked={enableReminders}
                  onChange={onToggleReminders}
                  isLightModeActive={isLightModeActive}
                />
                <span>Turn on Reminder Tokens</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Column 2: Controls */}
      <div id="grimoire-controls-container" className="space-y-6">

        {/* Active Script Display */}
        {renderScriptButton('game-script-button', 'hidden md:flex')}

        {/* Standard Base Distribution */}
        {players.length >= 5 && (() => {
          const travelerCountInPlay = players.filter(p => {
            if (!p.roleId) return false;
            const r = (customScriptRoles || (rolesData as Role[])).find(role => role.id === p.roleId);
            return r?.team === 'traveler';
          }).length;
          const baseCount = players.length - travelerCountInPlay;
          const dist = getDistribution(baseCount);
          return (
            <BaseDistributionCard
              playerCount={players.length}
              dist={dist}
              isLightModeActive={isLightModeActive}
            />
          );
        })()}

        {/* Demon Bluffs — always dark, unaffected by theme */}
        {!isSynced && onUpdateDemonBluffs && (
          <DemonBluffs
            demonBluffs={demonBluffs}
            onUpdateDemonBluffs={onUpdateDemonBluffs}
            players={players}
            customScriptRoles={customScriptRoles}
            grimoireRolesData={grimoireRolesData}
            isLightModeActive={isLightModeActive}
          />
        )}

        {/* Declare Winner */}
        {!isSynced && onDeclareWinner && (
          <div className={cn(
            'rounded-lg border p-3.5 space-y-2.5 transition-colors duration-300',
            isLightModeActive
              ? 'bg-white/50 border-gray-300'
              : 'bg-gray-900/40 border-gray-800/80',
            isSecondary && 'opacity-40'
          )}>
            <h4 className={cn(
              'text-xs uppercase font-bold tracking-wider',
              isLightModeActive ? 'text-gray-600' : 'text-gray-500'
            )}>Declare Winner</h4>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSecondary}
                onClick={() => onDeclareWinner('good')}
                className={cn(
                  "flex-1 py-2 rounded text-xs font-bold text-white transition-colors",
                  isSecondary
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-blue-600 hover:bg-blue-500"
                )}
                title={isSecondary ? "Declaring a winner is disabled on secondary devices." : undefined}
              >
                🌟 Good Wins
              </button>
              <button
                type="button"
                disabled={isSecondary}
                onClick={() => onDeclareWinner('evil')}
                className={cn(
                  "flex-1 py-2 rounded text-xs font-bold text-white transition-colors",
                  isSecondary
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-red-800 hover:bg-red-700"
                )}
                title={isSecondary ? "Declaring a winner is disabled on secondary devices." : undefined}
              >
                😈 Evil Wins
              </button>
            </div>
          </div>
        )}

        {/* Add Traveler */}
        {!isSynced && (
          <AddTravelerCard
            isLightModeActive={isLightModeActive}
            title={travelerCardTitle}
            name={newTravelerName}
            onNameChange={setNewTravelerName}
            roleId={newTravelerRoleId}
            onRoleIdChange={setNewTravelerRoleId}
            disabled={players.length >= 20}
            onAdd={addTravelerGamePhase}
          />
        )}

        {/* Ledger */}
        <GrimoireLedger
          isLightModeActive={isLightModeActive}
          isSynced={isSynced}
          players={players}
          roles={grimoireRolesData}
          collapsed={isLedgerCollapsed}
          onToggleCollapsed={() => setIsLedgerCollapsed(prev => !prev)}
          onSelectPlayer={setSelectedPlayerId}
          dnd={{
            draggedIndex, dragOverIndex,
            onMouseDown: handleMouseDown,
            onDragStart: handleDragStart,
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
            onDragEnd: handleDragEnd,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
          }}
        />

        {/* Game Log */}
        {!isSynced && onDownloadLog && (
          <GameLogCard
            isLightModeActive={isLightModeActive}
            isMobile={isMobile}
            gameLog={gameLog}
            isSavingImage={isSavingImage}
            onSaveImage={() => setIsSavingImage(true)}
            onCopyPost={handleCopyPost}
            postCopied={postCopied}
            onDownloadLog={onDownloadLog}
          />
        )}
      </div>

      <ScriptCharactersModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        scriptName={scriptName}
        roles={sortedRoles}
        scriptAuthor={scriptAuthor || undefined}
        isLightModeActive={isLightModeActive}
        isStoryteller={isStoryteller}
        players={players}
      />

      {isSavingImage && (
        <RecapImageExport
          players={players}
          rolesData={grimoireRolesData}
          reminderTokens={reminderTokens}
          gameLog={gameLog ?? []}
          scriptName={scriptName}
          dayNumber={dayNumber}
          timeOfDay={timeOfDay}
          isLightModeActive={isLightModeActive}
          onDone={(error) => {
            setIsSavingImage(false);
            if (error) showAlert(`The grimoire image could not be saved — ${error}.`, 'Save failed');
          }}
        />
      )}

    </div>

    {onNotesChange && (
      <div className="md:hidden mt-6 space-y-1.5">
        <p className={cn('text-[10px] uppercase font-bold tracking-wider', isLightModeActive ? 'text-gray-400' : 'text-gray-500')}>Notes</p>
        <AutoResizeTextarea
          value={notes ?? ''}
          onChange={onNotesChange}
          placeholder="Write anything here. Deductions, suspicions, reminders..."
          isLightModeActive={isLightModeActive}
        />
        {showReminderToggle && onToggleReminders && (
          <label className={cn(
            "flex items-center gap-2 text-xs font-semibold select-none cursor-pointer transition-colors pt-2",
            isLightModeActive ? "text-gray-600 hover:text-gray-800" : "text-gray-400 hover:text-gray-200"
          )}>
            <ToggleSwitch
              id="toggle-reminders-checkbox-mobile"
              checked={enableReminders}
              onChange={onToggleReminders}
              isLightModeActive={isLightModeActive}
            />
            <span>Turn on Reminder Tokens</span>
          </label>
        )}
      </div>
    )}
    </>
  );
}
