import { useState } from 'react';
import { Shuffle, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
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
  isLightModeActive: boolean;
  onStartGame: () => void;
  runAssignment: () => void;
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
  isLightModeActive,
  onStartGame,
  runAssignment,
  setActiveDraftPlayerId,
  remotePlayerIds,
  remotePlayerCount = 0,
  grimoireConfirmed = false,
  onGrimoireConfirmed,
}: WhaleBucketDraftPhaseProps) {
  const [overrideFailures, setOverrideFailures] = useState(false);
  const [showGrimoireWarning, setShowGrimoireWarning] = useState(false);

  const doStartGame = () => {
    onStartGame();
    setTimeout(() => {
      if (typeof document === 'undefined') return;
      document.getElementById('grimoire-board-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Warn once before sending assignments to players, mirroring Standard mode (grimoireConfirmed re-arms only on Reset).
  const handleOpenGrimoire = () => {
    if (remotePlayerCount > 0 && !grimoireConfirmed) {
      setShowGrimoireWarning(true);
    } else {
      doStartGame();
    }
  };

  const confirmOpenGrimoire = () => {
    setShowGrimoireWarning(false);
    onGrimoireConfirmed?.();
    doStartGame();
  };

  return (
    <>
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className={cn(
          "font-display text-base font-bold tracking-wider uppercase",
          isLightModeActive ? "text-gray-800" : "text-gray-300"
        )}>
          2. Character Assignment
        </h2>
        <button
          id="reassign-characters-button"
          onClick={runAssignment}
          className={cn(
            "min-w-[7rem] shrink-0 justify-center whitespace-nowrap text-sm font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm border sm:min-w-0 sm:shrink",
            isLightModeActive
              ? "bg-clocktower-townsfolk/10 hover:bg-clocktower-townsfolk/20 text-clocktower-townsfolk border-clocktower-townsfolk/20"
              : "bg-clocktower-townsfolk/20 hover:bg-clocktower-townsfolk/35 text-blue-300 border-clocktower-townsfolk/30"
          )}
        >
          <Shuffle size={14} /> Re-Assign
        </button>
      </div>

      <div
        id="whalebucket-assignment-layout"
        className="grid grid-cols-1 gap-5 items-start md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div className="order-2 min-w-0 md:order-1">
          <WhaleBucketDraftCircle
            players={players}
            isLightModeActive={isLightModeActive}
            setActiveDraftPlayerId={setActiveDraftPlayerId}
            remotePlayerIds={remotePlayerIds}
          />
        </div>
        <aside id="whalebucket-assignment-sidebar" className="order-1 min-w-0 space-y-5 md:order-2">
          {validationSummary && (
            <GrimoireBalanceVerification validationSummary={validationSummary} isLightModeActive={isLightModeActive} />
          )}
          <GameSetupMods
            sentinelOutsiderDelta={sentinelOutsiderDelta}
            setSentinelOutsiderDelta={setSentinelOutsiderDelta}
            popeEnabled={popeEnabled}
            setPopeEnabled={setPopeEnabled}
            isLightModeActive={isLightModeActive}
          />
          <button
            id="open-grimoire-button"
            disabled={players.some(p => !p.roleId) || (!!validationSummary?.failures?.length && !overrideFailures)}
            onClick={handleOpenGrimoire}
            className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40"
          >
            Open Grimoire
          </button>
          {validationSummary && validationSummary.failures && validationSummary.failures.length > 0 && (
            <label className={cn(
              "flex items-center justify-center gap-2 text-xs font-semibold select-none cursor-pointer transition-colors",
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
              id="confirm-open-grimoire-button-whale"
              onClick={confirmOpenGrimoire}
              className="px-4 py-2 rounded-md text-sm font-display font-bold tracking-wider uppercase bg-clocktower-blood text-white hover:bg-red-800 transition-colors"
            >
              Open Grimoire
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
