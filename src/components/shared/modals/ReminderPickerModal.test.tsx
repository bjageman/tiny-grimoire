import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReminderPickerModal from './ReminderPickerModal';
import { PLAYABLE_ROLES } from '../../../utils/roleData';
import remindersData from '../../../reminders.json';

const props = {
  targetPlayerName: 'Alice',
  onSelect: vi.fn(),
  onClose: vi.fn(),
  rolesData: PLAYABLE_ROLES,
  isLightModeActive: false,
};

describe('ReminderPickerModal reminder sources', () => {
  it('uses reminders.json for a character it lists', () => {
    render(<ReminderPickerModal {...props} activeRoleIds={['washerwoman']} />);
    (remindersData as Record<string, string[]>).washerwoman.forEach(text => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  // Merging the role data gave these characters reminders upstream; reminders.json deliberately gives them none.
  it('honours a deliberate empty list rather than falling back to the merged role data', () => {
    const drunk = PLAYABLE_ROLES.find(r => r.id === 'drunk')!;
    expect(drunk.remindersGlobal ?? []).not.toHaveLength(0);
    expect((remindersData as Record<string, string[]>).drunk).toEqual([]);

    render(<ReminderPickerModal {...props} activeRoleIds={['drunk']} />);
    expect(screen.queryByText('Is The Drunk')).toBeNull();
  });

  it('falls back to the role for a custom character reminders.json has never heard of', () => {
    const custom = { id: 'homebrewer', name: 'Homebrewer', team: 'townsfolk' as const, reminders: ['Brewed'] };
    render(<ReminderPickerModal {...props} rolesData={[custom]} activeRoleIds={['homebrewer']} />);
    expect(screen.getByText('Brewed')).toBeInTheDocument();
  });
});
