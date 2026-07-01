import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
