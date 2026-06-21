import { useState } from 'react';
import { Check, RotateCcw, Moon, Award } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../types';
import nightSheet from '../nightsheet.json';
import officialRoles from '../official_roles.json';

interface NightOrderWidgetProps {
  players: Player[];
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  isLightModeActive: boolean;
}

interface NightOrderItem {
  type: 'info' | 'character';
  id: string; // unique ID for list rendering
  roleId: string;
  name: string;
  description?: string;
  team?: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler';
  player?: Player;
}

export default function NightOrderWidget({
  players,
  timeOfDay,
  dayNumber,
  isLightModeActive,
}: NightOrderWidgetProps) {
  // Track previous phase to reset tab and checklist on phase change
  const [prevPhase, setPrevPhase] = useState({ dayNumber, timeOfDay });
  const [activeTab, setActiveTab] = useState<'first' | 'other'>(dayNumber === 1 ? 'first' : 'other');
  
  // Track checkmarks by item ID
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Reset tab and checklists during render if phase changes
  if (prevPhase.dayNumber !== dayNumber || prevPhase.timeOfDay !== timeOfDay) {
    setPrevPhase({ dayNumber, timeOfDay });
    setActiveTab(dayNumber === 1 ? 'first' : 'other');
    setCheckedItems({});
  }

  // Clear checks manually
  const handleReset = () => {
    setCheckedItems({});
  };

  // Toggle checkmark
  const handleToggleCheck = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Group in-play players by their role ID
  const playersByRole = new Map<string, Player[]>();
  players.forEach(p => {
    if (p.roleId) {
      const list = playersByRole.get(p.roleId) || [];
      list.push(p);
      playersByRole.set(p.roleId, list);
    }
  });

  const nightList = activeTab === 'first' ? nightSheet.firstNight : nightSheet.otherNight;

  // Build the list of active items for the night
  const items: NightOrderItem[] = [];

  nightList.forEach(id => {
    if (id === 'dusk') {
      items.push({
        type: 'info',
        id: 'dusk',
        roleId: 'dusk',
        name: 'Dusk',
        description: 'Storyteller: Announce that night falls. Everyone closes their eyes.',
      });
      return;
    }
    if (id === 'dawn') {
      items.push({
        type: 'info',
        id: 'dawn',
        roleId: 'dawn',
        name: 'Dawn',
        description: 'Storyteller: Announce that dawn has broken. Everyone opens their eyes.',
      });
      return;
    }
    if (id === 'minioninfo') {
      if (activeTab === 'first') {
        items.push({
          type: 'info',
          id: 'minioninfo',
          roleId: 'minioninfo',
          name: 'Minion Info',
          description: 'Storyteller: Wake all Minions. Show them who each other are and who the Demon is.',
        });
      }
      return;
    }
    if (id === 'demoninfo') {
      if (activeTab === 'first') {
        items.push({
          type: 'info',
          id: 'demoninfo',
          roleId: 'demoninfo',
          name: 'Demon Info',
          description: 'Storyteller: Wake the Demon. Show them who their Minions are, and 3 bluffs.',
        });
      }
      return;
    }

    // Check if the character is in play
    let matchedPlayers = playersByRole.get(id) || [];
    if (id === 'lilmonsta') {
      const extra = players.filter(p => p.isTheLilMonsta && p.roleId !== 'lilmonsta');
      matchedPlayers = [...matchedPlayers, ...extra];
    }
    if (matchedPlayers.length > 0) {
      const roleDetails = officialRoles.find(r => r.id === id);
      const reminder = activeTab === 'first' 
        ? roleDetails?.firstNightReminder 
        : roleDetails?.otherNightReminder;

      matchedPlayers.forEach(player => {
        items.push({
          type: 'character',
          id: `${id}-${player.id}`,
          roleId: id,
          name: roleDetails?.name || player.roleId || id,
          description: reminder || roleDetails?.ability || 'Wake player and resolve ability.',
          team: (roleDetails?.team as 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler') || 'townsfolk',
          player,
        });
      });
    }
  });

  // Calculate completion status of waking steps
  const wakeItems = items.filter(item => item.type === 'character' || item.id === 'minioninfo' || item.id === 'demoninfo');
  const allResolved = wakeItems.length > 0 && wakeItems.every(item => checkedItems[item.id]);

  const getCharacterColorClass = (item: NightOrderItem, isLight: boolean) => {
    if (item.type === 'info') {
      return isLight ? 'text-gray-600' : 'text-gray-400';
    }
    switch (item.team) {
      case 'townsfolk':
        return isLight ? 'text-blue-700' : 'text-blue-400';
      case 'outsider':
        return isLight ? 'text-emerald-700' : 'text-emerald-400';
      case 'minion':
        return isLight ? 'text-red-600' : 'text-rose-400';
      case 'demon':
        return isLight ? 'text-red-800' : 'text-red-400';
      case 'traveler':
        return isLight ? 'text-purple-700' : 'text-purple-400';
      default:
        return isLight ? 'text-gray-900' : 'text-[#f4e4bc]';
    }
  };

  return (
    <div
      id="night-order-widget"
      className={cn(
        "rounded-xl border p-4 space-y-4 shadow-lg transition-all duration-300 w-full",
        isLightModeActive
          ? "bg-[#faf9f5] border-gray-250 text-clocktower-night shadow-gray-200/50"
          : "bg-[#141416] border-[#27272a] text-[#f4e4bc] shadow-black/45"
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-gray-300 dark:border-gray-800">
        <div>
          <h3 className="font-serif text-lg font-bold tracking-wide flex items-center gap-2">
            <Moon className="w-5 h-5 text-amber-500" />
            Night Order Guide
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            Currently active characters in wake-up sequence
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Tabs */}
          <div className="flex bg-gray-200 dark:bg-gray-900 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('first')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all",
                activeTab === 'first'
                  ? "bg-clocktower-blood text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              First Night
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all",
                activeTab === 'other'
                  ? "bg-clocktower-blood text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Other Nights
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            title="Reset checklist"
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors text-gray-500"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Completion Banner */}
      {allResolved && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 animate-fadeIn">
          <Award className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span className="text-xs font-bold uppercase tracking-wider">All night actions resolved! Dawn awaits.</span>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500 italic">
            No active characters wake up tonight.
          </div>
        ) : (
          items.map((item) => {
            const isChecked = checkedItems[item.id] || false;
            const isInfo = item.type === 'info';
            const isDead = item.player?.isDead;

            return (
              <div
                key={item.id}
                onClick={() => !isInfo && handleToggleCheck(item.id)}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg border transition-all select-none",
                  isInfo
                    ? "bg-gray-150/45 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800"
                    : cn(
                        "cursor-pointer",
                        isChecked
                          ? "bg-emerald-500/5 border-emerald-500/30 opacity-60"
                          : isDead
                            ? "bg-gray-200/40 dark:bg-gray-900/10 border-gray-300 dark:border-gray-800/80 opacity-50"
                            : isLightModeActive
                              ? "bg-white border-gray-200 hover:border-gray-300"
                              : "bg-[#1c1c1e] border-[#2c2c2e] hover:border-[#3c3c3e]"
                      )
                )}
              >
                {/* Checkbox for characters / step indicator */}
                {!isInfo ? (
                  <div
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 mt-0.5",
                      isChecked
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-400 dark:border-gray-600"
                    )}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </div>
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center font-bold font-mono text-[10px] bg-gray-200 dark:bg-gray-800 rounded text-gray-500 flex-shrink-0 mt-0.5">
                    *
                  </div>
                )}

                {/* Role and Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          "font-bold font-serif text-sm",
                          getCharacterColorClass(item, isLightModeActive),
                          isChecked && "line-through text-gray-500"
                        )}
                      >
                        {item.name}
                      </span>

                      {/* Status Badges */}
                      {isDead && (
                        <span className="text-[9px] bg-gray-600/20 text-gray-400 border border-gray-600/30 px-1 rounded font-bold uppercase tracking-wide">
                          Dead
                        </span>
                      )}

                      {item.player?.isTheDrunk && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1 rounded font-bold uppercase tracking-wide">
                          Drunk
                        </span>
                      )}
                      {item.player?.isTheMarionette && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1 rounded font-bold uppercase tracking-wide">
                          Marionette
                        </span>
                      )}
                      {item.player?.isTheLunatic && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1 rounded font-bold uppercase tracking-wide">
                          Lunatic
                        </span>
                      )}
                      {item.player?.isDrunkOrPoisoned && (
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1 rounded font-bold uppercase tracking-wide">
                          Poisoned
                        </span>
                      )}
                    </div>

                    {/* Player name */}
                    {item.player && (
                      <span className={cn(
                        "text-xs font-medium ml-auto",
                        isLightModeActive ? "text-gray-600" : "text-gray-400"
                      )}>
                        {item.player.name}
                      </span>
                    )}
                  </div>

                  {/* Description / Reminder */}
                  {item.description && (
                    <p
                      className={cn(
                        "text-xs mt-1 leading-relaxed",
                        isChecked
                          ? "text-gray-500"
                          : (isLightModeActive ? "text-gray-600" : "text-gray-300")
                      )}
                    >
                      {item.description.replace(/:reminder:/g, '').trim()}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
