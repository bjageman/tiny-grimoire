import { Shuffle, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import WhaleBucketDraftCircle from './DraftCircle';

import type { ValidationSummary } from '../../utils/whaleBucketValidation';

interface WhaleBucketDraftPhaseProps {
  players: Player[];
  validationSummary: ValidationSummary | null;
  isLightModeActive: boolean;
  setPhase: (p: 'setup' | 'draft' | 'game') => void;
  onStartGame: () => void;
  runAssignment: () => void;
  setActiveDraftPlayerId: (id: string | null) => void;
}

export default function WhaleBucketDraftPhase({
  players,
  validationSummary,
  isLightModeActive,
  setPhase,
  onStartGame,
  runAssignment,
  setActiveDraftPlayerId,
}: WhaleBucketDraftPhaseProps) {
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
          disabled={players.some(p => !p.roleId)}
          onClick={() => {
            onStartGame();
            setTimeout(() => {
              const grimoireElement = document.getElementById('grimoire-board-container');
              grimoireElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          className="flex-[2] bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 shadow-lg shadow-black/40"
        >
          Open Grimoire
        </button>
      </div>

      {/* Validation Summary Card */}
      {validationSummary && (
        <div
          id="grimoire-balance-verification"
          className={cn(
            "border rounded-lg p-3 space-y-2.5 transition-colors duration-300",
            isLightModeActive
              ? "bg-white border-gray-250 text-clocktower-night shadow-sm"
              : "bg-gray-900/90 border-gray-800"
          )}
        >
          <div className="flex items-center gap-1.5">
            {validationSummary.isValid ? (
              <CheckCircle size={16} className="text-clocktower-outsider" />
            ) : (
              <AlertTriangle size={16} className="text-clocktower-minion" />
            )}
            <span className={cn(
              "font-semibold text-xs tracking-wide uppercase",
              isLightModeActive ? "text-gray-700" : "text-gray-300"
            )}>
              Grimoire Balance Verification
            </span>
          </div>

          {validationSummary.modifications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {validationSummary.modifications.map((m, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "text-[9px] border px-1.5 py-0.5 rounded font-medium transition-colors duration-300",
                    isLightModeActive
                      ? "bg-clocktower-blood/5 border-clocktower-blood/20 text-clocktower-blood"
                      : "bg-clocktower-blood/10 border-clocktower-blood/30 text-clocktower-parchment/80"
                  )}
                >
                  {m}
                </span>
              ))}
            </div>
          )}

          <div className={cn(
            "grid text-center text-[10px] font-mono border-t pt-2.5",
            isLightModeActive ? "border-gray-200" : "border-gray-800",
            validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0
              ? "grid-cols-5 gap-1"
              : "grid-cols-4 gap-2"
          )}>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Tfolk</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isTownsfolkValid ? "text-clocktower-townsfolk" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.townsfolk} / {validationSummary.expectedTownsfolkLabel}
              </div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Outsider</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isOutsiderValid ? "text-clocktower-outsider" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.outsider} / {validationSummary.expectedOutsiderLabel}
              </div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Minion</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isMinionValid ? "text-clocktower-minion" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.minion} / {validationSummary.expected.minion}
              </div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Demon</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isDemonValid ? "text-clocktower-demon" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.demon} / {validationSummary.expected.demon}
              </div>
            </div>
            {(validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0) && (
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">Traveler</div>
                <div className="font-bold text-xs mt-0.5 text-clocktower-traveler">
                  {validationSummary.counts.traveler} / {validationSummary.expected.traveler}
                </div>
              </div>
            )}
          </div>

          {validationSummary.jinxWarnings.length > 0 && (
            <div className={cn("border-t pt-2 space-y-1", isLightModeActive ? "border-gray-200" : "border-gray-800")}>
              {validationSummary.jinxWarnings.map((w, idx) => (
                <div key={idx} className={cn("text-[10px] flex items-center gap-1 font-medium", isLightModeActive ? "text-amber-700" : "text-yellow-500")}>
                  <AlertTriangle size={10} /> {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <WhaleBucketDraftCircle
        players={players}
        isLightModeActive={isLightModeActive}
        setActiveDraftPlayerId={setActiveDraftPlayerId}
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
          disabled={players.some(p => !p.roleId)}
          onClick={() => {
            onStartGame();
            setTimeout(() => {
              const grimoireElement = document.getElementById('grimoire-board-container');
              grimoireElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          className="flex-[2] bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all disabled:opacity-40 shadow-lg shadow-black/40"
        >
          Open Grimoire
        </button>
      </div>
    </div>
  );
}
