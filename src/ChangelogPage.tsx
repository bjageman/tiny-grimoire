import { ExternalLink } from 'lucide-react';
import PageLayout from './components/shared/ui/PageLayout';
import { cn } from './utils/cn';

interface ChangelogPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

interface Change {
  description: string;
  pullRequests?: number[];
}

interface ChangelogEntry {
  date: string;
  dateTime: string;
  changes: Change[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    date: 'Week of October 12, 2026',
    dateTime: '2026-10-12',
    changes: [
      {
        description: 'Added transfers between Standard Storyteller games and Player Notes.',
        pullRequests: [400],
      },
      {
        description: "Preserved valid Lunatic, Marionette, and Lil' Monsta tags when characters change, and unified Marionette eligibility checks.",
        pullRequests: [401, 402],
      },
      {
        description: 'Added Pope, Sentinel, and other setup modifier controls, which now clear when the game is reset.',
        pullRequests: [405, 409],
      },
      {
        description: 'Renamed Whale Buffet to Whale Bucket Draft and improved its responsive setup and assignment layouts.',
        pullRequests: [410, 412],
      },
      {
        description: "Fixed script-limited Outsider counts, excluded-character assignment, and Lil' Monsta Minion preferences in Whale Bucket.",
        pullRequests: [411, 415, 416],
      },
      {
        description: 'Setup Modifiers and Grimoire Balance Verification now remember whether they are expanded.',
        pullRequests: [413],
      },
    ],
  },
  {
    date: 'Week of September 28, 2026',
    dateTime: '2026-09-28',
    changes: [
      {
        description: 'Allowed late Travelers in Whale Bucket games up to the 20-player limit.',
        pullRequests: [387],
      },
      {
        description: 'Expanded the default Whale Bucket character exclusion list.',
        pullRequests: [392],
      },
      {
        description: 'Improved Discord recaps by distinguishing character types from player alignments.',
        pullRequests: [394],
      },
    ],
  },
  {
    date: 'Week of August 17, 2026',
    dateTime: '2026-08-17',
    changes: [
      {
        description: 'Added a custom pronoun option to the pronoun pickers.',
        pullRequests: [376],
      },
    ],
  },
  {
    date: 'Week of August 10, 2026',
    dateTime: '2026-08-10',
    changes: [
      {
        description: 'Added a list of relevant jinxes for the active script.',
        pullRequests: [370],
      },
      {
        description: 'Added built-in script presets for Trouble Brewing, Sects & Violets, and Bad Moon Rising.',
        pullRequests: [371],
      },
    ],
  },
  {
    date: 'Week of August 3, 2026',
    dateTime: '2026-08-03',
    changes: [
      {
        description: 'Added a Storyteller reminder to prepare Savant information.',
        pullRequests: [357],
      },
      {
        description: 'Improved player-label and dead-token presentation on the grimoire.',
        pullRequests: [358, 359],
      },
    ],
  },
  {
    date: 'Week of July 27, 2026',
    dateTime: '2026-07-27',
    changes: [
      {
        description: 'Moved Reset Game, settings, theme, and grimoire display controls into the header menu.',
        pullRequests: [346, 347, 348],
      },
      {
        description: 'Unified pronoun pickers and added a persistent settings dropdown to Player Notes.',
        pullRequests: [349, 351],
      },
      {
        description: "Showed the held character's ability for the Drunk and allowed one to three Village Idiots.",
        pullRequests: [353, 354],
      },
    ],
  },
  {
    date: 'Week of July 20, 2026',
    dateTime: '2026-07-20',
    changes: [
      {
        description: 'Improved Discord recaps, in-play Traveler script sheets, and the alive-player count.',
        pullRequests: [316, 317, 318],
      },
      {
        description: 'Added a print-style script detail view and an in-play character filter.',
        pullRequests: [319, 327],
      },
      {
        description: 'Added pronoun controls, vote tokens, and custom Storyteller note prompts.',
        pullRequests: [321, 323, 332],
      },
    ],
  },
  {
    date: 'Week of July 13, 2026',
    dateTime: '2026-07-13',
    changes: [
      {
        description: 'Added character deselection to the draft and player-details modals.',
        pullRequests: [284, 285],
      },
      {
        description: 'Added Tiny Grimoire branding and richer Discord game recaps.',
        pullRequests: [290, 292],
      },
      {
        description: 'Added Sentinel and Fabled controls with a collapsible setup widget.',
        pullRequests: [302, 303],
      },
      {
        description: 'Added custom-script night orders, reminders, labels, and custom reminder icons.',
        pullRequests: [306, 307, 308],
      },
    ],
  },
  {
    date: 'Week of July 6, 2026',
    dateTime: '2026-07-06',
    changes: [
      {
        description: 'Improved token and tracker controls, custom-script teams, validation messages, duplicate-character safeguards, and automatic grimoire rotation.',
        pullRequests: [208, 212, 214, 215, 218],
      },
      {
        description: 'Added reminder tokens and read-only note sharing to Player Notes.',
        pullRequests: [219, 224],
      },
      {
        description: 'Added drag-and-drop token swaps, grimoire confirmation, and clearer loading states.',
        pullRequests: [227, 230, 249],
      },
      {
        description: 'Added setup-bag filtering and step-by-step night order controls.',
        pullRequests: [277, 278],
      },
    ],
  },
  {
    date: 'Week of June 29, 2026',
    dateTime: '2026-06-29',
    changes: [
      {
        description: 'Improved Marionette bluffing and balance calculations.',
        pullRequests: [195, 197],
      },
      {
        description: 'Added confirmation before clearing all assigned characters.',
        pullRequests: [199],
      },
      {
        description: 'Corrected Riot setup counts and warned when a displayed token reveals a hidden character state.',
        pullRequests: [201, 202],
      },
    ],
  },
  {
    date: 'Week of June 22, 2026',
    dateTime: '2026-06-22',
    changes: [
      {
        description: 'Added Bounty Hunter setup behavior, Player Notes, and peer-to-peer multiplayer game sharing.',
        pullRequests: [62, 64, 66],
      },
      {
        description: 'Added active-script details, Traveler support in script views, and reset notifications for joined players.',
        pullRequests: [71, 72, 73],
      },
      {
        description: 'Added grimoire reminder tokens and Demon Bluffs selection with a reveal overlay.',
        pullRequests: [82, 86],
      },
      {
        description: 'Added automatic game logs, winner declaration, and downloadable recaps.',
        pullRequests: [88, 89],
      },
    ],
  },
  {
    date: 'Week of June 15, 2026',
    dateTime: '2026-06-15',
    changes: [
      {
        description: 'Launched Tiny Grimoire with Whale Bucket Draft, Standard Setup, custom scripts, and responsive grimoire layouts.',
      },
      {
        description: 'Added day and night cycles, character assignment, Travelers, and drag-and-drop seating.',
        pullRequests: [12, 13, 15],
      },
      {
        description: "Added night-order guidance, character abilities, dead-vote tracking, and special setup handling for characters such as the Drunk, Marionette, Lunatic, Lil' Monsta, Kazali, Xaan, Legion, Riot, and Lord of Typhon.",
        pullRequests: [21, 25, 26, 27, 34, 53, 54, 55],
      },
    ],
  },
];

export default function ChangelogPage({ theme, toggleTheme }: ChangelogPageProps) {
  const isLight = theme === 'light';

  return (
    <PageLayout theme={theme} toggleTheme={toggleTheme} title="Changelog" backHref="#/">
      <main className="mx-auto w-full max-w-3xl pb-8">
        <p className={cn('mb-8 text-center text-sm', isLight ? 'text-gray-600' : 'text-gray-400')}>
          The latest features, improvements, and fixes in Tiny Grimoire.
        </p>

        <div className="space-y-8">
          {CHANGELOG.map((entry) => (
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
