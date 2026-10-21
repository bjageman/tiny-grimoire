import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameLogCard from './GameLogCard';

describe('GameLogCard', () => {
  it('is open by default, keeps its actions visible when closed, and remembers its state', () => {
    localStorage.removeItem('game-log-expanded');
    const props = {
      isLightModeActive: false,
      isMobile: false,
      gameLog: ['[Night 1] The game began.'],
      isSavingImage: false,
      onSaveImage: vi.fn(),
      onCopyPost: vi.fn(),
      postCopied: false,
      onDownloadLog: vi.fn(),
    };
    const { unmount } = render(<GameLogCard {...props} />);
    const toggle = screen.getByRole('button', { name: 'Game Log' });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('[Night 1] The game began.')).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('[Night 1] The game began.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Save an image of the final grimoire' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy the grimoire and log as a Discord post' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download the game log as a text file' })).toBeInTheDocument();
    unmount();

    render(<GameLogCard {...props} />);
    expect(screen.getByRole('button', { name: 'Game Log' })).toHaveAttribute('aria-expanded', 'false');
    localStorage.removeItem('game-log-expanded');
  });
});
