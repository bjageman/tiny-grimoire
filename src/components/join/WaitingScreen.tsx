import { QrCode, CheckCircle2, Scroll, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface WaitingScreenProps {
  isLight: boolean;
  code: string;
  name: string;
  pronouns: string;
  onSelectPronoun: (next: string) => void;
  scriptName: string;
  gameType: 'standard' | 'whale-bucket';
  onShowQr: () => void;
  onViewScript: () => void;
  onLeave: () => void;
}

// The joined-and-waiting room: pronoun picker, script view, and leave, until the storyteller assigns a role.
export default function WaitingScreen({ isLight, code, name, pronouns, onSelectPronoun, scriptName, gameType, onShowQr, onViewScript, onLeave }: WaitingScreenProps) {
  return (
    <div
      id="waiting-screen"
      className={cn(
        "border rounded-lg p-6 text-center space-y-6 shadow-xl relative",
        isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
      )}
    >
      <button
        id="waiting-screen-qr-button"
        type="button"
        onClick={onShowQr}
        className={cn(
          "absolute top-4 right-4 p-1.5 rounded-full transition-colors",
          isLight ? "text-gray-500 hover:text-gray-900 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
        title="Show Room QR Code"
      >
        <QrCode size={36} />
      </button>
      <div className="flex flex-col items-center space-y-2">
        <CheckCircle2 size={42} className="text-emerald-500 animate-pulse" />
        <h3 className="font-display text-base font-bold tracking-wider uppercase">Joined Room {code}</h3>
        <p className="text-sm font-semibold text-gray-500">Registered as <span className="text-clocktower-blood">{name}</span></p>
      </div>

      <div className="space-y-2">
        <p className={cn("text-[10px] uppercase font-bold tracking-wider text-center", isLight ? "text-gray-400" : "text-gray-500")}>Pronouns (optional)</p>
        <div className="flex justify-center gap-1.5">
          {['He/Him', 'She/Her', 'They/Them', 'Ask Me'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onSelectPronoun(pronouns === p ? '' : p)}
              className={cn(
                "px-2 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                pronouns === p
                  ? "bg-clocktower-blood text-white border-clocktower-blood"
                  : isLight
                    ? "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                    : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button
        id="game-script-button"
        type="button"
        onClick={onViewScript}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all shadow-sm hover:opacity-90 active:scale-[0.98]",
          isLight
            ? "bg-clocktower-night text-white hover:bg-gray-800"
            : "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
        )}
      >
        <Scroll size={15} />
        <span>View Script: {scriptName}</span>
      </button>
      <div className={cn("p-4 rounded-xl border text-xs leading-relaxed", isLight ? "bg-gray-50 border-gray-200" : "bg-gray-950 border-gray-800")}>
        {gameType === 'whale-bucket' ? (
          <p>Your character preferences have been successfully sent to the Storyteller. Wait until everyone has joined and the Storyteller starts the game.</p>
        ) : (
          <p>Wait until everyone has joined and the storyteller has assigned roles. Your assigned character token will automatically reveal here when the Grimoire is opened.</p>
        )}
      </div>

      <button
        onClick={onLeave}
        className="text-gray-500 hover:text-gray-300 text-xs underline font-semibold flex items-center gap-1.5 mx-auto"
      >
        <RotateCcw size={12} />
        <span>Leave Game Room</span>
      </button>
    </div>
  );
}
