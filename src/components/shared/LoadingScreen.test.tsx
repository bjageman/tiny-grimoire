import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders the Summoner loading screen when random value is < 0.5', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.25);
    render(<LoadingScreen isLight={false} />);

    expect(await screen.findByText(/Summoning/i)).toBeInTheDocument();
    expect(await screen.findByAltText(/Summoning/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/summoner.svg');

    randomSpy.mockRestore();
  });

  it('renders the Organ Grinder loading screen when random value is >= 0.5', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.75);
    render(<LoadingScreen isLight={false} />);

    expect(await screen.findByText(/Grinding/i)).toBeInTheDocument();
    expect(await screen.findByAltText(/Grinding/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/organgrinder.svg');

    randomSpy.mockRestore();
  });
});
