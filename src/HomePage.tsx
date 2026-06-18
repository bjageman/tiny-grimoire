import { Sparkles, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-clocktower-night text-clocktower-parchment flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-clocktower-blood tracking-wide">BotC Toolbox</h1>
          <p className="text-gray-500 text-sm">Blood on the Clocktower — Storyteller Tools</p>
        </div>

        {/* Mode Cards */}
        <div className="space-y-4">
          <a
            href="#/whale-bucket"
            className="block bg-gray-900/60 border border-gray-800 rounded-lg p-6 hover:border-clocktower-blood/60 hover:bg-gray-900/80 transition-all group cursor-pointer text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-clocktower-blood/10 border border-clocktower-blood/20 group-hover:bg-clocktower-blood/20 transition-colors">
                <Sparkles size={24} className="text-clocktower-blood" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">Whale Bucket</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Players submit role preferences, then the grimoire is randomly assembled. Perfect for casual groups who want a surprise.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-semibold bg-clocktower-blood/10 text-clocktower-blood/80 border border-clocktower-blood/20 px-2 py-0.5 rounded">Preference Draft</span>
                  <span className="text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded">Randomized</span>
                </div>
              </div>
            </div>
          </a>

          <a
            href="#/standard"
            className="block bg-gray-900/60 border border-gray-800 rounded-lg p-6 hover:border-clocktower-townsfolk/40 hover:bg-gray-900/80 transition-all group cursor-pointer text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-clocktower-townsfolk/10 border border-clocktower-townsfolk/20 group-hover:bg-clocktower-townsfolk/20 transition-colors">
                <BookOpen size={24} className="text-clocktower-townsfolk" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">Standard Setup</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Classic storyteller mode. Manually assign every role, track the grimoire, and manage the game.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-semibold bg-clocktower-townsfolk/10 text-clocktower-townsfolk/80 border border-clocktower-townsfolk/20 px-2 py-0.5 rounded">Manual Setup</span>
                  <span className="text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded">Full Control</span>
                </div>
              </div>
            </div>
          </a>
        </div>

        <p className="text-gray-700 text-xs">Not affiliated with The Pandemonium Institute.</p>
      </div>
    </div>
  );
}
