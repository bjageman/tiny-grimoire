import { useState } from 'react';
import { Dices, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import AssignmentConfirmationModal from '../shared/modals/AssignmentConfirmationModal';
import type { Player } from '../../WhaleBucket';
import WhaleBucketDraftCircle from './DraftCircle';
import GameSetupMods from '../shared/grimoire/GameSetupMods';
import GrimoireBalanceVerification from '../shared/grimoire/GrimoireBalanceVerification';
import ToggleSwitch from '../shared/ui/ToggleSwitch';

import type { ValidationSummary } from '../../utils/validationSummary';

interface WhaleBucketDraftPhaseProps {
  players: Player[];
  validationSummary: ValidationSummary | null;
  sentinelOutsiderDelta: number;
  setSentinelOutsiderDelta: (delta: number) => void;
  popeEnabled: boolean;
  setPopeEnabled: (enabled: boolean) => void;
  torEnabled?: boolean;
  setTorEnabled?: (enabled: boolean) => void;
  isLightModeActive: boolean;
  onStartGame: () => void;
  runAssignment: () => void;
  onClearRoles: () => void;
  setActiveDraftPlayerId: (id: string | null) => void;
  remotePlayerIds?: Set<string>;
  remotePlayerCount?: number;
  grimoireConfirmed?: boolean;
  onGrimoireConfirmed?: () => void;
}

export default function WhaleBucketDraftPhase({
  players,
  validationSummary,
  sentinelOutsiderDelta,
  setSentinelOutsiderDelta,
  popeEnabled,
  setPopeEnabled,
  torEnabled = false,
  setTorEnabled = () => {},
  isLightModeActive,
  onStartGame,
  runAssignment,
  onClearRoles,
  setActiveDraftPlayerId,
  remotePlayerIds,
  remotePlayerCount = 0,
  grimoireConfirmed = false,
  onGrimoireConfirmed,
}: WhaleBucketDraftPhaseProps) {
  const [overrideFailures, setOverrideFailures] = useState(false);
  const [showGrimoireWarning, setShowGrimoireWarning] = useState(false);

  // Warn once before sending assignments to players, mirroring Standard mode (grimoireConfirmed re-arms only on Reset).
  const handleOpenGrimoire = () => {
    if (remotePlayerCount > 0 && !grimoireConfirmed) {
      setShowGrimoireWarning(true);
    } else {
      onStartGame();
    }
  };

  const confirmOpenGrimoire = () => {
    setShowGrimoireWarning(false);
    onGrimoireConfirmed?.();
    onStartGame();
  };

  return (
    <>
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
        <h2 className={cn(
          "text-center font-display text-lg font-bold tracking-wider uppercase sm:text-left",
          isLightModeActive ? "text-gray-800" : "text-gray-300"
        )}>
          Character Assignment
        </h2>
        <div id="whalebucket-assignment-actions" className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          <button
            id="reassign-characters-button"
            onClick={runAssignment}
            className={cn(
              "min-w-0 flex-1 justify-center whitespace-nowrap text-sm font-bold px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm border sm:w-auto sm:flex-none sm:shrink",
              isLightModeActive
                ? "bg-clocktower-townsfolk/10 hover:bg-clocktower-townsfolk/20 text-clocktower-townsfolk border-clocktower-townsfolk/20"
                : "bg-clocktower-townsfolk/20 hover:bg-clocktower-townsfolk/35 text-blue-300 border-clocktower-townsfolk/30"
            )}
          >
            <Dices size={14} /> Auto-Assign
          </button>
          <button
            id="clear-roles-button"
            onClick={onClearRoles}
            className={cn(
              "min-w-0 flex-1 justify-center whitespace-nowrap text-sm font-bold px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm border sm:w-auto sm:flex-none",
              isLightModeActive
                ? "bg-clocktower-blood/10 hover:bg-clocktower-blood/20 text-clocktower-blood border-clocktower-blood/20"
                : "bg-clocktower-blood/20 hover:bg-clocktower-blood/35 text-red-300 border-clocktower-blood/30"
            )}
          >
            <Trash2 size={14} /> Clear Roles
          </button>
        </div>
      </div>

      <div
        id="whalebucket-assignment-layout"
        className="grid grid-cols-1 gap-5 items-start md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div id="whalebucket-assignment-grimoire" className="order-1 min-w-0 md:order-1">
          <WhaleBucketDraftCircle
            players={players}
            isLightModeActive={isLightModeActive}
            setActiveDraftPlayerId={setActiveDraftPlayerId}
            remotePlayerIds={remotePlayerIds}
          />
        </div>
        <aside id="whalebucket-assignment-sidebar" className="contents md:order-2 md:block md:min-w-0 md:space-y-5">
          {validationSummary && (
            <div className="order-2">
              <GrimoireBalanceVerification
                validationSummary={validationSummary}
                isLightModeActive={isLightModeActive}
                persistenceKey="whale-bucket-balance-verification-expanded"
              />
            </div>
          )}
          <div className="order-3">
            <GameSetupMods
              sentinelOutsiderDelta={sentinelOutsiderDelta}
              setSentinelOutsiderDelta={setSentinelOutsiderDelta}
              popeEnabled={popeEnabled}
              setPopeEnabled={setPopeEnabled}
              torEnabled={torEnabled}
              setTorEnabled={setTorEnabled}
              isLightModeActive={isLightModeActive}
              persistenceKey="whale-bucket-setup-modifiers-expanded"
            />
          </div>
          <button
            id="open-grimoire-button"
            disabled={players.some(p => !p.roleId) || (!!validationSummary?.failures?.length && !overrideFailures)}
            onClick={handleOpenGrimoire}
            className="order-5 w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40"
          >
            Open Grimoire
          </button>
          {validationSummary && validationSummary.failures && validationSummary.failures.length > 0 && (
            <label className={cn(
              "order-4 flex items-center justify-center gap-2 text-xs font-semibold select-none cursor-pointer transition-colors",
              isLightModeActive ? "text-gray-600 hover:text-gray-800" : "text-gray-400 hover:text-gray-200"
            )}>
              <ToggleSwitch
                id="override-failures-checkbox-whale"
                checked={overrideFailures}
                onChange={setOverrideFailures}
                isLightModeActive={isLightModeActive}
              />
              <span>Override failures</span>
            </label>
          )}
        </aside>
      </div>
    </div>

    {showGrimoireWarning && (
      <AssignmentConfirmationModal
        remotePlayerCount={remotePlayerCount}
        isLightModeActive={isLightModeActive}
        confirmButtonId="confirm-open-grimoire-button-whale"
        onCancel={() => setShowGrimoireWarning(false)}
        onConfirm={confirmOpenGrimoire}
      />
    )}
    </>
  );
}
