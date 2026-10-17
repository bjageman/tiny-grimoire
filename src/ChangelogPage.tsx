import { ExternalLink } from 'lucide-react';
import changelog from './data/changelog.json';
import PageLayout from './components/shared/ui/PageLayout';
import { cn } from './utils/cn';

interface ChangelogPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function ChangelogPage({ theme, toggleTheme }: ChangelogPageProps) {
  const isLight = theme === 'light';

  return (
    <PageLayout theme={theme} toggleTheme={toggleTheme} title="Changelog" backHref="#/">
      <main className="mx-auto w-full max-w-3xl pb-8">
        <p className={cn('mb-8 text-center text-sm', isLight ? 'text-gray-600' : 'text-gray-400')}>
          The latest features, improvements, and fixes in Tiny Grimoire.
        </p>

        <div className="space-y-8">
          {changelog.map((entry) => (
            <section key={entry.dateTime} aria-labelledby={`changes-${entry.dateTime}`}>
              <h2
                id={`changes-${entry.dateTime}`}
                className={cn(
                  'mb-3 font-display text-lg font-bold tracking-wide',
                  isLight ? 'text-clocktower-blood' : 'text-clocktower-gold',
                )}
              >
                <time dateTime={entry.dateTime}>{entry.date}</time>
              </h2>
              <ul
                className={cn(
                  'divide-y overflow-hidden rounded-xl border',
                  isLight
                    ? 'divide-clocktower-blood/10 border-clocktower-blood/20 bg-white/35'
                    : 'divide-clocktower-gold/10 border-clocktower-gold/20 bg-white/[0.03]',
                )}
              >
                {entry.changes.map((change) => (
                  <li key={change.description} className="flex flex-wrap items-start gap-3 px-4 py-3.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-2 h-1.5 w-1.5 shrink-0 rotate-45',
                        isLight ? 'bg-clocktower-blood/60' : 'bg-clocktower-gold/70',
                      )}
                    />
                    <span className="min-w-0 flex-1 text-sm leading-6">{change.description}</span>
                    {change.pullRequests && (
                      <span className="ml-4 flex w-full flex-wrap gap-0.5 sm:ml-0 sm:mt-0.5 sm:w-auto sm:max-w-32 sm:shrink-0 sm:justify-end">
                        {change.pullRequests.map((pullRequest) => (
                          <a
                            key={pullRequest}
                            href={`https://github.com/bjageman/tiny-grimoire/pull/${pullRequest}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View pull request ${pullRequest}`}
                            title={`Pull request #${pullRequest}`}
                            className={cn(
                              'flex items-center gap-0.5 rounded px-1 py-1 text-xs transition-colors',
                              isLight
                                ? 'text-gray-500 hover:bg-black/5 hover:text-gray-800'
                                : 'text-gray-500 hover:bg-white/10 hover:text-gray-200',
                            )}
                          >
                            #{pullRequest}
                            <ExternalLink size={10} />
                          </a>
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </PageLayout>
  );
}
