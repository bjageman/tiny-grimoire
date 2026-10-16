import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ValidationSummary } from '../../utils/validationSummary';
import WhaleBucketDraftPhase from './DraftPhase';

const validationSummary: ValidationSummary = {
  base: { townsfolk: 3, outsider: 0, minion: 1, demon: 1, traveler: 0 },
  counts: { townsfolk: 3, outsider: 0, minion: 1, demon: 1, traveler: 0 },
  expected: { townsfolk: 3, outsider: 0, minion: 1, demon: 1, traveler: 0 },
  hasGodfather: false,
  modifications: [],
  isDemonValid: true,
  isMinionValid: true,
  isOutsiderValid: true,
  isTownsfolkValid: true,
  jinxWarnings: [],
  warnings: [],
  failures: [],
  isValid: true,
  expectedOutsiderLabel: '0',
  expectedTownsfolkLabel: '3',
};

describe('WhaleBucketDraftPhase', () => {
  it('places the balance and setup widgets in a desktop sidebar beside the grimoire', () => {
    const { container } = render(
      <WhaleBucketDraftPhase
        players={[{
          id: '1',
          name: 'Player 1',
          roleId: 'chef',
          isDead: false,
          preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] },
        }]}
        validationSummary={validationSummary}
        sentinelOutsiderDelta={0}
        setSentinelOutsiderDelta={vi.fn()}
        popeEnabled={false}
        setPopeEnabled={vi.fn()}
        isLightModeActive={false}
        setPhase={vi.fn()}
        onStartGame={vi.fn()}
        runAssignment={vi.fn()}
        setActiveDraftPlayerId={vi.fn()}
      />
    );

    const layout = container.querySelector('#whalebucket-assignment-layout')!;
    const sidebar = container.querySelector('#whalebucket-assignment-sidebar')!;
    expect(layout.className).toContain('md:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]');
    expect(sidebar.querySelector('#grimoire-balance-verification')).toBeInTheDocument();
    expect(sidebar.querySelector('#game-setup-mods')).toBeInTheDocument();
    expect(sidebar.previousElementSibling?.querySelector('#edit-draft-player-button-1')).toBeInTheDocument();
  });
});
