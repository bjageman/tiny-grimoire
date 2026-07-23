import type { Role } from '../types';

/** onError handler that falls back to a custom role's own image URL when the local icon 404s, then hides. */
export function roleIconFallback(role: Pick<Role, 'image'> | undefined | null, isEvil = false) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const fallbackUrl = role?.image?.[isEvil ? 1 : 0] ?? role?.image?.[0];
    // Skip unhostable local file:// image paths some exports embed — hide rather than fail the request.
    const isLoadable = fallbackUrl && /^https?:\/\//i.test(fallbackUrl);
    if (isLoadable && img.src !== fallbackUrl) {
      img.onerror = () => { img.style.display = 'none'; };
      img.src = fallbackUrl;
    } else {
      img.style.display = 'none';
    }
  };
}
