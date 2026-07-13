import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NightOrderWidget from './NightOrderWidget';
import type { Player } from '../../types';

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

    // Already night: ticking Dusk just records the step, it must not flip to day
    fireEvent.click(screen.getByText('Dusk', { selector: '.font-serif' }).closest('div')!);
    expect(handleToggleTimeOfDay).not.toHaveBeenCalled();
    expect(handleSetCheckedItems).toHaveBeenCalledWith({ dusk: true });
  });

  it('keeps the Dusk check but clears the rest when it advances to the next night', () => {
    // Mirrors how the game screens wire the widget up: night -> day, day -> next night
    function Harness() {
      const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>('day');
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

    render(<Harness />);

    const lunatic = () => screen.getByText('Lunatic', { selector: '.font-serif' });
    const dusk = () => screen.getByText('Dusk', { selector: '.font-serif' });

    fireEvent.click(lunatic().closest('div')!);
    expect(lunatic().className).toContain('line-through');

    fireEvent.click(dusk().closest('div')!);

    // We are now on the next night, with Dusk still ticked and the wakes cleared
    expect(screen.getByText('Night 2')).not.toHaveClass('invisible');
    expect(dusk().className).toContain('line-through');
    expect(lunatic().className).not.toContain('line-through');
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
});
