import { useState } from 'react';
import { cn } from '../../utils/cn';

interface LoadingScreenProps {
  isLight: boolean;
}

const LOADING_SCREENS = [
  { icon: '/icons/summoner.svg', text: 'Summoning...', alt: 'Summoning...', isBlue: false },
  { icon: '/icons/organgrinder.svg', text: 'Grinding...', alt: 'Grinding...', isBlue: false },
  { icon: '/icons/clockmaker.svg', text: 'Ticking...', alt: 'Ticking...', isBlue: true },
  { icon: '/icons/lunatic.svg', text: 'Imagining...', alt: 'Imagining...', isBlue: true },
  { icon: '/icons/investigator.svg', text: 'Investigating...', alt: 'Investigating...', isBlue: true },
  { icon: '/icons/riot.svg', text: 'Rioting...', alt: 'Rioting...', isBlue: false },
  { icon: '/icons/gossip.svg', text: 'Gossiping...', alt: 'Gossiping...', isBlue: true },
];

export default function LoadingScreen({ isLight }: LoadingScreenProps) {
  const [config] = useState(() => {
    return LOADING_SCREENS[Math.floor(Math.random() * LOADING_SCREENS.length)];
  });

  return (
    <div
      data-testid="loading-screen"
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center space-y-4 backdrop-blur-sm transition-all duration-300",
        isLight ? "bg-white/95 text-clocktower-night" : "bg-gray-950/95 text-white"
      )}
    >
      <div className="relative">
        <div className={cn(
          "absolute inset-0 rounded-full blur-xl scale-125 animate-pulse",
          config.isBlue ? "bg-clocktower-townsfolk/15" : "bg-clocktower-demon/15"
        )} />
        <img
          src={config.icon}
          alt={config.alt}
          className="w-24 h-24 object-contain animate-spin relative z-10"
          style={{ animationDuration: '3s' }}
        />
      </div>
      <p className={cn(
        "font-display text-lg font-bold tracking-widest uppercase animate-pulse relative z-10 mt-2",
        config.isBlue ? "text-clocktower-townsfolk" : "text-clocktower-blood"
      )}>
        {config.text}
      </p>
    </div>
  );
}

