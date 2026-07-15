import { describe, it, expect } from 'vitest';
import { parseScriptFile } from './scriptUtils';

function makeFile(content: unknown, filename = 'script.json') {
  return new File([JSON.stringify(content)], filename, { type: 'application/json' });
}

describe('parseScriptFile', () => {
  it('resolves known official roles unchanged with no unknownRoles', async () => {
    const file = makeFile(['washerwoman', 'imp']);
    const { roles, unknownRoles } = await parseScriptFile(file);
    expect(unknownRoles).toEqual([]);
    expect(roles.find(r => r.id === 'washerwoman')?.team).toBe('townsfolk');
    expect(roles.find(r => r.id === 'imp')?.team).toBe('demon');
  });

  it('preserves a custom character\'s declared team instead of forcing Townsfolk', async () => {
    const file = makeFile([
      'washerwoman',
      { id: 'homebrewdemon', name: 'Homebrew Demon', team: 'demon' },
    ]);
    const { roles, unknownRoles } = await parseScriptFile(file);
    const custom = roles.find(r => r.id === 'homebrewdemon');
    expect(custom).toBeDefined();
    expect(custom?.team).toBe('demon');
    expect(custom?.name).toBe('Homebrew Demon');
    expect(unknownRoles).toEqual([{ id: 'homebrewdemon', name: 'Homebrew Demon' }]);
  });

  it('normalizes "traveller" spelling to "traveler" for a custom role', async () => {
    const file = makeFile([
      'washerwoman',
      { id: 'homebrewtraveler', name: 'Homebrew Traveler', team: 'traveller' },
    ]);
    const { roles } = await parseScriptFile(file);
    expect(roles.find(r => r.id === 'homebrewtraveler')?.team).toBe('traveler');
  });

  it('falls back to Townsfolk for a custom role with a missing/invalid team', async () => {
    const file = makeFile([
      'washerwoman',
      { id: 'mysteryrole', name: 'Mystery Role' },
      { id: 'bogusteam', name: 'Bogus Team', team: 'not-a-real-team' },
    ]);
    const { roles, unknownRoles } = await parseScriptFile(file);
    expect(roles.find(r => r.id === 'mysteryrole')?.team).toBe('townsfolk');
    expect(roles.find(r => r.id === 'bogusteam')?.team).toBe('townsfolk');
    expect(unknownRoles.map(r => r.id).sort()).toEqual(['bogusteam', 'mysteryrole']);
  });

  it('falls back to a title-cased id when no name is provided for a custom role', async () => {
    const file = makeFile([
      'washerwoman',
      { id: 'my_custom_role', team: 'outsider' },
    ]);
    const { roles } = await parseScriptFile(file);
    const custom = roles.find(r => r.id === 'mycustomrole');
    expect(custom?.name).toBe('Mycustomrole');
    expect(custom?.team).toBe('outsider');
  });

  it('preserves ability text and image URLs for a custom role', async () => {
    const file = makeFile([
      'washerwoman',
      {
        id: 'hawker',
        name: 'Hawker',
        team: 'outsider',
        image: ['https://example.com/hawker-good.png', 'https://example.com/hawker-evil.png'],
        ability: 'You start knowing a false statement. If you die, it becomes true.',
        reminders: ['?', '?', '?'],
      },
    ]);
    const { roles } = await parseScriptFile(file);
    const custom = roles.find(r => r.id === 'hawker');
    expect(custom?.ability).toBe('You start knowing a false statement. If you die, it becomes true.');
    expect(custom?.image).toEqual(['https://example.com/hawker-good.png', 'https://example.com/hawker-evil.png']);
  });

  it('does not attach ability/image fields for a known official role', async () => {
    const file = makeFile(['washerwoman']);
    const { roles } = await parseScriptFile(file);
    const washerwoman = roles.find(r => r.id === 'washerwoman');
    expect(washerwoman?.ability).toBeUndefined();
    expect(washerwoman?.image).toBeUndefined();
  });

  it('accepts a bare image URL string, as Bloodstar scripts export it', async () => {
    const file = makeFile([
      'washerwoman',
      {
        id: 'sculptor_fall_of_rome',
        name: 'Sculptor',
        team: 'townsfolk',
        image: 'https://www.bloodstar.xyz/p/AlexS/Fall_of_Rome/sculptor_fall_of_rome.png',
      },
    ]);
    const { roles } = await parseScriptFile(file);
    const custom = roles.find(r => r.id === 'sculptorfallofrome');
    expect(custom?.image).toEqual(['https://www.bloodstar.xyz/p/AlexS/Fall_of_Rome/sculptor_fall_of_rome.png']);
  });

  it('omits ability/image when missing or malformed on a custom role', async () => {
    const file = makeFile([
      'washerwoman',
      { id: 'noextras', name: 'No Extras', team: 'townsfolk' },
      { id: 'blankimage', name: 'Blank Image', team: 'townsfolk', image: '   ' },
      { id: 'emptyimage', name: 'Empty Image', team: 'townsfolk', image: [] },
      { id: 'numberimage', name: 'Number Image', team: 'townsfolk', image: 42 },
    ]);
    const { roles } = await parseScriptFile(file);
    expect(roles.find(r => r.id === 'noextras')?.ability).toBeUndefined();
    expect(roles.find(r => r.id === 'noextras')?.image).toBeUndefined();
    expect(roles.find(r => r.id === 'blankimage')?.image).toBeUndefined();
    expect(roles.find(r => r.id === 'emptyimage')?.image).toBeUndefined();
    expect(roles.find(r => r.id === 'numberimage')?.image).toBeUndefined();
  });
});
