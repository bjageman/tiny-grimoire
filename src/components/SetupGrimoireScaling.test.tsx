import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CharacterAssignmentCircle from './standard/CharacterAssignmentCircle';
import WhaleBucketPreferenceCircle from './whalebucket/PreferenceCircle';

const dragProps = {
  draggedIndex: null,
  dragOverIndex: null,
  hoverSide: null,
  handleMouseDown: vi.fn(),
  handleDragStart: vi.fn(),
  handleDragOver: vi.fn(),
  handleDragLeave: vi.fn(),
  handleDrop: vi.fn(),
  handleDragEnd: vi.fn(),
  handleTouchStart: vi.fn(),
  handleTouchMove: vi.fn(),
  handleTouchEnd: vi.fn(),
} as const;

describe('setup grimoire scaling', () => {
  it('makes the Standard setup grimoire fluid on desktop', () => {
    const { container } = render(
      <CharacterAssignmentCircle
        {...dragProps}
        players={[{ id: '1', name: 'Player 1', isDead: false }]}
        isLightModeActive={false}
        setActivePlayerId={vi.fn()}
        setSearchTerm={vi.fn()}
      />,
    );

    const board = container.querySelector('#character-assignment-board')!;
    expect(board.className).toContain('md:max-w-none');
    expect(board.className).toContain('md:aspect-[34/25]');
  });

  it('makes the Whale Bucket setup grimoire fluid on desktop', () => {
    const { container } = render(
      <WhaleBucketPreferenceCircle
        {...dragProps}
        players={[{
          id: '1',
          name: 'Player 1',
          isDead: false,
          preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] },
        }]}
        allowTravelers={false}
        isLightModeActive={false}
        setActivePreferencePlayerId={vi.fn()}
      />,
    );

    const board = container.querySelector('#whalebucket-preference-board')!;
    expect(board.className).toContain('md:max-w-none');
    expect(board.className).toContain('md:aspect-[34/25]');
  });
});
