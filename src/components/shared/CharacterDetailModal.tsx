import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X, Trash2, NotebookPen } from 'lucide-react';
import { cn } from '../../utils/cn';
import CharacterToken from './CharacterToken';
import type { Role } from '../../types';
import officialRoles from '../../official_roles.json';

const NOTE_PROMPTS = ['You Are', 'This Character Selected You', 'You Have This Ability', 'This Character Is In Play', 'This Character Is NOT In Play', 'Do You Want To Use This Ability?'] as const;

interface CharacterDetailModalProps {
  role: Role;
  isLightModeActive: boolean;
  onClose: () => void;
  /** When provided, shows a remove (Trash2) button in the top-left corner. */
  onRemove?: () => void;
  /** Storyteller-only: shows a Notes button whose prompts display a large banner above the modal. Hidden in player game notes. */
  enableStorytellerNotes?: boolean;
  backdropId?: string;
  modalId?: string;
  animate?: boolean;
}

export default function CharacterDetailModal({
  role,
  isLightModeActive,
  onClose,
  onRemove,
  enableStorytellerNotes = false,
  backdropId,
  modalId,
  animate = false,
}: CharacterDetailModalProps) {
  const abilityText = role.ability
    ?? (officialRoles as Array<{ id: string; ability?: string }>).find(r => r.id === role.id)?.ability
    ?? "Ability description not found.";
  const t = role.team;

  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLButtonElement>(null);
  const bannerTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!noteOpen) return;
    const handler = (e: MouseEvent) => {
      if (noteRef.current && !noteRef.current.contains(e.target as Node)) setNoteOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [noteOpen]);

  useLayoutEffect(() => {
    if (!selectedNote) return;
    const MAX_PX = 38;
    const fit = () => {
      const box = bannerRef.current;
      const text = bannerTextRef.current;
      if (!box || !text) return;
      const styles = getComputedStyle(box);
      const available = box.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      text.style.fontSize = `${MAX_PX}px`;
      const natural = text.scrollWidth;
      if (natural > available && available > 0) {
        text.style.fontSize = `${Math.max(MAX_PX * (available / natural), 18)}px`;
      }
    };
    fit();
    const box = bannerRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [selectedNote]);

  return (
    <div
      id={backdropId}
      className={cn("fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md", animate && "animate-fadeIn")}
      onClick={onClose}
    >
      {selectedNote && (
        <button
          ref={bannerRef}
          type="button"
          onClick={(e) => { e.stopPropagation(); setSelectedNote(null); }}
          className="absolute top-3 inset-x-3 z-[70] px-6 py-3 rounded-2xl shadow-2xl bg-amber-700 text-white font-black leading-tight tracking-wide text-center animate-scaleIn"
          aria-label="Dismiss note"
          title="Tap to dismiss"
        >
          <span ref={bannerTextRef} className="inline-block whitespace-nowrap">{selectedNote}</span>
        </button>
      )}
      <div
        id={modalId}
        className={cn(
          "w-full max-w-sm rounded-2xl p-6 text-center relative shadow-2xl",
          animate && "animate-scaleIn",
          isLightModeActive ? "bg-[#fdfaf2] border-2 border-amber-900/15 text-gray-800" : "bg-gray-900 border border-gray-800 text-gray-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-30">
          <div className="flex items-center gap-2">
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
          {enableStorytellerNotes && (
            <div className="relative" ref={noteRef}>
              <button
                type="button"
                onClick={() => setNoteOpen(o => !o)}
                aria-expanded={noteOpen}
                aria-label="Notes"
                title="Notes"
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-95 ring-2 ring-white/30",
                  noteOpen ? "bg-amber-600" : "bg-amber-500 hover:bg-amber-600"
                )}
              >
                <NotebookPen size={18} />
              </button>
              {noteOpen && (
                <div className={cn(
                  "absolute left-0 top-full mt-1.5 z-20 w-52 rounded-lg border shadow-xl p-1.5 space-y-0.5",
                  isLightModeActive ? "bg-white border-gray-300" : "bg-gray-950 border-gray-700"
                )}>
                  {NOTE_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => { setSelectedNote(prompt); setNoteOpen(false); }}
                      className={cn(
                        "block w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-gray-500/10",
                        isLightModeActive ? "text-gray-700" : "text-gray-300"
                      )}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
