import { useState } from 'react';
import { Shuffle, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import WhaleBucketDraftCircle from './DraftCircle';
import GrimoireBalanceVerification from '../shared/GrimoireBalanceVerification';
import ToggleSwitch from '../shared/ToggleSwitch';

import type { ValidationSummary } from '../../utils/validationSummary';

interface WhaleBucketDraftPhaseProps {
  players: Player[];
  validationSummary: ValidationSummary | null;
  isLightModeActive: boolean;
  setPhase: (p: 'setup' | 'draft' | 'game') => void;
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
  isLightModeActive,
  setPhase,
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
      document.getElementById('grimoire-board-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Warn once before sending assignments to connected players — mirrors the
  // Standard mode flow (grimoireConfirmed is re-armed only on Reset, not when
  // stepping back to setup/draft).
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
          onClick={runAssignment}
          className={cn(
            "text-sm font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm border",
            isLightModeActive
              ? "bg-clocktower-townsfolk/10 hover:bg-clocktower-townsfolk/20 text-clocktower-townsfolk border-clocktower-townsfolk/20"
              : "bg-clocktower-townsfolk/20 hover:bg-clocktower-townsfolk/35 text-blue-300 border-clocktower-townsfolk/30"
          )}
        >
          <Shuffle size={14} /> Re-Assign
        </button>
      </div>

      {/* Top Action Buttons */}
      <div className="flex gap-2">
        <button
          id="back-to-setup-button-top"
          onClick={() => setPhase('setup')}
          className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold transition-colors"
        >
          Back to Setup
        </button>
        <button
          id="open-grimoire-button-top"
          disabled={players.some(p => !p.roleId) || (!!validationSummary?.failures?.length && !overrideFailures)}
          onClick={handleOpenGrimoire}
          className="flex-[2] bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40"
        >
          Open Grimoire
        </button>
      </div>

      {/* Validation Summary Card */}
      {validationSummary && (
        <GrimoireBalanceVerification validationSummary={validationSummary} isLightModeActive={isLightModeActive} />
      )}

      <WhaleBucketDraftCircle
        players={players}
        isLightModeActive={isLightModeActive}
        setActiveDraftPlayerId={setActiveDraftPlayerId}
        remotePlayerIds={remotePlayerIds}
      />
      <div className="flex gap-2">
        <button
          id="back-to-setup-button"
          onClick={() => setPhase('setup')}
          className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold transition-colors"
        >
          Back to Setup
        </button>
        <button
          id="open-grimoire-button"
          disabled={players.some(p => !p.roleId) || (!!validationSummary?.failures?.length && !overrideFailures)}
          onClick={handleOpenGrimoire}
          className="flex-[2] bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40"
        >
          Open Grimoire
        </button>
      </div>
      {validationSummary && validationSummary.failures && validationSummary.failures.length > 0 && (
        <label className={cn(
          "flex items-center justify-center gap-2 text-xs font-semibold select-none cursor-pointer transition-colors mt-2",
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
