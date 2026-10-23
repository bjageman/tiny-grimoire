import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the selected message and icon stable across rerenders', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const { rerender } = render(<LoadingScreen isLight={false} />);

    expect(screen.getByText('Summoning...')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Summoning...' })).toHaveAttribute('src', '/icons/summoner.svg');

    random.mockReturnValue(0.99);
    rerender(<LoadingScreen isLight />);
    expect(screen.getByText('Summoning...')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Summoning...' })).toHaveAttribute('src', '/icons/summoner.svg');
  });
});
