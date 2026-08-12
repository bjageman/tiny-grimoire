import { describe, it, expect } from 'vitest';
import { scriptJinxes, filterJinxesInPlay } from './jinxUtils';
import jinxData from '../jinxes.json';
import rolesData from '../roles.json';
import type { Role } from '../types';

const all = rolesData as Role[];
const role = (id: string): Role => {
  const found = all.find(r => r.id === id);
  if (!found) throw new Error(`unknown role ${id}`);
  return found;
};

describe('jinxes.json', () => {
  it('only references characters the app knows about', () => {
    const known = new Set(all.map(r => r.id));
    const unknown = jinxData.flatMap(j => [j.a, j.b]).filter(id => !known.has(id));
    expect(unknown).toEqual([]);
  });

  it('lists each character pair at most once', () => {
    const keys = jinxData.map(j => [j.a, j.b].sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('never pairs a character with itself and always gives a reason', () => {
    expect(jinxData.filter(j => j.a === j.b)).toEqual([]);
    expect(jinxData.filter(j => !j.reason.trim())).toEqual([]);
  });
});

describe('scriptJinxes', () => {
  it('returns a jinx only when both characters are on the script', () => {
    const jinxes = scriptJinxes([role('leviathan'), role('mayor'), role('chef')]);
    expect(jinxes).toHaveLength(1);
    expect(jinxes[0].roles.map(r => r.id).sort()).toEqual(['leviathan', 'mayor']);
    expect(jinxes[0].reason).toContain('day 5');
  });

  it('omits a jinx when only one of the pair is on the script', () => {
    expect(scriptJinxes([role('leviathan'), role('chef')])).toEqual([]);
  });

  it('returns nothing for a script with no jinxed characters', () => {
    expect(scriptJinxes([role('washerwoman'), role('chef'), role('imp')])).toEqual([]);
  });

  it('orders the pair by script position', () => {
    const [jinx] = scriptJinxes([role('mayor'), role('leviathan')]);
    expect(jinx.roles.map(r => r.id)).toEqual(['mayor', 'leviathan']);
  });

  it('finds every jinx among a script carrying several jinxed characters', () => {
    const jinxes = scriptJinxes([role('leviathan'), role('mayor'), role('monk'), role('king')]);
    const pairs = jinxes.map(j => j.roles.map(r => r.id).sort().join('-')).sort();
    expect(pairs).toEqual(['king-leviathan', 'leviathan-mayor', 'leviathan-monk']);
  });
});

describe('filterJinxesInPlay', () => {
  const jinxes = scriptJinxes([role('leviathan'), role('mayor'), role('monk')]);

  it('keeps only jinxes where both characters are in play', () => {
    const kept = filterJinxesInPlay(jinxes, new Set(['leviathan', 'mayor']));
    expect(kept.map(j => j.roles.map(r => r.id).sort().join('-'))).toEqual(['leviathan-mayor']);
  });

  it('drops everything when nothing is in play', () => {
    expect(filterJinxesInPlay(jinxes, new Set())).toEqual([]);
  });
});
