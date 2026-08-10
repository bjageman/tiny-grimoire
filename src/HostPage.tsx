import { BookOpen } from 'lucide-react';
import { WhaleIcon } from './components/shared/tokens/WhaleIcon';
import { cn } from './utils/cn';
import PageLayout from './components/shared/ui/PageLayout';

interface HostPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function HostPage({ theme, toggleTheme }: HostPageProps) {
  const isLightModeActive = theme === 'light';

  return (
    <PageLayout theme={theme} toggleTheme={toggleTheme} title="Host Game" backHref="#/">
      <div className="w-full max-w-md mx-auto space-y-4">
        <a
          href="#/standard"
          className={cn(
            "block border rounded-lg p-6 transition-all group cursor-pointer text-left",
            isLightModeActive
              ? "bg-white border-gray-250 text-clocktower-night shadow-sm hover:border-clocktower-townsfolk/40 hover:bg-gray-50/80"
              : "bg-gray-900/60 border-gray-800 text-gray-200 hover:border-clocktower-townsfolk/40 hover:bg-gray-900/80"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-clocktower-townsfolk/10 border border-clocktower-townsfolk/20 group-hover:bg-clocktower-townsfolk/20 transition-colors">
              <BookOpen size={24} className="text-clocktower-townsfolk" />
            </div>
            <div className="flex-1">
              <h2 className={cn(
                "font-display text-base font-bold tracking-wider uppercase transition-colors",
                isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-townsfolk" : "text-gray-200 group-hover:text-white"
              )}>
                Standard
              </h2>
              <p className={cn("text-sm mt-1 leading-relaxed", isLightModeActive ? "text-gray-600" : "text-gray-500")}>
                Manually assign every role, track the grimoire, and manage the game.
              </p>
              <div className="flex gap-2 mt-3">
                <span className="text-[10px] font-semibold bg-clocktower-townsfolk/10 text-clocktower-townsfolk/80 border border-clocktower-townsfolk/20 px-2 py-0.5 rounded">Manual Setup</span>
                <span className={cn(
                  "text-[10px] font-semibold border px-2 py-0.5 rounded",
                  isLightModeActive ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-gray-800 text-gray-400 border-gray-700"
                )}>
                  Full Control
                </span>
              </div>
            </div>
          </div>
        </a>

        <a
          href="#/whale-bucket"
          className={cn(
            "block border rounded-lg p-6 transition-all group cursor-pointer text-left",
            isLightModeActive
              ? "bg-white border-gray-250 text-clocktower-night shadow-sm hover:border-clocktower-blood/60 hover:bg-gray-50/80"
              : "bg-gray-900/60 border-gray-800 text-gray-200 hover:border-clocktower-blood/60 hover:bg-gray-900/80"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-clocktower-blood/10 border border-clocktower-blood/20 group-hover:bg-clocktower-blood/20 transition-colors">
              <WhaleIcon size={24} className="text-clocktower-blood" />
            </div>
            <div className="flex-1">
              <h2 className={cn(
                "font-display text-base font-bold tracking-wider uppercase transition-colors",
                isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-blood" : "text-gray-200 group-hover:text-white"
              )}>
                Whale Buffet
              </h2>
              <p className={cn("text-sm mt-1 leading-relaxed", isLightModeActive ? "text-gray-600" : "text-gray-500")}>
                Players submit preferences by character type, then the grim is randomly assembled.
              </p>
              <div className="flex gap-2 mt-3">
                <span className="text-[10px] font-semibold bg-clocktower-blood/10 text-clocktower-blood/80 border border-clocktower-blood/20 px-2 py-0.5 rounded">Preference Draft</span>
                <span className={cn(
                  "text-[10px] font-semibold border px-2 py-0.5 rounded",
                  isLightModeActive ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-gray-800 text-gray-400 border-gray-700"
                )}>
                  Randomized
                </span>
              </div>
            </div>
          </div>
        </a>
      </div>
    </PageLayout>
  );
}
