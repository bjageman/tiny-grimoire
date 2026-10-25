import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PLAYABLE_ROLES } from '../../../utils/roleData';
import CharacterToken from './CharacterToken';

describe('CharacterToken death indicator', () => {
  for (const isLightModeActive of [false, true]) {
    it(`shows a skull only on dead unassigned tokens in ${isLightModeActive ? 'light' : 'dark'} mode`, () => {
      const props = { idPrefix: 'player', blankRing: true, isLightModeActive, iconSizePct: 80 };
      const { rerender } = render(<CharacterToken {...props} isDead />);
      const skull = screen.getByRole('img', { name: 'Dead' });
      expect(skull).toHaveClass(isLightModeActive ? 'opacity-15' : 'opacity-35');
      expect(skull.parentElement).toHaveStyle({ width: '80%', height: '80%' });

      rerender(<CharacterToken {...props} />);
      expect(screen.queryByRole('img', { name: 'Dead' })).toBeNull();

      const role = PLAYABLE_ROLES.find(role => role.id === 'imp')!;
      rerender(<CharacterToken {...props} role={role} isDead />);
      expect(screen.queryByRole('img', { name: 'Dead' })).toBeNull();
      expect(screen.getByRole('img', { name: role.name })).toHaveClass('grayscale');
    });
  }
});
