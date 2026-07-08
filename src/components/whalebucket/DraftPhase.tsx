import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import WhaleBucketDraftCircle from './DraftCircle';
import GrimoireBalanceVerification from '../shared/GrimoireBalanceVerification';

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
}: WhaleBucketDraftPhaseProps) {
  const [overrideFailures, setOverrideFailures] = useState(false);
  return (
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
          onClick={() => {
            onStartGame();
            setTimeout(() => {
              const grimoireElement = document.getElementById('grimoire-board-container');
              grimoireElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
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
          onClick={() => {
            onStartGame();
            setTimeout(() => {
              const grimoireElement = document.getElementById('grimoire-board-container');
              grimoireElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
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
          <input
            type="checkbox"
            id="override-failures-checkbox-whale"
            checked={overrideFailures}
            onChange={(e) => setOverrideFailures(e.target.checked)}
            className="rounded border-gray-300 text-clocktower-blood focus:ring-clocktower-blood bg-transparent"
          />
          Override failures
        </label>
      )}
    </div>
  );
}
