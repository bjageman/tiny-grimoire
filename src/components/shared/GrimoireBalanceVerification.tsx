import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ValidationSummary } from '../../utils/validationSummary';

interface GrimoireBalanceVerificationProps {
  validationSummary: ValidationSummary;
  isLightModeActive?: boolean;
}

export default function GrimoireBalanceVerification({
  validationSummary,
  isLightModeActive = false,
}: GrimoireBalanceVerificationProps) {
  return (
    <div
      id="grimoire-balance-verification"
      className={cn(
        "border rounded-lg p-3 space-y-2.5 transition-colors duration-300 text-left",
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
  );
}
