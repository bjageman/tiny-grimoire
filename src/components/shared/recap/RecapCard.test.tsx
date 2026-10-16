import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Player, Role } from '../../../types';
import RecapCard from './RecapCard';

describe('RecapCard', () => {
  const players: Player[] = [
    { id: 'player-1', name: 'Alice', roleId: 'washerwoman', isDead: false },
  ];
  const roles: Role[] = [
    { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  ];

  it('renders reminder text on reminder tokens in the exported card', () => {
    render(
      <RecapCard
        players={players}
        rolesData={roles}
        reminderTokens={[
          { id: 'reminder-1', sourceCharId: 'washerwoman', text: 'Townsfolk', targetPlayerId: 'player-1' },
        ]}
        gameLog={[]}
        scriptName="Trouble Brewing"
        dayNumber={1}
        timeOfDay="night"
      />,
    );

    const label = screen.getByText('Townsfo');
    expect(label.tagName.toLowerCase()).toBe('textpath');
    expect(label).toHaveAttribute('href', '#recap-reminder-arc-reminder-1');
  });
});
