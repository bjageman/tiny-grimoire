import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Player } from '../../WhaleBucket';
import WhaleBucketPreferenceCircle from './PreferenceCircle';

afterEach(cleanup);

const empty = { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] };
const complete = { townsfolk: ['chef'], outsider: ['drunk'], minion: ['poisoner'], demon: ['imp'], traveler: [] };
const props = {
  allowTravelers: false,
  isLightModeActive: false,
  setActivePreferencePlayerId: vi.fn(),
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

function player(preferences: Player['preferences'] = empty): Player {
  return { id: 'alice', name: 'Alice', isDead: false, preferences };
}

describe('Whalebucket preference completion', () => {
  it.each([false, true])('updates from no selections to partial to complete in light mode %s', isLightModeActive => {
    const { rerender } = render(<WhaleBucketPreferenceCircle {...props} isLightModeActive={isLightModeActive} players={[player()]} />);
    expect(screen.getByRole('img', { name: 'No preferences selected' })).toHaveTextContent('?');
    expect(screen.getByText('0/4 PREFS')).toBeInTheDocument();

    rerender(<WhaleBucketPreferenceCircle {...props} isLightModeActive={isLightModeActive} players={[player({ ...empty, townsfolk: ['chef'], demon: ['imp'] })]} />);
    const partial = screen.getByRole('img', { name: 'Preferences incomplete' });
    expect(partial).toHaveClass('text-amber-600');
    expect(screen.getByText('2/4 PREFS')).toHaveClass('bg-amber-600');
    expect(screen.queryByRole('img', { name: 'No preferences selected' })).toBeNull();

    rerender(<WhaleBucketPreferenceCircle {...props} isLightModeActive={isLightModeActive} players={[player(complete)]} />);
    expect(screen.getByRole('img', { name: 'Preferences complete' })).toHaveClass('text-green-600');
    expect(screen.getByText('4/4 PREFS')).toHaveClass('bg-green-600');
    expect(screen.queryByRole('img', { name: 'Preferences incomplete' })).toBeNull();

    rerender(<WhaleBucketPreferenceCircle {...props} isLightModeActive={isLightModeActive} players={[player(empty)]} />);
    expect(screen.getByRole('img', { name: 'No preferences selected' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Preferences complete' })).toBeNull();
  });

  it('counts categories rather than multiple characters in the same category', () => {
    render(<WhaleBucketPreferenceCircle {...props} players={[player({ ...empty, townsfolk: ['chef', 'empath', 'washerwoman', 'librarian'] })]} />);
    expect(screen.getByRole('img', { name: 'Preferences incomplete' })).toBeInTheDocument();
    expect(screen.getByText('1/4 PREFS')).toBeInTheDocument();
  });

  it('keeps Traveler optional for completion and includes it in the existing count', () => {
    const { rerender } = render(<WhaleBucketPreferenceCircle {...props} allowTravelers players={[player(complete)]} />);
    expect(screen.getByRole('img', { name: 'Preferences complete' })).toBeInTheDocument();
    expect(screen.getByText('4/5 PREFS')).toHaveClass('bg-green-600');
    rerender(<WhaleBucketPreferenceCircle {...props} allowTravelers players={[player({ ...empty, traveler: ['beggar'] })]} />);
    expect(screen.getByRole('img', { name: 'Preferences incomplete' })).toBeInTheDocument();
    expect(screen.getByText('1/5 PREFS')).toBeInTheDocument();
  });

  it('still opens the correct player when the status icon is clicked', () => {
    const onEdit = vi.fn();
    render(<WhaleBucketPreferenceCircle {...props} players={[player(complete)]} setActivePreferencePlayerId={onEdit} />);
    fireEvent.click(screen.getByRole('img', { name: 'Preferences complete' }));
    expect(onEdit).toHaveBeenCalledWith('alice');
  });
});
