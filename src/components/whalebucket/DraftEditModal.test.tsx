import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import WhaleBucketDraftEditModal from './DraftEditModal';
import type { Player } from '../../WhaleBucket';

describe('WhaleBucketDraftEditModal', () => {
  const alice: Player = {
    id: 'p1',
    name: 'Alice',
    isDead: false,
    preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] },
  };

  const defaultProps = {
    activeDraftPlayerId: 'p1',
    players: [alice],
    searchTerm: '',
    setSearchTerm: vi.fn(),
    updatePlayerRole: vi.fn(),
    togglePlayerTheDrunk: vi.fn(),
    togglePlayerTheMarionette: vi.fn(),
    togglePlayerTheLunatic: vi.fn(),
    togglePlayerTheLilMonsta: vi.fn(),
    onClose: vi.fn(),
  };

  it('picking the character the player already has clears it', () => {
    const updatePlayerRole = vi.fn();
    const aliceWithRole: Player = { ...alice, roleId: 'washerwoman' };
    const { container } = render(
      <WhaleBucketDraftEditModal
        {...defaultProps}
        players={[aliceWithRole]}
        updatePlayerRole={updatePlayerRole}
        isLightModeActive={false}
      />
    );

    fireEvent.click(container.querySelector('#role-option-washerwoman')!);
    expect(updatePlayerRole).toHaveBeenCalledWith('p1', '');

    fireEvent.click(container.querySelector('#role-option-chef')!);
    expect(updatePlayerRole).toHaveBeenCalledWith('p1', 'chef');
  });

  it('never renders a solid-dark background class while in light mode', () => {
    const { container } = render(<WhaleBucketDraftEditModal {...defaultProps} isLightModeActive={true} />);
    const modal = container.querySelector('#whalebucket-draft-edit-modal')!;
    expect(modal.className).not.toContain('bg-gray-900');
    expect(modal.className).toContain('bg-[#fdfaf2]');
  });

  it('uses the dark background class when light mode is off', () => {
    const { container } = render(<WhaleBucketDraftEditModal {...defaultProps} isLightModeActive={false} />);
    const modal = container.querySelector('#whalebucket-draft-edit-modal')!;
    expect(modal.className).toContain('bg-gray-900');
  });

  it('enables character selection and special role toggles when isSecondary is true', () => {
    const aliceWithRole: Player = {
      id: 'p1',
      name: 'Alice',
      isDead: false,
      roleId: 'washerwoman',
      preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] },
    };
    const { container } = render(
      <WhaleBucketDraftEditModal
        {...defaultProps}
        players={[aliceWithRole]}
        isLightModeActive={false}
      />
    );

    // Check if the role option buttons are enabled
    const roleOptions = container.querySelectorAll('button[id^="role-option-"]');
    expect(roleOptions.length).toBeGreaterThan(0);
    roleOptions.forEach(btn => {
      expect(btn).not.toBeDisabled();
    });

    // Check if "The Drunk" toggle is enabled
    const drunkButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent?.includes('The Drunk'));
    expect(drunkButton).toBeDefined();
    expect(drunkButton).not.toBeDisabled();
  });
});
