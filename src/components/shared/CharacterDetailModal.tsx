import { X, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import CharacterToken from './CharacterToken';
import type { Role } from '../../types';
import officialRoles from '../../official_roles.json';

interface CharacterDetailModalProps {
  role: Role;
  isLightModeActive: boolean;
  onClose: () => void;
  /** When provided, shows a remove (Trash2) button in the top-left corner. */
  onRemove?: () => void;
  backdropId?: string;
  modalId?: string;
  animate?: boolean;
}

export default function CharacterDetailModal({
  role,
  isLightModeActive,
  onClose,
  onRemove,
  backdropId,
  modalId,
  animate = false,
}: CharacterDetailModalProps) {
  const abilityText = role.ability
    ?? (officialRoles as Array<{ id: string; ability?: string }>).find(r => r.id === role.id)?.ability
    ?? "Ability description not found.";
  const t = role.team;

  return (
    <div
      id={backdropId}
      className={cn("fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md", animate && "animate-fadeIn")}
      onClick={onClose}
    >
      <div
        id={modalId}
        className={cn(
          "w-full max-w-sm rounded-2xl p-6 text-center relative shadow-2xl",
          animate && "animate-scaleIn",
          isLightModeActive ? "bg-[#fdfaf2] border-2 border-amber-900/15 text-gray-800" : "bg-gray-900 border border-gray-800 text-gray-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {onRemove && (
            <button
              id="character-details-remove-button"
              type="button"
              onClick={onRemove}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isLightModeActive
                  ? "text-red-650 hover:bg-red-50 hover:text-red-800"
                  : "text-red-400 hover:bg-red-950/40 hover:text-red-300"
              )}
              aria-label="Remove character"
              title="Remove character"
            >
              <Trash2 size={18} />
            </button>
          )}
          <span className={cn(
            "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
            t === 'townsfolk' && "bg-clocktower-townsfolk/10 text-clocktower-townsfolk border border-clocktower-townsfolk/20",
            t === 'outsider'  && "bg-clocktower-outsider/10 text-clocktower-outsider border border-clocktower-outsider/20",
            t === 'minion'    && "bg-clocktower-minion/10 text-clocktower-minion border border-clocktower-minion/20",
            t === 'demon'     && "bg-clocktower-demon/10 text-clocktower-demon border border-clocktower-demon/20",
            t === 'traveler'  && "bg-clocktower-traveler/10 text-clocktower-traveler border border-clocktower-traveler/20",
          )}>{role.team}</span>
        </div>
        <button type="button" onClick={onClose} className={cn("absolute top-4 right-4 p-1.5 rounded-full transition-colors", isLightModeActive ? "text-gray-500 hover:bg-gray-200 hover:text-gray-800" : "text-gray-400 hover:bg-gray-800 hover:text-white")} aria-label="Close details">
          <X size={18} />
        </button>
        <div className="w-44 h-44 mx-auto mt-6">
          <CharacterToken role={role} idPrefix={`detail-${role.id}`} />
        </div>
        <h4 className={cn(
          "text-2xl font-black mt-2 tracking-wide",
          t === 'townsfolk' && "text-clocktower-townsfolk",
          t === 'outsider'  && "text-clocktower-outsider",
          t === 'minion'    && "text-clocktower-minion",
          t === 'demon'     && "text-clocktower-demon",
          t === 'traveler'  && "text-clocktower-traveler",
        )}>{role.name}</h4>
        <div className={cn("mt-3 p-4 rounded-xl border leading-relaxed text-sm select-text text-center font-medium", isLightModeActive ? "bg-white border-amber-900/10 text-gray-700 shadow-sm" : "bg-gray-955/60 border-gray-800 text-gray-300")}>{abilityText}</div>
        <button type="button" onClick={onClose} className={cn(
          "w-full mt-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
          t === 'townsfolk' && "bg-clocktower-townsfolk shadow-clocktower-townsfolk/20",
          t === 'outsider'  && "bg-clocktower-outsider shadow-clocktower-outsider/20",
          t === 'minion'    && "bg-clocktower-minion shadow-clocktower-minion/20",
          t === 'demon'     && "bg-clocktower-demon shadow-clocktower-demon/20",
          t === 'traveler'  && "bg-clocktower-traveler shadow-clocktower-traveler/20",
        )}>Close Details</button>
      </div>
    </div>
  );
}
