import { useState, useEffect } from 'react';
import HomePage from './HomePage';
import HostPage from './HostPage';
import WhaleBucket from './WhaleBucket';
import StandardSetup from './StandardSetup';
import PlayerTracker from './PlayerTracker';
import JoinPage from './JoinPage';

type Route = 'home' | 'host' | 'whale-bucket' | 'standard' | 'tracker' | 'join';

function getRouteFromHash(): Route {
  const hash = window.location.hash;
  const path = window.location.pathname;
  if (path === '/join' || hash === '#/join' || hash.startsWith('#/join?')) return 'join';
  if (hash === '#/host') return 'host';
  if (hash === '#/whale-bucket' || hash.startsWith('#/whale-bucket?')) return 'whale-bucket';
  if (hash === '#/standard' || hash.startsWith('#/standard?')) return 'standard';
  if (hash === '#/tracker') return 'tracker';
  return 'home';
}

export default function Router() {
  const [route, setRoute] = useState<Route>(getRouteFromHash);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  switch (route) {
    case 'host':
      return <HostPage theme={theme} toggleTheme={toggleTheme} />;
    case 'whale-bucket':
      return <WhaleBucket theme={theme} toggleTheme={toggleTheme} />;
    case 'standard':
      return <StandardSetup theme={theme} toggleTheme={toggleTheme} />;
    case 'tracker':
      return <PlayerTracker theme={theme} toggleTheme={toggleTheme} />;
    case 'join':
      return <JoinPage theme={theme} toggleTheme={toggleTheme} />;
    default:
      return <HomePage theme={theme} toggleTheme={toggleTheme} />;
  }
}
