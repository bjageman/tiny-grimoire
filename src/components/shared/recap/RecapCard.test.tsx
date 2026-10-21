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

  it('includes identity and status tags in the exported card', () => {
    const taggedPlayers: Player[] = [
      { id: 'drunk', name: 'Drunk player', roleId: 'washerwoman', isDead: false, isTheDrunk: true },
      { id: 'marionette', name: 'Marionette player', roleId: 'washerwoman', isDead: false, isTheMarionette: true },
      { id: 'lunatic', name: 'Lunatic player', roleId: 'imp', isDead: false, isTheLunatic: true },
      { id: 'lil-monsta', name: "Lil' Monsta player", roleId: 'poisoner', isDead: false, isTheLilMonsta: true, isDrunkOrPoisoned: true },
      { id: 'dead-vote', name: 'Dead player', roleId: 'washerwoman', isDead: true, hasDeadVote: true },
    ];
    const taggedRoles: Role[] = [
      ...roles,
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    render(
      <RecapCard
        players={taggedPlayers}
        rolesData={taggedRoles}
        reminderTokens={[]}
        gameLog={[]}
        scriptName="Tags"
        dayNumber={1}
        timeOfDay="night"
      />,
    );

    expect(screen.getByText('DRUNK')).toBeInTheDocument();
    expect(screen.getByText('MARIONETTE')).toBeInTheDocument();
    expect(screen.getByText('LUNATIC')).toBeInTheDocument();
    expect(screen.getByText("LIL' MONSTA")).toBeInTheDocument();
    expect(screen.getByTitle('Drunk/Poisoned')).toBeInTheDocument();
    expect(screen.getByTitle('Vote Token Active')).toBeInTheDocument();
  });

  it('shows the current distribution, ending state, datetime, and updated branding', () => {
    const summaryPlayers: Player[] = [
      { id: 'townsfolk', name: 'Townsfolk', roleId: 'washerwoman', isDead: false },
      { id: 'drunk', name: 'Drunk', roleId: 'washerwoman', isDead: true, isTheDrunk: true },
      { id: 'lunatic', name: 'Lunatic', roleId: 'imp', isDead: true, isTheLunatic: true },
      { id: 'minion', name: 'Minion', roleId: 'poisoner', isDead: false },
      { id: 'traveler', name: 'Traveler', roleId: 'beggar', isDead: false },
    ];
    const summaryRoles: Role[] = [
      ...roles,
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
      { id: 'beggar', name: 'Beggar', team: 'traveler' },
    ];
    const date = new Date(2026, 9, 17, 16, 30);
    const formattedDate = date.toLocaleString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });

    render(
      <RecapCard
        players={summaryPlayers}
        rolesData={summaryRoles}
        reminderTokens={[]}
        gameLog={[]}
        scriptName="Summary"
        dayNumber={7}
        timeOfDay="day"
        date={date}
      />,
    );

    expect(screen.getByText(`5 players (1/2/1/0/1) - ended day 7 with 3 alive - ${formattedDate}`)).toBeInTheDocument();
    expect(screen.getByText('TINYGRIMOIRE.COM')).toBeInTheDocument();
    expect(screen.queryByText('Tiny Grimoire')).toBeNull();
  });
});
