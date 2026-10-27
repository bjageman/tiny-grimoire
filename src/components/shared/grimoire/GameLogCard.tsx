import { Check, Download, ImageDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import Card from '../ui/Card';
import DisclosureHeader from '../ui/DisclosureHeader';
import { usePersistedDisclosure } from '../../../hooks/usePersistedDisclosure';
import { DiscordIcon } from '../tokens/DiscordIcon';

const GAME_LOG_DISCLOSURE_KEY = 'game-log-expanded';

interface GameLogCardProps {
  isLightModeActive: boolean;
  isMobile: boolean;
  gameLog?: string[];
  isSavingImage: boolean;
  onSaveImage: () => void;
  onCopyPost: () => void;
  postCopied: boolean;
  onDownloadLog: () => void;
}

// The end-of-game log with its save-image / copy-to-Discord / download-log actions.
export default function GameLogCard({ isLightModeActive, isMobile, gameLog, isSavingImage, onSaveImage, onCopyPost, postCopied, onDownloadLog }: GameLogCardProps) {
  const { isExpanded, toggleExpanded } = usePersistedDisclosure(GAME_LOG_DISCLOSURE_KEY, true);
  const logBtn = cn(
    'inline-flex items-center gap-1.5 rounded text-white hover:opacity-90 transition-opacity text-xs font-bold disabled:opacity-50 disabled:cursor-wait',
    isMobile ? 'p-1.5' : 'px-2 py-0.5'
  );
  const iconSize = isMobile ? 14 : 12;

  return (
    <Card
      id="game-log-card"
      isLightModeActive={isLightModeActive}
    >
      <div className="flex items-center justify-between">
        <h4>
          <DisclosureHeader
            label="Game Log"
            isExpanded={isExpanded}
            onToggle={toggleExpanded}
            controlsId="game-log-entries"
            isLightModeActive={isLightModeActive}
            className="w-auto"
            chevronAtEnd={false}
          />
        </h4>
        {gameLog && gameLog.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSaveImage}
              disabled={isSavingImage}
              title="Save an image of the final grimoire"
              aria-label="Save an image of the final grimoire"
              className={cn(logBtn, 'bg-clocktower-gold text-clocktower-night')}
            >
              <ImageDown size={iconSize} />
              {!isMobile && (isSavingImage ? 'Saving…' : 'Image')}
            </button>
            <button
              type="button"
              onClick={onCopyPost}
              title="Copy the grimoire and log as a Discord post"
              aria-label="Copy the grimoire and log as a Discord post"
              className={cn(logBtn, 'bg-[#5865F2]')}
            >
              {postCopied ? <Check size={iconSize} /> : <DiscordIcon size={iconSize} />}
              {!isMobile && (postCopied ? 'Copied' : 'Copy Logs')}
            </button>
            <button
              type="button"
              onClick={onDownloadLog}
              title="Download the game log as a text file"
              aria-label="Download the game log as a text file"
              className={cn(logBtn, 'bg-clocktower-blood')}
            >
              <Download size={iconSize} />
              {!isMobile && 'Logs'}
            </button>
          </div>
        )}
      </div>
      {isExpanded && <div id="game-log-entries" className={cn(
        'max-h-48 overflow-y-auto space-y-1 text-[10px] font-mono',
        isLightModeActive ? 'text-gray-700' : 'text-gray-400'
      )}>
        {gameLog && gameLog.length > 0
          ? gameLog.map((entry, i) => (
              <p key={i} className="leading-relaxed whitespace-pre-wrap">{entry}</p>
            ))
          : <p className={cn('italic', isLightModeActive ? 'text-gray-400' : 'text-gray-600')}>No entries yet.</p>
        }
      </div>}
    </Card>
  );
}
