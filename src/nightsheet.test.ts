import { describe, it, expect } from 'vitest';
import nightsheet from './nightsheet.json';

// Canonical wake order per the official Blood on the Clocktower Scripting
// Tool ("Kitchen Sink Night Order - Standard" reference sheet, last updated
// 31 Oct 2025). Keep nightsheet.json's relative order of these ids matching
// this list — if a character needs to move, update this reference
// deliberately rather than letting nightsheet.json drift silently.
const CANONICAL_FIRST_NIGHT = [
  'dusk', 'angel', 'buddhist', 'toymaker', 'stormcatcher', 'wraith', 'lordoftyphon',
  'kazali', 'apprentice', 'barista', 'bureaucrat', 'thief', 'boffin', 'philosopher',
  'alchemist', 'poppygrower', 'yaggababble', 'magician', 'minioninfo', 'snitch',
  'lunatic', 'summoner', 'demoninfo', 'king', 'sailor', 'marionette', 'engineer',
  'preacher', 'lilmonsta', 'lleech', 'xaan', 'poisoner', 'widow', 'courtier',
  'wizard', 'snakecharmer', 'godfather', 'organgrinder', 'devilsadvocate', 'eviltwin',
  'witch', 'cerenovus', 'fearmonger', 'harpy', 'mezepheles', 'pukka', 'pixie',
  'huntsman', 'damsel', 'amnesiac', 'washerwoman', 'librarian', 'investigator',
  'chef', 'empath', 'fortuneteller', 'butler', 'grandmother', 'clockmaker',
  'dreamer', 'seamstress', 'steward', 'knight', 'noble', 'balloonist', 'shugenja',
  'villageidiot', 'bountyhunter', 'nightwatchman', 'cultleader', 'spy', 'ogre',
  'highpriestess', 'general', 'chambermaid', 'mathematician', 'dawn', 'leviathan',
  'vizier',
];

const CANONICAL_OTHER_NIGHT = [
  'dusk', 'duchess', 'toymaker', 'wraith', 'barista', 'bonecollector', 'bureaucrat',
  'harlot', 'thief', 'philosopher', 'poppygrower', 'sailor', 'engineer', 'preacher',
  'xaan', 'poisoner', 'courtier', 'innkeeper', 'wizard', 'gambler', 'acrobat',
  'snakecharmer', 'monk', 'organgrinder', 'devilsadvocate', 'witch', 'cerenovus',
  'pithag', 'fearmonger', 'harpy', 'mezepheles', 'scarletwoman', 'summoner',
  'lunatic', 'exorcist', 'lycanthrope', 'legion', 'imp', 'zombuul', 'pukka',
  'shabaloth', 'po', 'fanggu', 'nodashii', 'vortox', 'lordoftyphon', 'vigormortis',
  'ojo', 'alhadikhia', 'lleech', 'lilmonsta', 'yaggababble', 'kazali', 'assassin',
  'godfather', 'gossip', 'hatter', 'barber', 'sweetheart', 'plaguedoctor', 'sage',
  'banshee', 'professor', 'choirboy', 'huntsman', 'damsel', 'amnesiac', 'farmer',
  'tinker', 'moonchild', 'grandmother', 'tor', 'ravenkeeper', 'empath',
  'fortuneteller', 'undertaker', 'dreamer', 'flowergirl', 'towncrier', 'oracle',
  'seamstress', 'juggler', 'balloonist', 'villageidiot', 'king', 'bountyhunter',
  'nightwatchman', 'cultleader', 'butler', 'spy', 'highpriestess', 'general',
  'chambermaid', 'mathematician', 'dawn', 'leviathan',
];

// Newer/experimental Carousel-edition characters the reference sheet doesn't
// cover yet. They're allowed to appear in nightsheet.json, but their
// placement isn't checked against the canonical order above.
const OTHER_NIGHT_UNCOVERED = new Set(['cacklejack', 'princess', 'cannibal', 'pixie', 'riot']);

function assertMatchesCanonicalOrder(actual: string[], canonical: string[], uncovered: Set<string> = new Set()) {
  const unexplainedExtras = actual.filter(id => !canonical.includes(id) && !uncovered.has(id));
  expect(unexplainedExtras).toEqual([]);

  const missing = canonical.filter(id => !actual.includes(id));
  expect(missing).toEqual([]);

  const actualCanonicalOnly = actual.filter(id => canonical.includes(id));
  expect(actualCanonicalOnly).toEqual(canonical);
}

describe('nightsheet.json order', () => {
  it('keeps firstNight in the canonical wake order', () => {
    assertMatchesCanonicalOrder(nightsheet.firstNight, CANONICAL_FIRST_NIGHT);
  });

  it('keeps otherNight in the canonical wake order', () => {
    assertMatchesCanonicalOrder(nightsheet.otherNight, CANONICAL_OTHER_NIGHT, OTHER_NIGHT_UNCOVERED);
  });
});
