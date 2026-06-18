import { useState, useEffect } from 'react';
import HomePage from './HomePage';
import WhaleBucket from './WhaleBucket';
import StandardSetup from './StandardSetup';

type Route = 'home' | 'whale-bucket' | 'standard';

function getRouteFromHash(): Route {
  const hash = window.location.hash;
  if (hash === '#/whale-bucket') return 'whale-bucket';
  if (hash === '#/standard') return 'standard';
  return 'home';
}

export default function Router() {
  const [route, setRoute] = useState<Route>(getRouteFromHash);

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  switch (route) {
    case 'whale-bucket':
      return <WhaleBucket />;
    case 'standard':
      return <StandardSetup />;
    default:
      return <HomePage />;
  }
}
