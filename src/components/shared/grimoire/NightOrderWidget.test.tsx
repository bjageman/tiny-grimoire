import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NightOrderWidget from './NightOrderWidget';
import type { Player, Role } from '../../../types';

describe('NightOrderWidget', () => {
  const mockPlayers: Player[] = [
    {
      id: 'p1',
      name: 'Alice',
      roleId: 'imp', // Lunatic thinks they are the Imp
      isTheLunatic: true,
      isDead: false,
    },
    {
      id: 'p2',
      name: 'Bob',
      roleId: 'empath', // Marionette thinks they are Empath
      isTheMarionette: true,
      isDead: false,
    },
    {
      id: 'p3',
      name: 'Charlie',
      roleId: 'washerwoman',
      isDead: false,
    }
  ];

  it('correctly displays lunatic and marionette in the first night list', () => {
    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={1}
        isLightModeActive={false}
      />
    );

    // Both Lunatic and Marionette should be in the list on Night 1
    expect(screen.getByText('Lunatic', { selector: '.font-serif' })).toBeInTheDocument();
    expect(screen.getByText('Marionette', { selector: '.font-serif' })).toBeInTheDocument();
    
    // Player names should be displayed next to their actual role items
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
  });

  it('correctly displays lunatic but not marionette in other nights list', () => {
    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={2}
        isLightModeActive={false}
      />
    );

    // Lunatic wakes up on other nights to choose targets; Marionette only acts on Night 1
    expect(screen.getByText('Lunatic', { selector: '.font-serif' })).toBeInTheDocument();
    expect(screen.queryByText('Marionette', { selector: '.font-serif' })).toBeNull();
  });

  describe('Savant', () => {
    const savantPlayers: Player[] = [
      { id: 'p1', name: 'Alice', roleId: 'savant', isDead: false },
      { id: 'p2', name: 'Bob', roleId: 'washerwoman', isDead: false },
    ];

    const orderedNames = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('span.font-serif')).map(el => el.textContent);

    it('sits immediately before Dawn on both nights when in play', () => {
      for (const tab of ['first', 'other'] as const) {
        const { container, unmount } = render(
          <NightOrderWidget
            players={savantPlayers}
            timeOfDay="night"
            dayNumber={tab === 'first' ? 1 : 2}
            isLightModeActive={false}
          />
        );

        const names = orderedNames(container);
        const savantIdx = names.indexOf('Savant');
        const dawnIdx = names.indexOf('Dawn');
        expect(savantIdx).toBeGreaterThanOrEqual(0);
        expect(dawnIdx).toBe(savantIdx + 1);
        unmount();
      }
    });

    it('prompts the storyteller to prepare the two statements instead of quoting the ability', () => {
      render(
        <NightOrderWidget
          players={savantPlayers}
          timeOfDay="night"
          dayNumber={1}
          isLightModeActive={false}
        />
      );

      expect(screen.getByText(/Decide 2 things to tell the Savant/)).toBeInTheDocument();
      expect(screen.queryByText(/you may visit the Storyteller/)).toBeNull();
    });

    it('stays out of the list when no Savant is in play', () => {
      const { container } = render(
        <NightOrderWidget
          players={mockPlayers}
          timeOfDay="night"
          dayNumber={1}
          isLightModeActive={false}
        />
      );

      expect(orderedNames(container)).not.toContain('Savant');
    });
  });

  it('allows checking and resetting checkboxes', () => {
    const handleSetCheckedItems = vi.fn();
    
    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={1}
        isLightModeActive={false}
        checkedItems={{}}
        onSetCheckedItems={handleSetCheckedItems}
      />
    );

    // The reset button is the first button (RotateCcw icon), let's find the checklist items
    const lunaticRow = screen.getByText('Lunatic', { selector: '.font-serif' }).closest('div');
    expect(lunaticRow).toBeInTheDocument();
    
    if (lunaticRow) {
      fireEvent.click(lunaticRow);
      expect(handleSetCheckedItems).toHaveBeenCalled();
    }
  });

  it('omits Dusk on the first night but shows it on other nights', () => {
    const { rerender } = render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={1}
        isLightModeActive={false}
      />
    );
    expect(screen.queryByText('Dusk', { selector: '.font-serif' })).toBeNull();

    rerender(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={2}
        isLightModeActive={false}
      />
    );
    expect(screen.getByText('Dusk', { selector: '.font-serif' })).toBeInTheDocument();
  });

  it('advances to day when Dawn is checked at night', () => {
    const handleToggleTimeOfDay = vi.fn();

    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={1}
        isLightModeActive={false}
        checkedItems={{}}
        onSetCheckedItems={vi.fn()}
        onToggleTimeOfDay={handleToggleTimeOfDay}
      />
    );

    fireEvent.click(screen.getByText('Dawn', { selector: '.font-serif' }).closest('div')!);
    expect(handleToggleTimeOfDay).toHaveBeenCalledTimes(1);
  });

  it('scrolls up to the page header when Dawn starts the day', () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    const board = document.createElement('div');
    board.id = 'page-header-divider';
    board.scrollIntoView = scrollIntoView;
    document.body.appendChild(board);

    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={1}
        isLightModeActive={false}
        checkedItems={{}}
        onSetCheckedItems={vi.fn()}
        onToggleTimeOfDay={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Dawn', { selector: '.font-serif' }).closest('div')!);
    act(() => vi.runAllTimers());

    expect(scrollIntoView).toHaveBeenCalled();

    board.remove();
    vi.useRealTimers();
  });

  it('advances to the next night when Dusk is checked during the day', () => {
    const handleToggleTimeOfDay = vi.fn();

    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="day"
        dayNumber={1}
        isLightModeActive={false}
        checkedItems={{}}
        onSetCheckedItems={vi.fn()}
        onToggleTimeOfDay={handleToggleTimeOfDay}
      />
    );

    fireEvent.click(screen.getByText('Dusk', { selector: '.font-serif' }).closest('div')!);
    expect(handleToggleTimeOfDay).toHaveBeenCalledTimes(1);
  });

  it('does not change phase when a phase step is checked in the phase it leads to', () => {
    const handleToggleTimeOfDay = vi.fn();
    const handleSetCheckedItems = vi.fn();

    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={2}
        isLightModeActive={false}
        checkedItems={{}}
        onSetCheckedItems={handleSetCheckedItems}
        onToggleTimeOfDay={handleToggleTimeOfDay}
      />
    );

    fireEvent.click(screen.getByText('Dusk', { selector: '.font-serif' }).closest('div')!);
    expect(handleToggleTimeOfDay).not.toHaveBeenCalled();
    expect(handleSetCheckedItems).toHaveBeenCalledWith({ dusk: true });
  });

  it('clears the checklist on Dawn but never on Dusk', () => {
    function Harness({ startAt }: { startAt: 'night' | 'day' }) {
      const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>(startAt);
      const [dayNumber, setDayNumber] = useState(1);
      const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

      return (
        <NightOrderWidget
          players={mockPlayers}
          timeOfDay={timeOfDay}
          dayNumber={dayNumber}
          isLightModeActive={false}
          checkedItems={checkedItems}
          onSetCheckedItems={setCheckedItems}
          onToggleTimeOfDay={() => {
            if (timeOfDay === 'night') {
              setTimeOfDay('day');
            } else {
              setTimeOfDay('night');
              setDayNumber(prev => prev + 1);
            }
          }}
        />
      );
    }

    const lunatic = () => screen.getByText('Lunatic', { selector: '.font-serif' });
    const dusk = () => screen.getByText('Dusk', { selector: '.font-serif' });
    const dawn = () => screen.getByText('Dawn', { selector: '.font-serif' });

    render(<Harness startAt="day" />);

    fireEvent.click(lunatic().closest('div')!);
    expect(lunatic().className).toContain('line-through');

    fireEvent.click(dusk().closest('div')!);

    expect(screen.getByText('Night 2')).not.toHaveClass('invisible');
    expect(dusk().className).toContain('line-through');
    expect(lunatic().className).toContain('line-through');

    fireEvent.click(dawn().closest('div')!);

    expect(screen.getByText('Day 2')).not.toHaveClass('invisible');
    expect(dawn().className).not.toContain('line-through');
    expect(dusk().className).not.toContain('line-through');
    expect(lunatic().className).not.toContain('line-through');

    fireEvent.click(dusk().closest('div')!);

    expect(screen.getByText('Night 3')).not.toHaveClass('invisible');
    expect(dusk().className).toContain('line-through');
  });

  it('makes Minion Info and Demon Info checkable', () => {
    const handleSetCheckedItems = vi.fn();

    render(
      <NightOrderWidget
        players={mockPlayers}
        timeOfDay="night"
        dayNumber={1}
        isLightModeActive={false}
        checkedItems={{}}
        onSetCheckedItems={handleSetCheckedItems}
      />
    );

    fireEvent.click(screen.getByText('Minion Info', { selector: '.font-serif' }).closest('div')!);
    expect(handleSetCheckedItems).toHaveBeenCalledWith({ minioninfo: true });

    fireEvent.click(screen.getByText('Demon Info', { selector: '.font-serif' }).closest('div')!);
    expect(handleSetCheckedItems).toHaveBeenCalledWith({ demoninfo: true });
  });

  it('appends an in-play custom character with its own first-night order', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Alice', roleId: 'sculptor', isDead: false },
      { id: 'p2', name: 'Bob', roleId: 'washerwoman', isDead: false },
    ];
    const scriptRoles: Role[] = [
      { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
      {
        id: 'sculptor', name: 'Sculptor', team: 'townsfolk',
        firstNight: 18, firstNightReminder: 'The Sculptor wakes.',
      },
    ];
    render(
      <NightOrderWidget
        players={players}
        timeOfDay="night"
        dayNumber={1}
        isLightModeActive={false}
        scriptRoles={scriptRoles}
      />
    );
    expect(screen.getByText('Sculptor', { selector: '.font-serif' })).toBeInTheDocument();
    expect(screen.getByText('The Sculptor wakes.')).toBeInTheDocument();
  });

  it('omits a custom character that has no order for the active night', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Alice', roleId: 'daydreamer', isDead: false },
    ];
    const scriptRoles: Role[] = [
      // Acts only on the first night, so it must not appear on other nights.
      { id: 'daydreamer', name: 'Daydreamer', team: 'townsfolk', firstNight: 12, firstNightReminder: 'Wake.' },
    ];
    render(
      <NightOrderWidget
        players={players}
        timeOfDay="night"
        dayNumber={2}
        isLightModeActive={false}
        scriptRoles={scriptRoles}
      />
    );
    expect(screen.queryByText('Daydreamer', { selector: '.font-serif' })).toBeNull();
  });

  describe('fullNightOrder', () => {
    // Poisoner and Fortune Teller both wake on night 1 but nobody here is playing them.
    const scriptRoles: Role[] = [
      { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'fortuneteller', name: 'Fortune Teller', team: 'townsfolk' },
    ];
    const players: Player[] = [
      { id: 'p1', name: 'Charlie', roleId: 'washerwoman', isDead: false },
    ];

    it('lists script characters that are not in play, marked Not in play', () => {
      render(
        <NightOrderWidget
          players={players}
          timeOfDay="night"
          dayNumber={1}
          isLightModeActive={false}
          scriptRoles={scriptRoles}
          fullNightOrder
        />
      );

      expect(screen.getByText('Poisoner', { selector: '.font-serif' })).toBeInTheDocument();
      expect(screen.getByText('Fortune Teller', { selector: '.font-serif' })).toBeInTheDocument();
      expect(screen.getByText('Washerwoman', { selector: '.font-serif' })).toBeInTheDocument();
      expect(screen.getAllByText('Not in play')).toHaveLength(2);
      // The in-play character still shows its player, and needs no badge.
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('omits characters outside the script even when on', () => {
      render(
        <NightOrderWidget
          players={players}
          timeOfDay="night"
          dayNumber={1}
          isLightModeActive={false}
          scriptRoles={scriptRoles}
          fullNightOrder
        />
      );
      expect(screen.queryByText('Imp', { selector: '.font-serif' })).toBeNull();
    });

    it('keeps the in-play-only list when off', () => {
      render(
        <NightOrderWidget
          players={players}
          timeOfDay="night"
          dayNumber={1}
          isLightModeActive={false}
          scriptRoles={scriptRoles}
        />
      );
      expect(screen.queryByText('Poisoner', { selector: '.font-serif' })).toBeNull();
      expect(screen.getByText('Washerwoman', { selector: '.font-serif' })).toBeInTheDocument();
    });

    it('includes out-of-play homebrew characters in night order', () => {
      const homebrew: Role[] = [
        { id: 'sculptor', name: 'Sculptor', team: 'townsfolk', firstNight: 3, firstNightReminder: 'The Sculptor wakes.' },
      ];
      render(
        <NightOrderWidget
          players={[]}
          timeOfDay="night"
          dayNumber={1}
          isLightModeActive={false}
          scriptRoles={homebrew}
          fullNightOrder
        />
      );
      expect(screen.getByText('Sculptor', { selector: '.font-serif' })).toBeInTheDocument();
      expect(screen.getByText('The Sculptor wakes.')).toBeInTheDocument();
    });
  });
});
