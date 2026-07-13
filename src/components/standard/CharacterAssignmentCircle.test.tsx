import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CharacterAssignmentCircle from './CharacterAssignmentCircle';
import type { Player } from '../../types';

describe('CharacterAssignmentCircle', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice', isDead: false },
    { id: 'p2', name: 'Bob', isDead: false },
  ];

  const defaultProps = {
    players,
    isLightModeActive: false,
    setActivePlayerId: vi.fn(),
    setSearchTerm: vi.fn(),
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
  };

  it('does not show a sync icon for any player when remotePlayerIds is not provided', () => {
    render(<CharacterAssignmentCircle {...defaultProps} />);
    expect(document.querySelector('#edit-player-button-p1 svg.lucide-wifi')).toBeNull();
    expect(document.querySelector('#edit-player-button-p2 svg.lucide-wifi')).toBeNull();
  });

  it('shows a sync icon only next to players who joined remotely', () => {
    render(<CharacterAssignmentCircle {...defaultProps} remotePlayerIds={new Set(['p2'])} />);

    expect(document.querySelector('#edit-player-button-p1 svg.lucide-wifi')).toBeNull();
    expect(document.querySelector('#edit-player-button-p2 svg.lucide-wifi')).not.toBeNull();
  });

  it('still renders the player name alongside the sync icon', () => {
    render(<CharacterAssignmentCircle {...defaultProps} remotePlayerIds={new Set(['p2'])} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('enables dragging when isSecondary is true', () => {
    const { container } = render(
      <CharacterAssignmentCircle
        {...defaultProps}
      />
    );

    // Draggable attribute should be true
    const playerTokenDiv = container.querySelector('[data-drag-index="0"]');
    expect(playerTokenDiv).toHaveAttribute('draggable', 'true');
  });

  describe('rotation', () => {
    const four: Player[] = [
      { id: 'p1', name: 'Alice', isDead: false },
      { id: 'p2', name: 'Bob', isDead: false },
      { id: 'p3', name: 'Charlie', isDead: false },
      { id: 'p4', name: 'Dave', isDead: false },
    ];

    const seatPositionOf = (container: HTMLElement, id: string) => {
      const el = container.querySelector(`#edit-player-button-${id}`)!.closest('[data-drag-index]') as HTMLElement;
      return `${el.style.left}|${el.style.top}`;
    };

    const dragIndices = (container: HTMLElement) =>
      [...container.querySelectorAll('[data-drag-index]')].map(el => el.getAttribute('data-drag-index'));

    it('rotates which seat each player is drawn in, matching the grimoire board', () => {
      const unrotated = render(<CharacterAssignmentCircle {...defaultProps} players={four} />);
      const seats = four.map(p => seatPositionOf(unrotated.container, p.id));
      cleanup();

      const rotated = render(
        <CharacterAssignmentCircle {...defaultProps} players={four} rotationOffset={1} />
      );

      // Offset 1 moves Bob into Alice's seat, and wraps Alice round to the last one
      expect(seatPositionOf(rotated.container, 'p2')).toBe(seats[0]);
      expect(seatPositionOf(rotated.container, 'p3')).toBe(seats[1]);
      expect(seatPositionOf(rotated.container, 'p4')).toBe(seats[2]);
      expect(seatPositionOf(rotated.container, 'p1')).toBe(seats[3]);
    });

    it('rotates the other way for a negative offset', () => {
      const unrotated = render(<CharacterAssignmentCircle {...defaultProps} players={four} />);
      const seats = four.map(p => seatPositionOf(unrotated.container, p.id));
      cleanup();

      const rotated = render(
        <CharacterAssignmentCircle {...defaultProps} players={four} rotationOffset={-1} />
      );

      expect(seatPositionOf(rotated.container, 'p4')).toBe(seats[0]);
      expect(seatPositionOf(rotated.container, 'p1')).toBe(seats[1]);
    });

    it('keeps players in player order in the DOM, so rotating animates rather than jumps', () => {
      const { container } = render(
        <CharacterAssignmentCircle {...defaultProps} players={four} rotationOffset={2} />
      );
      expect(dragIndices(container)).toEqual(['0', '1', '2', '3']);
      const tokens = [...container.querySelectorAll('[data-drag-index]')];
      tokens.forEach(el => {
        expect((el as HTMLElement).style.transition).toContain('left');
      });
    });

    it('rotates in both directions from the buttons', () => {
      const onRotationChange = vi.fn();
      const { container } = render(
        <CharacterAssignmentCircle
          {...defaultProps}
          players={four}
          rotationOffset={2}
          onRotationChange={onRotationChange}
        />
      );

      fireEvent.click(container.querySelector('#setup-rotate-ccw-button')!);
      expect(onRotationChange).toHaveBeenCalledWith(3);

      fireEvent.click(container.querySelector('#setup-rotate-cw-button')!);
      expect(onRotationChange).toHaveBeenCalledWith(1);
    });

    it('hides the rotate buttons when rotation is not wired up', () => {
      const { container } = render(<CharacterAssignmentCircle {...defaultProps} players={four} />);
      expect(container.querySelector('#setup-rotate-ccw-button')).toBeNull();
    });
  });
});
