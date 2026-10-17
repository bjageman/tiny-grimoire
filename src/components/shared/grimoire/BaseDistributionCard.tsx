import { useState } from 'react';
import { cn } from '../../../utils/cn';
import type { RoleDistribution } from '../../../constants';
import ToggleSwitch from '../ui/ToggleSwitch';

interface BaseDistributionCardProps {
  id?: string;
  playerCount: number;
  dist: RoleDistribution;
  currentDist?: RoleDistribution;
  isLightModeActive?: boolean;
}

export default function BaseDistributionCard({
  id = 'standard-base-distribution',
  playerCount,
  dist,
  currentDist,
  isLightModeActive = false,
}: BaseDistributionCardProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const displayedDist = showCurrent && currentDist ? currentDist : dist;

  return (
    <div
      id={id}
      className={cn(
        'rounded-lg border p-3.5 space-y-2.5 transition-colors duration-300 text-left',
        isLightModeActive
          ? 'bg-white/50 border-gray-300 text-clocktower-night'
          : 'bg-gray-900/40 border-gray-800/80'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className={cn(
          'text-xs uppercase font-bold tracking-wider',
          isLightModeActive ? 'text-gray-600' : 'text-gray-500'
        )}>{showCurrent && currentDist ? 'Current Distribution' : 'Standard Base Distribution'}</h4>
        {currentDist && (
          <label
            htmlFor={`${id}-current-toggle`}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide',
              isLightModeActive ? 'text-gray-600' : 'text-gray-500'
            )}
          >
            Current
            <ToggleSwitch
              id={`${id}-current-toggle`}
              checked={showCurrent}
              onChange={setShowCurrent}
              isLightModeActive={isLightModeActive}
            />
          </label>
        )}
      </div>

      {playerCount >= 5 ? (
        <div className="grid text-center text-[10px] font-mono grid-cols-4 gap-x-1 gap-y-2.5">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wide text-gray-500 font-sans truncate">Townsfolk</div>
            <div className="font-bold text-lg leading-none mt-0.5 text-clocktower-townsfolk">{displayedDist.townsfolk}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wide text-gray-500 font-sans truncate">Outsiders</div>
            <div className="font-bold text-lg leading-none mt-0.5 text-clocktower-outsider">{displayedDist.outsider}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wide text-gray-500 font-sans truncate">Minions</div>
            <div className="font-bold text-lg leading-none mt-0.5 text-clocktower-minion">{displayedDist.minion}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wide text-gray-500 font-sans truncate">Demons</div>
            <div className="font-bold text-lg leading-none mt-0.5 text-clocktower-demon">{displayedDist.demon}</div>
          </div>
        </div>
      ) : (
        <p className={cn("text-xs italic pt-1", isLightModeActive ? "text-gray-500" : "text-gray-500")}>Add at least 5 players to view distribution.</p>
      )}
    </div>
  );
}
