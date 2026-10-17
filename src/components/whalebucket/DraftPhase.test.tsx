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
        onStartGame={vi.fn()}
        runAssignment={vi.fn()}
        onClearRoles={vi.fn()}
        setActiveDraftPlayerId={vi.fn()}
      />
    );

    const layout = container.querySelector('#whalebucket-assignment-layout')!;
    const sidebar = container.querySelector('#whalebucket-assignment-sidebar')!;
    const grimoireContainer = container.querySelector('#whalebucket-assignment-grimoire')!;
    const grimoire = container.querySelector('#whalebucket-draft-grimoire')!;
    const reassignButton = container.querySelector('#reassign-characters-button')!;
    const openGrimoireButton = container.querySelector('#open-grimoire-button')!;
    expect(layout.className).toContain('md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]');
    expect(sidebar.className).toContain('contents');
    expect(sidebar.className).toContain('md:block');
    expect(grimoireContainer.className).toContain('order-1');
    expect(sidebar.querySelector('#grimoire-balance-verification')?.parentElement?.className).toContain('order-2');
    expect(sidebar.querySelector('#game-setup-mods')?.parentElement?.className).toContain('order-3');
    expect(openGrimoireButton.className).toContain('order-5');
    expect(grimoire.className).toContain('md:max-w-none');
    expect(grimoire.className).toContain('md:aspect-[34/25]');
    expect(reassignButton.className).toContain('min-w-[7rem]');
    expect(reassignButton.className).toContain('sm:min-w-0');
    expect(sidebar.querySelector('#grimoire-balance-verification')).toBeInTheDocument();
    expect(sidebar.querySelector('#game-setup-mods')).toBeInTheDocument();
    expect(sidebar.querySelector('#open-grimoire-button')).toBeInTheDocument();
    expect(container.querySelectorAll('#open-grimoire-button')).toHaveLength(1);
    expect(container.querySelector('[id^="back-to-setup-button"]')).not.toBeInTheDocument();
    expect(sidebar.previousElementSibling?.querySelector('#edit-draft-player-button-1')).toBeInTheDocument();
  });
});
