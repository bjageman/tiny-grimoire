import { Scroll } from 'lucide-react';
import { cn } from './utils/cn';
import PageLayout from './components/PageLayout';

interface HomeProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function HomePage({ theme, toggleTheme }: HomeProps) {
  const isLightModeActive = theme === 'light';

  return (
    <PageLayout theme={theme} toggleTheme={toggleTheme} title="BOTC Grimoire">
      <div id="home-nav" className="w-full max-w-md mx-auto space-y-4">

        <a
          id="home-join-link"
          href="#/join"
          className={cn(
            "block border rounded-lg p-6 transition-all group cursor-pointer text-center",
            isLightModeActive
              ? "bg-white border-gray-250 text-clocktower-night shadow-sm hover:border-clocktower-blood/60 hover:bg-gray-50/80"
              : "bg-gray-900/60 border-gray-800 text-gray-200 hover:border-clocktower-blood/60 hover:bg-gray-900/80"
          )}
        >
          <h2 className={cn(
            "text-lg font-bold transition-colors",
            isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-blood" : "text-gray-200 group-hover:text-white"
          )}>
            Join Game
          </h2>
        </a>

        <a
          id="home-host-link"
          href="#/host"
          className={cn(
            "block border rounded-lg p-6 transition-all group cursor-pointer text-center",
            isLightModeActive
              ? "bg-white border-gray-250 text-clocktower-night shadow-sm hover:border-clocktower-blood/60 hover:bg-gray-50/80"
              : "bg-gray-900/60 border-gray-800 text-gray-200 hover:border-clocktower-blood/60 hover:bg-gray-900/80"
          )}
        >
          <h2 className={cn(
            "text-lg font-bold transition-colors",
            isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-blood" : "text-gray-200 group-hover:text-white"
          )}>
            Host Game
          </h2>
        </a>

        <a
          id="home-tracker-link"
          href="#/tracker"
          className={cn(
            "block border rounded-lg p-6 transition-all group cursor-pointer text-center",
            isLightModeActive
              ? "bg-white border-gray-250 text-clocktower-night shadow-sm hover:border-clocktower-traveler/60 hover:bg-gray-50/80"
              : "bg-gray-900/60 border-gray-800 text-gray-200 hover:border-clocktower-traveler/60 hover:bg-gray-900/80"
          )}
        >
          <h2 className={cn(
            "text-lg font-bold transition-colors inline-flex items-center gap-2",
            isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-traveler" : "text-gray-200 group-hover:text-white"
          )}>
            <Scroll size={18} className="text-clocktower-traveler" />
            Take Notes
          </h2>
          <p className={cn("text-sm mt-1 leading-relaxed", isLightModeActive ? "text-gray-600" : "text-gray-500")}>
            Keep track of character claims and player statuses.
          </p>
        </a>


      </div>
    </PageLayout>
  );
}
