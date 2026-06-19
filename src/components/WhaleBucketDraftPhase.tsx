import { Shuffle, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../WhaleBucket';
import type { Role } from '../types';
import rolesData from '../roles.json';

interface ValidationSummary {
  isValid: boolean;
  modifications: string[];
  counts: { townsfolk: number; outsider: number; minion: number; demon: number; traveler: number };
  expected: { townsfolk: number; outsider: number; minion: number; demon: number; traveler: number };
  isTownsfolkValid: boolean;
  isOutsiderValid: boolean;
  isMinionValid: boolean;
  isDemonValid: boolean;
  hasGodfather: boolean;
  jinxWarnings: string[];
}

interface WhaleBucketDraftPhaseProps {
  players: Player[];
  validationSummary: ValidationSummary | null;
  isLightModeActive: boolean;
  setPhase: (p: 'setup' | 'draft' | 'game') => void;
  runAssignment: () => void;
  setActiveDraftPlayerId: (id: string | null) => void;
  togglePlayerTheDrunk: (id: string) => void;
  togglePlayerTheMarionette: (id: string) => void;
  togglePlayerTheLunatic: (id: string) => void;
}

export default function WhaleBucketDraftPhase({
  players,
  validationSummary,
  isLightModeActive,
  setPhase,
  runAssignment,
  setActiveDraftPlayerId,
  togglePlayerTheDrunk,
  togglePlayerTheMarionette,
  togglePlayerTheLunatic,
}: WhaleBucketDraftPhaseProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-300">2. Character Draft Assignment</h2>
        <button
          onClick={runAssignment}
          className="text-xs text-clocktower-townsfolk flex items-center gap-1 hover:underline font-semibold"
        >
          <Shuffle size={12} /> Re-Assign
        </button>
      </div>

      <div className="space-y-2.5">
        {players.map((p, idx) => {
          const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
          
          const isTownsfolk = roleObj?.team === 'townsfolk';
          const isGood = roleObj?.team === 'townsfolk' || roleObj?.team === 'outsider';

          const N = players.length;
          const leftNeighbor = players[(idx - 1 + N) % N];
          const rightNeighbor = players[(idx + 1) % N];
          const leftRoleObj = (rolesData as Role[]).find(r => r.id === leftNeighbor?.roleId);
          const rightRoleObj = (rolesData as Role[]).find(r => r.id === rightNeighbor?.roleId);
          const isLeftDemon = leftRoleObj?.team === 'demon' && !leftNeighbor?.isTheLunatic;
          const isRightDemon = rightRoleObj?.team === 'demon' && !rightNeighbor?.isTheLunatic;
          const isNextToDemon = isLeftDemon || isRightDemon;
          const canBeDrunk = p.isTheDrunk || isTownsfolk;
          const canBeMarionette = p.isTheMarionette || (isGood && isNextToDemon);

          const isDemon = roleObj?.team === 'demon';
          const canBeLunatic = p.isTheLunatic || isDemon;

          const isDrunkSelectedElsewhere = players.some(pl => pl.id !== p.id && pl.isTheDrunk);
          const isMarionetteSelectedElsewhere = players.some(pl => pl.id !== p.id && pl.isTheMarionette);
          const isLunaticSelectedElsewhere = players.some(pl => pl.id !== p.id && pl.isTheLunatic);
          return (
            <div key={p.id} className="bg-gray-900 p-3 rounded-lg border border-gray-855 space-y-2">
               <div className="flex justify-between items-center">
                <span className="font-bold text-gray-200">{p.name}</span>
                <div className="flex items-center gap-2">
                  {p.isTheDrunk && (
                    <span className="text-[8px] font-black text-black bg-yellow-600 border border-yellow-750 px-1 py-0.5 rounded uppercase">
                      THE DRUNK
                    </span>
                  )}
                  {p.isTheMarionette && (
                    <span className="text-[8px] font-black text-white bg-clocktower-minion border border-clocktower-minion/30 px-1 py-0.5 rounded uppercase">
                      THE MARIONETTE
                    </span>
                  )}
                  {p.isTheLunatic && (
                    <span className="text-[8px] font-black text-white bg-clocktower-outsider border border-clocktower-outsider/30 px-1 py-0.5 rounded uppercase">
                      THE LUNATIC
                    </span>
                  )}
                  {p.assignedFromPref ? (
                    <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1 rounded flex items-center gap-0.5">
                      ★ PREF
                    </span>
                  ) : (
                    <span className="text-[8px] font-medium text-gray-500 bg-gray-955 px-1 rounded border border-gray-850">
                      FALLBACK
                    </span>
                  )}
                  <span className={cn(
                    "text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border",
                    roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
                    roleObj?.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
                    roleObj?.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
                    roleObj?.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
                  )}>
                    {roleObj?.team || 'N/A'}
                  </span>
                </div>
              </div>

              {!p.roleId ? (
                <div className="relative">
                  <div 
                    onClick={() => setActiveDraftPlayerId(p.id)}
                    className="flex items-center bg-gray-800/50 rounded px-3 py-1.5 border border-gray-700/60 cursor-text text-sm text-gray-400"
                  >
                    Tap to select character...
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-955/40 px-3 py-2 rounded border border-gray-850">
                    <div className="flex items-center gap-2">
                      {roleObj && (
                        <img
                          src={`/icons/${roleObj.id}.svg`}
                          alt={roleObj.name}
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <span className={cn(
                        "font-semibold text-sm",
                        roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                        roleObj?.team === 'outsider' && "text-clocktower-outsider",
                        roleObj?.team === 'minion' && "text-clocktower-minion",
                        roleObj?.team === 'demon' && "text-clocktower-demon",
                      )}>
                        {roleObj?.name}
                      </span>
                    </div>
                    <button onClick={() => setActiveDraftPlayerId(p.id)} className="text-gray-500 hover:text-gray-300 text-xs underline font-medium">
                      Change
                    </button>
                  </div>
                  {/* Secret Role Draft Toggles */}
                  {(canBeDrunk || canBeMarionette || canBeLunatic) && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {canBeDrunk && (
                        <button
                          type="button"
                          disabled={isDrunkSelectedElsewhere}
                          onClick={() => togglePlayerTheDrunk(p.id)}
                          className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-500",
                            p.isTheDrunk
                              ? "bg-yellow-600 border-yellow-755 text-black font-black"
                              : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                          )}
                        >
                          🍺 The Drunk
                        </button>
                      )}
                      {canBeMarionette && (
                        <button
                          type="button"
                          disabled={isMarionetteSelectedElsewhere}
                          onClick={() => togglePlayerTheMarionette(p.id)}
                          className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-500",
                            p.isTheMarionette
                              ? "bg-clocktower-minion border-clocktower-minion/40 text-white font-black"
                              : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                          )}
                        >
                          🎭 The Marionette
                        </button>
                      )}
                      {canBeLunatic && (
                        <button
                          type="button"
                          disabled={isLunaticSelectedElsewhere}
                          onClick={() => togglePlayerTheLunatic(p.id)}
                          className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-500",
                            p.isTheLunatic
                              ? "bg-clocktower-outsider border-clocktower-outsider/40 text-white font-black"
                              : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                          )}
                        >
                          👹 The Lunatic
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
              <div className="text-gray-500">TF</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isTownsfolkValid ? "text-clocktower-townsfolk" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.townsfolk} / {validationSummary.expected.townsfolk}
              </div>
            </div>
            <div>
              <div className="text-gray-500">OUT</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isOutsiderValid ? "text-clocktower-outsider" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.outsider} / {validationSummary.hasGodfather ? `${validationSummary.expected.outsider - 1} or ${validationSummary.expected.outsider + 1}` : validationSummary.expected.outsider}
              </div>
            </div>
            <div>
              <div className="text-gray-500">MIN</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isMinionValid ? "text-clocktower-minion" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.minion} / {validationSummary.expected.minion}
              </div>
            </div>
            <div>
              <div className="text-gray-500">DEM</div>
              <div className={cn("font-bold text-xs mt-0.5", validationSummary.isDemonValid ? "text-clocktower-demon" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                {validationSummary.counts.demon} / {validationSummary.expected.demon}
              </div>
            </div>
            {(validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0) && (
              <div>
                <div className="text-gray-500">TRV</div>
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
          onClick={() => setPhase('game')}
          className="flex-[2] bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 shadow-lg shadow-black/40"
        >
          Open Grimoire
        </button>
      </div>
    </div>
  );
}
