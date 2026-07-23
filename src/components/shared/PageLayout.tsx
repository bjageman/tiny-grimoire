import { useEffect, useRef, type ReactNode } from 'react';
import { Sun, Moon, ArrowLeft, GitBranch, Coffee } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PageLayoutProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  title?: string;
  titleContent?: ReactNode;    // replaces the h1 when provided (e.g. title + room code badge)
  backHref?: string;           // renders an <a> back button
  onBack?: () => void;         // renders a <button> back button (use one or the other)
  extraControls?: ReactNode;   // rendered to the right of the theme toggle
  headerExtra?: ReactNode;     // extra row below the main header row (e.g. room code on mobile)
  contentClassName?: string;   // defaults to "flex-1 flex flex-col pt-8 px-4 pb-4"
  children: ReactNode;
}

export default function PageLayout({
  theme,
  toggleTheme,
  title,
  titleContent,
  backHref,
  onBack,
  extraControls,
  headerExtra,
  contentClassName,
  children,
}: PageLayoutProps) {
  const isLight = theme === 'light';

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    return () => {
      document.documentElement.classList.remove('theme-light');
    };
  }, [isLight]);

  // Make the browser/Android back button run onBack (in-app action) not navigate: keep a buffer history entry so back pops it and runs onBack.
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });
  const hasInAppBack = !!onBack;
  const hasInAppBackRef = useRef(hasInAppBack);
  useEffect(() => {
    hasInAppBackRef.current = hasInAppBack;
  });

  // Runs every commit to re-arm the buffer after a back-press consumes it (for chained in-app phases); the history.state check keeps it a no-op otherwise.
  useEffect(() => {
    if (!hasInAppBack) return;
    const currentState = window.history.state as { pageLayoutBackBuffer?: boolean } | null;
    if (!currentState?.pageLayoutBackBuffer) {
      window.history.pushState({ pageLayoutBackBuffer: true }, '', window.location.href);
    }
  });

  useEffect(() => {
    // Our buffer pop never changes the URL so never fires 'hashchange'; defer a microtask to ignore plain hash-assignment popstates that some WebViews/jsdom mis-fire.
    let hashChangedSincePop = false;
    const handleHashChange = () => {
      hashChangedSincePop = true;
    };
    const handlePopState = () => {
      if (!hasInAppBackRef.current) return;
      hashChangedSincePop = false;
      queueMicrotask(() => {
        if (!hashChangedSincePop && hasInAppBackRef.current) {
          onBackRef.current?.();
        }
      });
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const backButtonClass = cn(
    "absolute left-4 md:left-8 lg:left-12 p-1.5 rounded-full transition-all flex items-center justify-center",
    isLight ? "text-gray-700 hover:text-gray-900 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
  );

  return (
    <div id="page-root" className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-300 mx-auto max-w-xl md:max-w-[1600px]",
      isLight ? "bg-clocktower-parchment text-clocktower-night" : "bg-clocktower-night text-clocktower-parchment"
    )}>
      <header id="page-header" className={cn(
        "relative flex flex-col items-center justify-center pb-3 w-full pt-4",
        headerExtra && "gap-2.5",
      )}>
        <div className="relative flex justify-center items-center w-full min-h-[36px] px-4 md:px-8 lg:px-12">
          {backHref && (
            <a id="page-back-button" href={backHref} className={backButtonClass} title="Back">
              <ArrowLeft size={24} />
            </a>
          )}
          {onBack && (
            <button id="page-back-button" onClick={onBack} className={backButtonClass} title="Back">
              <ArrowLeft size={24} />
            </button>
          )}

          {titleContent ?? (
            <h1 className="font-display text-xl font-bold text-clocktower-blood tracking-widest text-center px-10 uppercase">
              {title}
            </h1>
          )}

          <div id="page-header-controls" className="absolute right-4 md:right-8 lg:right-12 flex items-center gap-1">
            <button
              id="theme-toggle-button"
              onClick={toggleTheme}
              className={cn("p-2 transition-colors", isLight ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {extraControls}
          </div>
        </div>

        {headerExtra}

        <div id="page-header-divider" className="flex items-center gap-2.5 w-full px-4 md:px-8 lg:px-12 mt-1.5">
          <div className={cn("flex-1 h-px", isLight ? "bg-clocktower-blood/20" : "bg-clocktower-gold/30")} />
          <span className={cn("text-[8px] leading-none", isLight ? "text-clocktower-blood/40" : "text-clocktower-gold/50")}>◆</span>
          <div className={cn("flex-1 h-px", isLight ? "bg-clocktower-blood/20" : "bg-clocktower-gold/30")} />
        </div>
      </header>

      <div id="page-content" className={contentClassName ?? "flex-1 flex flex-col pt-8 px-4 md:px-8 lg:px-12 pb-4"}>
        {children}
      </div>

      <footer id="page-footer" className={cn(
        "flex justify-between items-center py-4 px-4 md:px-8 lg:px-12 border-t",
        isLight ? "border-clocktower-blood/20" : "border-clocktower-gold/20"
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <a
            id="footer-ccc-badge"
            href="https://bloodontheclocktower.com/pages/community-created-content-policy"
            target="_blank"
            rel="noopener noreferrer"
            title="Community Created Content — see The Pandemonium Institute's policy"
            className="shrink-0 transition-opacity hover:opacity-80"
          >
            <img
              src={isLight ? "/community-created-content-light.png" : "/community-created-content-dark.png"}
              alt="Community Created Content"
              className="h-7 w-auto"
            />
          </a>
          <p className={cn("text-xs min-w-0", isLight ? "text-gray-400" : "text-gray-600")}>
            Unofficial fan-made tool. Not affiliated with or endorsed by The Pandemonium Institute.
          </p>
        </div>
        <div id="page-footer-links" className="flex items-center gap-1">
          <a
            id="footer-github-link"
            href="https://github.com/bjageman/tiny-grimoire"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className={cn(
              "p-1.5 rounded-full transition-all",
              isLight ? "text-gray-400 hover:text-gray-700 hover:bg-black/5" : "text-gray-600 hover:text-gray-300 hover:bg-white/10"
            )}
          >
            <GitBranch size={18} />
          </a>
          <a
            id="footer-kofi-link"
            href="https://ko-fi.com/neurobomber"
            target="_blank"
            rel="noopener noreferrer"
            title="Support on Ko-fi"
            className={cn(
              "p-1.5 rounded-full transition-all",
              isLight ? "text-gray-400 hover:text-gray-700 hover:bg-black/5" : "text-gray-600 hover:text-gray-300 hover:bg-white/10"
            )}
          >
            <Coffee size={18} />
          </a>
        </div>
      </footer>
    </div>
  );
}
