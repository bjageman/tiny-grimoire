import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StandardSetup from './StandardSetup';

const { performStandardAssignmentMock } = vi.hoisted(() => ({
  performStandardAssignmentMock: vi.fn(),
}));

vi.mock('./utils/standardAssignment', () => ({
  performStandardAssignment: performStandardAssignmentMock,
}));

vi.mock('./hooks/useGameSocket', () => ({
  useGameSocket: () => ({ isConnected: false, sendMessage: vi.fn() }),
}));

describe('StandardSetup assignment failures', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    performStandardAssignmentMock.mockReset();
  });

  it('keeps the current players and shows an alert when selected roles cannot be assigned', () => {
    const players = Array.from({ length: 5 }, (_, index) => ({
      id: `player-${index}`,
      name: `Player ${index + 1}`,
      isDead: false,
    }));
    localStorage.setItem('standard-botc-game', JSON.stringify({
      players,
      phase: 'setup',
      selectedCharacterIds: ['washerwoman'],
    }));
    performStandardAssignmentMock.mockReturnValue(null);

    const { container } = render(<StandardSetup theme="dark" toggleTheme={vi.fn()} />);
    fireEvent.click(container.querySelector('#random-assign-button')!);

    expect(performStandardAssignmentMock).toHaveBeenCalledOnce();
    expect(screen.getByText('The selected characters could not be assigned. Try changing the characters in the bag.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('standard-botc-game')!).players).toEqual(players);
  });
});
