import type { Role } from '../types';

/**
 * Returns an <img> onError handler that falls back to a custom role's own
 * image URL (from an uploaded script) when the local bundled icon 404s,
 * before finally hiding the element if neither is available.
 */
export function roleIconFallback(role: Pick<Role, 'image'> | undefined | null, isEvil = false) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const fallbackUrl = role?.image?.[isEvil ? 1 : 0] ?? role?.image?.[0];
    // Some script exports embed a local file:// path from the author's own machine
    // instead of a real hosted URL — that can never load for anyone else, so skip
    // straight to hiding the icon rather than attempting (and failing) the request.
    const isLoadable = fallbackUrl && /^https?:\/\//i.test(fallbackUrl);
    if (isLoadable && img.src !== fallbackUrl) {
      img.onerror = () => { img.style.display = 'none'; };
      img.src = fallbackUrl;
    } else {
      img.style.display = 'none';
    }
  };
}
