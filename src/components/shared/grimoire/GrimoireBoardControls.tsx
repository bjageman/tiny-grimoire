import { useId, useState } from 'react';
import { QrCode, RotateCcw, RotateCw } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { cn } from '../../../utils/cn';

interface Props {
  isFullscreen: boolean;
  isLightModeActive: boolean;
  canRotate: boolean;
  onRotate: (delta: number) => void;
  joinCode?: string;
}

export default function GrimoireBoardControls({ isFullscreen, isLightModeActive, canRotate, onRotate, joinCode }: Props) {
  const [showJoinCode, setShowJoinCode] = useState(false);
  const joinCodeId = useId();
  const showingJoinCode = isFullscreen && !!joinCode && showJoinCode;
  const joinUrl = joinCode ? `${window.location.origin}${window.location.pathname}#/join?code=${encodeURIComponent(joinCode)}` : '';
  useEscapeKey(() => setShowJoinCode(false), showingJoinCode);

  return (
    <>
      {isFullscreen && joinCode && (
        <button
          type="button"
          aria-label={showingJoinCode ? 'Hide join code' : 'Show join code'}
          aria-expanded={showingJoinCode}
          aria-controls={showingJoinCode ? joinCodeId : undefined}
          title={showingJoinCode ? 'Hide join code' : 'Show join code'}
          onClick={() => setShowJoinCode(show => !show)}
          className={cn(
            'absolute bottom-3 left-3 z-[400] rounded-full border p-3 shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            isLightModeActive ? 'bg-white border-gray-300 text-gray-600 hover:text-gray-900' : 'bg-gray-900 border-gray-700 text-gray-300 hover:text-white'
          )}
        >
          <QrCode size={20} />
        </button>
      )}
      {(canRotate || showingJoinCode) && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className={cn('flex flex-col items-center gap-3 pointer-events-auto', showingJoinCode && '-translate-y-[1cqh]')}>
            {showingJoinCode && (
              <div
                id={joinCodeId}
                role="region"
                aria-label="Join this game"
                className="flex flex-col items-center gap-2 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-4"
              >
                <div className="text-center">
                  <p className={cn('text-sm md:text-base [@media(max-height:500px)]:text-xs font-bold uppercase tracking-widest', isLightModeActive ? 'text-gray-600' : 'text-gray-300')}>Join Code</p>
                  <p className={cn('text-4xl md:text-5xl font-mono font-bold leading-none tracking-widest', isLightModeActive ? 'text-gray-900' : 'text-white')}>{joinCode}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg bg-white p-2">
                    <QRCode
                      value={joinUrl}
                      size={224}
                      role="img"
                      aria-label={`Join game ${joinCode}`}
                      className="w-[min(34cqw,28cqh,184px)] h-auto [@media(max-height:500px)]:w-[min(24cqw,21cqh,96px)]"
                    />
                  </div>
                  <p className={cn('max-w-[min(52cqw,28rem)] break-all text-center text-sm md:text-base [@media(max-height:500px)]:text-xs leading-tight', isLightModeActive ? 'text-gray-600' : 'text-gray-300')}>{joinUrl}</p>
                </div>
              </div>
            )}
            {canRotate && (
              <div className={cn('flex items-center', isFullscreen ? 'gap-6' : 'gap-3')}>
                {[{ delta: 1, label: 'Rotate counter-clockwise', Icon: RotateCcw }, { delta: -1, label: 'Rotate clockwise', Icon: RotateCw }].map(({ delta, label, Icon }) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => onRotate(delta)}
                    title={label}
                    className={cn(
                      'rounded-full border transition-all shadow-sm active:scale-95',
                      isFullscreen ? 'p-3 md:p-4' : 'p-2',
                      isLightModeActive ? 'bg-white/80 border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-white' : 'bg-gray-900/80 border-gray-700 text-gray-500 hover:text-gray-200 hover:bg-gray-800'
                    )}
                  >
                    <Icon size={isFullscreen ? 24 : 14} className={isFullscreen ? 'md:w-7 md:h-7' : undefined} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
