import { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toBlob } from 'html-to-image';
import type { Player, Role, PlacedReminder } from '../../types';
import { recapImageFilename } from '../../utils/discordRecap';
import RecapCard from './RecapCard';

interface RecapImageExportProps {
  players: Player[];
  rolesData: Role[];
  reminderTokens: PlacedReminder[];
  gameLog: string[];
  scriptName: string;
  dayNumber: number;
  timeOfDay: 'night' | 'day';
  /** Called once the file has been handed to the browser, or with a reason if it could not be. */
  onDone: (error?: string) => void;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Mounted only for the moment it takes to rasterize the grimoire, then unmounted by the parent —
 * keeping a second full board in the tree for the whole game would double every re-render.
 */
export default function RecapImageExport({ onDone, ...card }: RecapImageExportProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const capturedRef = useRef(false);

  const capture = useCallback(async () => {
    // The layout hook can report ready more than once (its ResizeObserver refires); only the first wins.
    if (capturedRef.current || !cardRef.current) return;
    capturedRef.current = true;

    try {
      // skipFonts keeps the exporter from fetching Google's stylesheet mid-capture; the card
      // deliberately styles itself with fonts that are already on every machine.
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, skipFonts: true, backgroundColor: '#0b0b0e' });
      if (!blob) throw new Error('the renderer returned no image');
      saveBlob(blob, recapImageFilename(card.scriptName, card.players.length));
      onDone();
    } catch (e) {
      onDone(e instanceof Error ? e.message : 'the grimoire image could not be rendered');
    }
  }, [onDone, card.scriptName, card.players.length]);

  return createPortal(
    // Kept in the layout tree — display:none would leave the board unmeasured and mis-size the seats.
    <div style={{ position: 'fixed', top: 0, left: -99999, pointerEvents: 'none', opacity: 0 }} aria-hidden>
      <RecapCard ref={cardRef} {...card} onLayoutReady={capture} />
    </div>,
    document.body
  );
}
