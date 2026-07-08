import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders the Summoner loading screen', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);
    render(<LoadingScreen isLight={false} />);

    const text = await screen.findByText(/Summoning/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-clocktower-blood');
    expect(await screen.findByAltText(/Summoning/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/summoner.svg');

    randomSpy.mockRestore();
  });

  it('renders the Organ Grinder loading screen', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    render(<LoadingScreen isLight={false} />);

    const text = await screen.findByText(/Grinding/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-clocktower-blood');
    expect(await screen.findByAltText(/Grinding/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/organgrinder.svg');

    randomSpy.mockRestore();
  });

  it('renders the Clockmaker loading screen', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.35);
    render(<LoadingScreen isLight={false} />);

    const text = await screen.findByText(/Ticking/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-clocktower-townsfolk');
    expect(await screen.findByAltText(/Ticking/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/clockmaker.svg');

    randomSpy.mockRestore();
  });

  it('renders the Lunatic loading screen', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<LoadingScreen isLight={false} />);

    const text = await screen.findByText(/Imagining/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-clocktower-townsfolk');
    expect(await screen.findByAltText(/Imagining/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/lunatic.svg');

    randomSpy.mockRestore();
  });

  it('renders the Investigator loading screen', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.65);
    render(<LoadingScreen isLight={false} />);

    const text = await screen.findByText(/Investigating/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-clocktower-townsfolk');
    expect(await screen.findByAltText(/Investigating/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/investigator.svg');

    randomSpy.mockRestore();
  });

  it('renders the Riot loading screen', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.8);
    render(<LoadingScreen isLight={false} />);

    const text = await screen.findByText(/Rioting/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-clocktower-blood');
    expect(await screen.findByAltText(/Rioting/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/riot.svg');

    randomSpy.mockRestore();
  });

  it('renders the Gossip loading screen', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.95);
    render(<LoadingScreen isLight={false} />);

    const text = await screen.findByText(/Gossiping/i);
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-clocktower-townsfolk');
    expect(await screen.findByAltText(/Gossiping/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('/icons/gossip.svg');

    randomSpy.mockRestore();
  });
});
