import { UserPlus, BookOpen, Scroll } from 'lucide-react';
import { cn } from './utils/cn';
import PageLayout from './components/shared/PageLayout';

interface HomeProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function HomePage({ theme, toggleTheme }: HomeProps) {
  const isLightModeActive = theme === 'light';

  const cardBase = cn(
    "block border border-l-4 rounded-lg p-5 transition-all group cursor-pointer text-left",
    isLightModeActive
      ? "bg-white shadow-sm hover:bg-gray-50/80"
      : "bg-gray-900/60 border-gray-800 shadow-[0_2px_12px_rgba(0,0,0,0.4)] hover:bg-gray-900/80"
  );

  return (
    <PageLayout theme={theme} toggleTheme={toggleTheme} title="Tiny Grimoire">
      <div className="flex justify-center mb-6">
        <img
          src="/favicon.svg"
          alt="Tiny Grimoire Logo"
          className="w-20 h-20 md:w-24 md:h-24 object-contain filter drop-shadow-[0_0_12px_rgba(139,0,0,0.15)] transition-transform hover:scale-105 duration-300"
        />
      </div>

      <div id="home-nav" className="w-full max-w-md mx-auto space-y-3">

        <a
          id="home-join-link"
          href="#/join"
          className={cn(
            cardBase,
            isLightModeActive
              ? "border-gray-250 border-l-clocktower-blood hover:border-l-clocktower-blood"
              : "border-l-clocktower-blood hover:shadow-[0_4px_20px_rgba(139,0,0,0.12)]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-md border transition-colors",
              isLightModeActive
                ? "bg-clocktower-blood/5 border-clocktower-blood/20 group-hover:bg-clocktower-blood/10"
                : "bg-clocktower-blood/10 border-clocktower-blood/20 group-hover:bg-clocktower-blood/20"
            )}>
              <UserPlus size={18} className="text-clocktower-blood" />
            </div>
            <div>
              <h2 className={cn(
                "font-display text-base font-bold tracking-wider uppercase transition-colors",
                isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-blood" : "text-gray-200 group-hover:text-white"
              )}>
                Join Game
              </h2>
              <p className={cn("text-xs mt-0.5 leading-relaxed", isLightModeActive ? "text-gray-500" : "text-gray-500")}>
                Enter a room with a 4-letter code as a player.
              </p>
            </div>
          </div>
        </a>

        <a
          id="home-host-link"
          href="#/host"
          className={cn(
            cardBase,
            isLightModeActive
              ? "border-gray-250 border-l-clocktower-townsfolk hover:border-l-clocktower-townsfolk"
              : "border-l-clocktower-townsfolk hover:shadow-[0_4px_20px_rgba(37,99,235,0.1)]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-md border transition-colors",
              isLightModeActive
                ? "bg-clocktower-townsfolk/5 border-clocktower-townsfolk/20 group-hover:bg-clocktower-townsfolk/10"
                : "bg-clocktower-townsfolk/10 border-clocktower-townsfolk/20 group-hover:bg-clocktower-townsfolk/20"
            )}>
              <BookOpen size={18} className="text-clocktower-townsfolk" />
            </div>
            <div>
              <h2 className={cn(
                "font-display text-base font-bold tracking-wider uppercase transition-colors",
                isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-townsfolk" : "text-gray-200 group-hover:text-white"
              )}>
                Host Game
              </h2>
              <p className={cn("text-xs mt-0.5 leading-relaxed", isLightModeActive ? "text-gray-500" : "text-gray-500")}>
                Set up and run a game as the Storyteller.
              </p>
            </div>
          </div>
        </a>

        <a
          id="home-tracker-link"
          href="#/tracker"
          className={cn(
            cardBase,
            isLightModeActive
              ? "border-gray-250 border-l-clocktower-traveler hover:border-l-clocktower-traveler"
              : "border-l-clocktower-traveler hover:shadow-[0_4px_20px_rgba(168,85,247,0.1)]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-md border transition-colors",
              isLightModeActive
                ? "bg-clocktower-traveler/5 border-clocktower-traveler/20 group-hover:bg-clocktower-traveler/10"
                : "bg-clocktower-traveler/10 border-clocktower-traveler/20 group-hover:bg-clocktower-traveler/20"
            )}>
              <Scroll size={18} className="text-clocktower-traveler" />
            </div>
            <div>
              <h2 className={cn(
                "font-display text-base font-bold tracking-wider uppercase transition-colors",
                isLightModeActive ? "text-clocktower-night group-hover:text-clocktower-traveler" : "text-gray-200 group-hover:text-white"
              )}>
                Take Notes
              </h2>
              <p className={cn("text-xs mt-0.5 leading-relaxed", isLightModeActive ? "text-gray-500" : "text-gray-500")}>
                Track character claims and player statuses.
              </p>
            </div>
          </div>
        </a>

      </div>

      <div className="w-full max-w-md mx-auto text-center mt-6">
        <p className={cn(
          "text-sm italic leading-relaxed",
          isLightModeActive ? "text-gray-400" : "text-clocktower-gold/60"
        )}>
          A comprehensive web app for running Blood on the Clocktower <span className="whitespace-nowrap">in-person.</span> Storytellers manage the full game through an interactive digital grimoire, while players join live sessions from their own devices by syncing with the town square in real time.
        </p>
      </div>
    </PageLayout>
  );
}
