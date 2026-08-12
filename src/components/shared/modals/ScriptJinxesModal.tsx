import { useMemo, useState } from 'react';
import { X, Link2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { roleIconFallback } from '../../../utils/roleIcon';
import { scriptJinxes, filterJinxesInPlay, type ScriptJinx } from '../../../utils/jinxUtils';
import ToggleSwitch from '../ui/ToggleSwitch';
import type { Role } from '../../../types';

interface Props {
  onClose: () => void;
  roles: Role[];
  isLightModeActive: boolean;
  /** Storyteller-only: offers an in-play filter on top of the script filter. */
  isStoryteller?: boolean;
  /** Ids of the characters actually in play, used by the storyteller filter. */
  inPlayIds?: Set<string>;
}

export default function ScriptJinxesModal({ onClose, roles, isLightModeActive, isStoryteller = false, inPlayIds }: Props) {
  const [inPlayOnly, setInPlayOnly] = useState(() => {
    return localStorage.getItem('botc-jinxes-in-play-only') === 'true';
  });

  useEscapeKey(onClose);

  const handleToggleInPlayOnly = (val: boolean) => {
    setInPlayOnly(val);
    localStorage.setItem('botc-jinxes-in-play-only', String(val));
  };

  const allJinxes = useMemo(() => scriptJinxes(roles), [roles]);

  // Gate on the role too, so a stored preference can never filter a player's view.
  const showInPlayOnly = isStoryteller && inPlayOnly;

  const jinxes = useMemo(
    () => (showInPlayOnly ? filterJinxesInPlay(allJinxes, inPlayIds ?? new Set()) : allJinxes),
    [allJinxes, showInPlayOnly, inPlayIds]
  );

  const renderIcon = (role: Role) => (
    <span className="w-6 h-6 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
      <img src={`/icons/${role.id}.svg`} alt="" className="w-[92%] h-[92%] object-contain"
        onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')} />
    </span>
  );

  const renderJinx = ({ roles: [first, second], reason }: ScriptJinx) => (
    <li
      key={`${first.id}-${second.id}`}
      className={cn(
        "px-3 py-2.5 rounded-lg border",
        isLightModeActive ? "bg-white/80 border-gray-200/60" : "bg-gray-955/65 border-gray-850/45"
      )}
    >
      <div className="flex items-center gap-1.5">
        {renderIcon(first)}
        <span className={cn("text-xs font-bold", isLightModeActive ? "text-gray-900" : "text-gray-100")}>{first.name}</span>
        <Link2 size={12} className="text-gray-500 shrink-0" />
        {renderIcon(second)}
        <span className={cn("text-xs font-bold", isLightModeActive ? "text-gray-900" : "text-gray-100")}>{second.name}</span>
      </div>
      <p className={cn("mt-1.5 text-[11px] leading-relaxed select-text", isLightModeActive ? "text-gray-600" : "text-gray-400")}>{reason}</p>
    </li>
  );

  return (
    <div
      id="script-jinxes-backdrop"
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="script-jinxes-modal"
        className={cn(
          "w-full max-w-2xl rounded-lg p-5 flex flex-col shadow-2xl max-h-[92vh] sm:max-h-[85vh]",
          isLightModeActive ? "bg-[#fdfaf2] border border-amber-900/10 text-gray-800" : "bg-gray-900 border border-gray-800 text-gray-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className={cn("font-display font-bold text-xl leading-tight tracking-wider", isLightModeActive ? "text-clocktower-blood" : "text-white")}>
              Jinxes
            </h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">
              {jinxes.length} on this script
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn("p-1.5 rounded-full transition-colors", isLightModeActive ? "text-gray-500 hover:bg-gray-250/50 hover:text-gray-800" : "text-gray-400 hover:bg-gray-800 hover:text-white")}
            aria-label="Close jinxes"
          >
            <X size={18} />
          </button>
        </div>

        {isStoryteller && (
          <label className="flex items-center justify-between gap-3 mb-3 px-3 py-2 rounded-lg border border-transparent select-none cursor-pointer hover:bg-gray-500/10">
            <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
              In Play Only
            </span>
            <ToggleSwitch
              id="jinxes-in-play-only-checkbox"
              checked={inPlayOnly}
              onChange={handleToggleInPlayOnly}
              isLightModeActive={isLightModeActive}
            />
          </label>
        )}

        <div className="overflow-y-auto overscroll-contain flex-1 pr-1">
          {jinxes.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500 italic">
              {showInPlayOnly ? 'No jinxes between the characters in play.' : 'No jinxes on this script.'}
            </p>
          ) : (
            <ul className="space-y-2">{jinxes.map(renderJinx)}</ul>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold text-white bg-clocktower-blood shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          Back to Script
        </button>
      </div>
    </div>
  );
}
