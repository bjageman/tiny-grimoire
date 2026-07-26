import { Moon, Eye, EyeOff, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { roleIconFallback } from '../../utils/roleIcon';
import officialRoles from '../../official_roles.json';
import type { Role } from '../../types';

interface RevealedScreenProps {
  isLight: boolean;
  assignedRole: Role;
  revealed: boolean;
  onOpenTracker: () => void;
}

// The joined player's flip-to-reveal character token, leading into the player tracker.
export default function RevealedScreen({ isLight, assignedRole, revealed, onOpenTracker }: RevealedScreenProps) {
  return (
    <div className="space-y-6 text-center">
      <div
        onClick={onOpenTracker}
        className={cn(
          "w-full h-80 rounded-lg border cursor-pointer perspective-1000 transform-style-3d transition-all duration-700 relative shadow-2xl border-clocktower-blood/50",
          revealed ? "rotate-y-180" : ""
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-lg flex flex-col items-center justify-center p-6 backface-hidden",
          isLight ? "bg-gray-100 text-clocktower-night" : "bg-gray-900 text-gray-200"
        )}>
          <div className="w-20 h-20 bg-clocktower-blood/10 border border-clocktower-blood/30 rounded-full flex items-center justify-center mb-4 text-clocktower-blood animate-pulse shadow-[0_0_15px_rgba(139,0,0,0.3)]">
            <Moon size={36} />
          </div>
          <h3 className="font-display text-xl font-bold tracking-wider uppercase">Your Character Token</h3>
          <p className="text-xs text-gray-500 font-semibold mt-2 uppercase tracking-widest flex items-center gap-1">
            <span>Tap to Reveal</span>
            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          </p>
        </div>

        <div className={cn(
          "absolute inset-0 rounded-lg flex flex-col items-center justify-center p-6 rotate-y-180 backface-hidden",
          isLight ? "bg-white" : "bg-gray-950"
        )}>
          <div className={cn(
            "w-28 h-28 rounded-full overflow-hidden border-4 flex items-center justify-center bg-white shadow-lg shadow-black/20 mb-4 animate-scaleUp",
            assignedRole.team === 'townsfolk' && "border-clocktower-townsfolk",
            assignedRole.team === 'outsider' && "border-clocktower-outsider",
            assignedRole.team === 'minion' && "border-clocktower-minion",
            assignedRole.team === 'demon' && "border-clocktower-demon",
            assignedRole.team === 'traveler' && "border-clocktower-traveler"
          )}>
            <img key={assignedRole.id} src={`/icons/${assignedRole.id}.svg`} alt={assignedRole.name} className="w-20 h-20 object-contain" onError={roleIconFallback(assignedRole, assignedRole.team === 'minion' || assignedRole.team === 'demon')} />
          </div>

          <div className="flex gap-2 justify-center items-center mb-3">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border",
              assignedRole.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
              assignedRole.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
              assignedRole.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
              assignedRole.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
              assignedRole.team === 'traveler' && "text-clocktower-traveler border-clocktower-traveler/40 bg-clocktower-traveler/5"
            )}>
              {assignedRole.team}
            </span>
          </div>

          <h3 className={cn(
            "font-display text-2xl font-bold tracking-wider",
            assignedRole.team === 'townsfolk' && "text-clocktower-townsfolk",
            assignedRole.team === 'outsider' && "text-clocktower-outsider",
            assignedRole.team === 'minion' && "text-clocktower-minion",
            assignedRole.team === 'demon' && "text-clocktower-demon",
            assignedRole.team === 'traveler' && "text-clocktower-traveler"
          )}>
            {assignedRole.name}
          </h3>

          <p className="text-xs text-gray-400 mt-3 max-w-[90%] leading-relaxed">
            {assignedRole.ability ?? (officialRoles as Array<{ id: string; ability?: string }>).find((r) => r.id === assignedRole.id)?.ability}
          </p>
        </div>
      </div>

      <button
        onClick={onOpenTracker}
        className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-gray-800 text-white rounded-lg py-3 font-bold transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-black/10 hover:scale-101"
      >
        <Settings size={16} />
        <span>Open Player Game Tracker</span>
      </button>
    </div>
  );
}
