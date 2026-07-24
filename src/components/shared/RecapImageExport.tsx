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
  isLightModeActive?: boolean;
  onDone: (error?: string) => void;
}

async function waitForImages(root: HTMLElement, timeoutMs = 8000): Promise<void> {
  const settled = () =>
    Array.from(root.querySelectorAll('img')).every(
      img => img.style.display === 'none' || (img.complete && img.naturalWidth > 0)
    );

  const deadline = Date.now() + timeoutMs;
  while (!settled() && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 50));
  }
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

export default function RecapImageExport({ onDone, ...card }: RecapImageExportProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const capturedRef = useRef(false);

  const capture = useCallback(async () => {
    if (capturedRef.current || !cardRef.current) return;
    capturedRef.current = true;

    try {
      await waitForImages(cardRef.current);
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, skipFonts: true, backgroundColor: '#0b0b0e' });
      if (!blob) throw new Error('the renderer returned no image');
      saveBlob(blob, recapImageFilename(card.scriptName, card.players.length));
      onDone();
    } catch (e) {
      onDone(e instanceof Error ? e.message : 'the grimoire image could not be rendered');
    }
  }, [onDone, card.scriptName, card.players.length]);

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: -99999, pointerEvents: 'none', opacity: 0 }} aria-hidden>
      <RecapCard ref={cardRef} {...card} onLayoutReady={capture} />
    </div>,
    document.body
  );
}
