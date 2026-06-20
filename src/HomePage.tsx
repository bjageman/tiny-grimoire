import { useEffect } from 'react';
import { BookOpen, Sun, Moon } from 'lucide-react';
import { WhaleIcon } from './components/WhaleIcon';
import { cn } from './utils/cn';

interface HomeProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function HomePage({ theme, toggleTheme }: HomeProps) {
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    return () => {
      document.documentElement.classList.remove('theme-light');
    };
  }, [theme]);

  const isLightModeActive = theme === 'light';

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 font-sans relative transition-colors duration-300",
      isLightModeActive
        ? "bg-clocktower-parchment text-clocktower-night"
        : "bg-clocktower-night text-clocktower-parchment"
    )}>
      {/* Theme Switcher Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2.5 rounded-full border transition-all flex items-center justify-center shadow-md shadow-black/20",
            isLightModeActive
              ? "bg-white/80 border-clocktower-blood/20 text-clocktower-night hover:bg-white hover:text-clocktower-blood hover:border-clocktower-blood/40"
              : "bg-gray-900/60 border-gray-800 text-clocktower-parchment hover:bg-gray-800/80 hover:text-white"
          )}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="max-w-md w-full space-y-8 text-center">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-clocktower-blood tracking-wide">BotC Grimoire</h1>
          <p className="text-gray-500 text-sm">Blood on the Clocktower — Storyteller & Setup Companion</p>
        </div>

        {/* Mode Cards */}
        <div className="space-y-4">
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
                  "text-lg font-bold transition-colors",
                  isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-townsfolk" : "text-gray-200 group-hover:text-white"
                )}>
                  Standard Grimoire
                </h2>
                <p className={cn("text-sm mt-1 leading-relaxed", isLightModeActive ? "text-gray-600" : "text-gray-500")}>
                  Classic storyteller mode. Manually assign every role, track the grimoire, and manage the game.
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
                  "text-lg font-bold transition-colors",
                  isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-blood" : "text-gray-200 group-hover:text-white"
                )}>
                  Whale Bucket Grimoire
                </h2>
                <p className={cn("text-sm mt-1 leading-relaxed", isLightModeActive ? "text-gray-600" : "text-gray-500")}>
                  Players submit role preferences, then the grimoire is randomly assembled.
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

        <p className={cn("text-xs transition-colors", isLightModeActive ? "text-gray-500" : "text-gray-600")}>
          Not affiliated with The Pandemonium Institute.
        </p>
      </div>
    </div>
  );
}
