import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface LoadingScreenProps {
  isLight: boolean;
}

export default function LoadingScreen({ isLight }: LoadingScreenProps) {
  const [config, setConfig] = useState({
    icon: '/icons/summoner.svg',
    text: 'Summoning...',
    alt: 'Summoning...',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const list = [
        { icon: '/icons/summoner.svg', text: 'Summoning...', alt: 'Summoning...' },
        { icon: '/icons/organgrinder.svg', text: 'Grinding...', alt: 'Grinding...' },
        { icon: '/icons/clockmaker.svg', text: 'Ticking...', alt: 'Ticking...' },
        { icon: '/icons/lunatic.svg', text: 'Imagining...', alt: 'Imagining...' },
        { icon: '/icons/investigator.svg', text: 'Investigating...', alt: 'Investigating...' },
        { icon: '/icons/riot.svg', text: 'Rioting...', alt: 'Rioting...' },
        { icon: '/icons/gossip.svg', text: 'Gossiping...', alt: 'Gossiping...' },
      ];
      const chosen = list[Math.floor(Math.random() * list.length)];
      setConfig(chosen);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col items-center justify-center space-y-4 backdrop-blur-sm transition-all duration-300",
      isLight ? "bg-white/95 text-clocktower-night" : "bg-gray-950/95 text-white"
    )}>
      <div className="relative">
        <div className="absolute inset-0 bg-clocktower-demon/15 rounded-full blur-xl scale-125 animate-pulse" />
        <img
          src={config.icon}
          alt={config.alt}
          className="w-24 h-24 object-contain animate-spin relative z-10"
          style={{ animationDuration: '3s' }}
        />
      </div>
      <p className="font-display text-lg font-bold tracking-widest uppercase animate-pulse relative z-10 mt-2 text-clocktower-blood">
        {config.text}
      </p>
    </div>
  );
}
